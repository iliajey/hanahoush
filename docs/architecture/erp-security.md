# ERP Security Architecture (Phase 9A)

## Purpose

Defines how Hanahoush will authenticate to hanRP/Odoo, how inbound ERP webhooks are secured, the
error/retry/idempotency design, and the security model (RBAC integration, PII, data
minimization, secret handling, logging restrictions). No credentials are stored or generated in
this phase; the design only fixes the mechanisms and configuration contract.

## 1. Authentication contract (Website → ERP)

Hanahoush authenticates to the ERP through the **provider adapter**. The mechanism is selected
by configuration, not hard-coded. The following options were evaluated:

| Option | Evaluation | Recommendation |
|---|---|---|
| Static API key | Simple, works with most Odoo/REST gateways; weak rotation story, must be scoped + least-privilege | **Recommended default** for service-to-service when the ERP exposes an API-key gateway |
| OAuth2 (client credentials) | Industry standard, token lifetime + refresh, revocable; requires ERP support | **Recommended when available**; preferred long-term |
| Service account (ERP user) | Odoo-native (login/password or API key per user); ties to ERP users, must be dedicated + limited | Fallback for Odoo JSON-RPC until a gateway exists |
| Odoo session cookie (uid/session_id) | Fragile, ties to ERP session management | Not recommended; document as a discovery answer only |
| mTLS | Strong transport identity; infra-dependent, hard to debug | Optional production hardening where TLS at the ERP gateway supports it |
| Signed webhook (HMAC) | Inbound-direction mechanism, not outbound auth | See section 3 |

**Decision:** the adapter supports **OAuth2 client-credentials when the ERP offers it**, and
falls back to a **scoped API key or dedicated service-account** otherwise, all behind the same
provider interface. `ERP_AUTH_TYPE` selects the mechanism; no mechanism is hard-coded into
domain code.

### Configuration contract

The following environment variables are defined (documented; not added to `.env` yet — Phase 9B
adds them to `.env.example` when the connector is implemented):

| Variable | Purpose |
|---|---|
| `ERP_ENABLED` | master switch (default `false`; the app runs with NullProvider) |
| `ERP_PROVIDER` | provider key (`odoo_hanrp` / `null`) |
| `ERP_AUTH_TYPE` | `oauth2` \| `api_key` \| `service_account` |
| `ERP_BASE_URL` | ERP base URL (no trailing slash) |
| `ERP_TIMEOUT` | total request timeout |
| `ERP_CONNECT_TIMEOUT` | connection timeout |
| `ERP_READ_TIMEOUT` | read timeout |
| `ERP_RETRY_COUNT` | max retries |
| `ERP_WEBHOOK_SECRET` | shared HMAC secret for inbound webhooks |
| `ERP_API_KEY` / OAuth fields | credentials, injected from the secret store |
| `ERP_ENABLE_RETRY` / `ERP_RETRY_BACKOFF` | retry policy knobs |

> **Phase 9B status:** the `ERP_*` settings above are now implemented in
> `config/settings/base.py` and listed (values only, never secrets) in `.env.example`.
> `ERP_API_KEY` and `ERP_WEBHOOK_SECRET` are consumed in Phase 9C (outbound auth) and 9D
> (inbound webhooks) respectively; until then they default to empty and are unused.

### Secret storage and rotation

- **Never commit secrets.** Credentials come from environment variables or a secret manager
  (production), exactly like `DJANGO_SECRET_KEY`.
- **Rotation** must not require code changes: change the secret/rotation config in the
  environment, then call a (Phase 9E) `POST /api/v1/integration/erp/rotate/` or equivalent that
  refreshes the provider credential handle.
- **Token lifetime:** access tokens short-lived (minutes–hours per ERP policy); refresh tokens
  or API keys rotated on a schedule agreed with the ERP operator.
- **Failure behavior:** auth failure is **non-retryable** (do not retry 401/403); the provider
  enters an `auth_failed` state, surfaces in `/integration/erp/status/`, and logs a
  non-sensitive message (`auth_failed for provider=<p>`, never the credential).
- **Audit:** every credential rotation and auth failure is recorded via the existing
  `AuditEvent`/admin `LogEntry` mechanisms (no new audit system).

## 2. Error / retry / idempotency design

### Timeouts

- `ERP_CONNECT_TIMEOUT` (default 5 s) — establishing the connection.
- `ERP_READ_TIMEOUT` (default 15 s) — waiting for a response body.
- `ERP_TIMEOUT` (default 30 s) — overall budget, overrides the sum for slow endpoints.

### Retry policy

- **Maximum retries:** `ERP_RETRY_COUNT` (default 3) plus the initial attempt.
- **Backoff:** exponential `base * 2^attempt` with jitter, `ERP_RETRY_BACKOFF` (default 1 s base,
  cap 30 s).
- **Retryable errors:** network failures, connection resets, timeouts, HTTP 408/429/5xx.
- **Non-retryable errors:** HTTP 4xx (except 408/429), auth failures, validation errors,
  malformed payloads — these surface immediately as failures with their normalized reason.
- **Rate limiting:** the ERP's 429 responses are retried with `Retry-After` honored, then
  become a `rate_limited` state after the retry budget; Hanahoush never hammers the ERP
  (throttle scopes on outbound dispatchers).
- **Circuit breaker:** after N consecutive provider failures (default 5), the provider opens for
  a cool-down window (default 60 s); during the open state outbound calls fail fast as
  `provider_unavailable` (never retried in-call; outbox items stay queued). Reset after the
  cool-down probe succeeds. This is implemented in the **sync service**, not the adapter.

### Idempotency

- **Idempotency keys:** every mutating outbound operation generates a key
  (`erp-<entity>-<uuid>`), stored with the outbox item.
- **Duplicate handling:** the provider sends the key; ERP-side dedup is expected. Locally, the
  outbox marks items delivered by key, so a re-delivery after a timeout (where the ERP may have
  processed it) is harmless — the ERP dedups, or Hanahoush reconciles by identity.
- **Partial failure:** per-record outcome; a partially failed batch keeps the failed records
  pending/dead-lettered and marks the rest delivered.
- **Dead-letter strategy:** items exceeding the retry budget move to a `failed` state (visible
  in sync history, retryable by staff) — the outbox table itself is the dead-letter store; no
  separate queue needed.

## 3. Webhook security (ERP → Website)

Inbound webhook receiver rules (implemented in Phase 9D):

- **Signature verification:** every webhook carries an `X-ERP-Signature` header computed as
  HMAC-SHA256 over the raw body with `ERP_WEBHOOK_SECRET` (hash-based, constant-time compare).
- **Timestamp validation:** requests outside a skew window (default 5 min) are rejected —
  prevents replay of old payloads.
- **Replay protection:** the webhook event `id` is stored; duplicate ids are acknowledged
  (200) and skipped.
- **Idempotency:** applying a webhook is idempotent by event id and by target record identity.
- **Payload validation:** strict schema validation (size, required fields, types); malformed
  payloads return 400 and are logged without the body.
- **Request size limits:** payloads capped (default 1 MB); oversized → 413.
- **Authentication:** webhook endpoints are **not** user-authenticated; the signature is the
  authentication. They are excluded from JWT/Cookie auth and from the public `AllowAny` default
  (explicit `permission_classes = []` + signature middleware).
- **Failure responses:** verified-and-accepted → 200; rejected signature → 401 (never 403, to
  avoid leaking handler presence); replay/duplicate → 200 (no-op); validation failure → 400;
  size → 413.
- **Logging without secrets:** log webhook id, event type, source, timestamp, outcome; **never**
  the raw payload, signatures, or shared secret.

## 4. Security model

### RBAC integration (no parallel permission system)

Reuses `apps.accounts` permissions and roles. New permission codenames are added to the existing
catalog (`apps/accounts/seeders.py`) in the phase that first needs them, following the
`editorial.*` precedent:

- `integration.view` — view ERP status / sync history / mapping status (staff surfaces).
- `integration.manage` — trigger synchronization, retry failed syncs.
- `integration.configure` — modify ERP configuration (rotate credentials, toggle provider).

Assignment is via existing roles (SUPER_ADMIN, COMPANY_ADMIN) and is extensible per the existing
role model.

| Action | Who may |
|---|---|
| View ERP status / sync history | staff with `integration.view` (staff/admin dashboard surface) |
| Trigger a sync / retry a failed sync | staff with `integration.manage` |
| Modify ERP configuration / rotate credentials | superuser or role with `integration.configure` |
| Receive inbound webhooks | only the webhook receiver (signature), no user required |
| Public exposure of ERP data | never — ERP status is staff-only, non-cacheable (`no-store`) |

### PII and data minimization

- **Only the minimal field set** defined in `erp-data-ownership.md` crosses the boundary.
- Consent flag (`ContactRequest.consent`) gates lead flows; no consent → no outbound lead.
- Contact data is sent with the same privacy expectations as the website (see
  `docs/architecture/analytics.md`); no credentials, tokens, or session data ever.
- Anonymous analytics never leaves the website.
- ERP status APIs return operational state, never customer records, on public paths.

### Logging restrictions

- Credentials, shared secrets, payload bodies, and signatures are never logged.
- Logs carry correlation/integration/sync ids and provider keys, not data.
- The existing logging pipeline is reused; the JSON formatter must include the new ids
  (see `erp-observability.md`).

## Related documents

- `docs/architecture/erp-integration.md` — where the provider boundary sits.
- `docs/architecture/erp-sync-strategy.md` — delivery semantics the security rules protect.
- `docs/architecture/erp-observability.md` — correlation ids for audit trails.
- `docs/architecture/security.md` — the existing website security model this extends.
- `docs/adr/ADR-0009` (authentication), `ADR-0010` (webhooks), `ADR-0011` (retry/idempotency).
