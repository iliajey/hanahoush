# Phase 9B — ERP Connector Foundation Report

**Status:** ✅ COMPLETE — READY FOR REVIEW
**Date:** 2026-08-11
**Phase:** 9B — ERP / hanRP connector foundation
**Discovery:** `docs/reports/phase-09B-discovery.md`

---

## 0. Executive summary

Phase 9B executed the two-part mandate: **(1) discover** the real hanRP/Odoo environment,
and **(2) build the clean connector foundation** around verified capabilities.

Discovery concluded **REAL ERP ACCESS: NOT AVAILABLE** — no hanRP/Odoo endpoint, credential,
version, module list, or API documentation exists anywhere in this project or environment
(see `docs/reports/phase-09B-discovery.md`). Per the phase brief, no real ERP server was
contacted, no endpoint/model/auth flow was invented, and no Odoo version or protocol was
assumed.

The connector foundation was then implemented strictly within what Phase 9A had already
decreed: a provider port, the safe `NullProvider` default, a provider-agnostic HTTP client
(timeouts/retries/backoff/request-ID/error-normalization/secret-redaction), a
configuration-driven provider registry, `ERP_*` settings, and a staff-only health endpoint.
The `OdooHanRPProvider` adapter implements **only** `health_check()` and `get_capabilities()`;
every resource/event operation raises `ERPOperationNotSupportedError` until a real mapping is
verified (Phase 9C+). With `ERP_ENABLED=false` (the delivered default) the application behaves
**exactly** as it did at the end of Phase 9A — verified by the full existing test suite.

---

## 1. Environment discovery

Search scope: the whole repository (`backend/`, `frontend/`, `docs/`, `scripts/`, env files,
settings). Full reproducible search tables are in the discovery report. Outcome:

- No `ERP_ENABLED`, `ERP_PROVIDER`, `ERP_BASE_URL`, `ERP_AUTH_TYPE`, `ERP_API_KEY`,
  `ERP_WEBHOOK_SECRET` or any `ODOO_*` variable exists in `backend/.env`,
  `backend/.env.example`, or `config/settings/*.py`.
- No JSON-RPC / XML-RPC / REST endpoint, host, database, or API URL is configured or documented.
- No ERP credentials of any kind exist in source, env files, or docs.
- The only `ERP`/`Odoo`/`hanRP` occurrences are marketing content (page-builder `erp` section
  type, seed copy, frontend marketing components) and the Phase 9A architecture docs describing
  the *future* integration. None is integration configuration.

## 2. ERP availability

**REAL ERP ACCESS: NOT AVAILABLE.** No sandbox/staging endpoint, no test credentials, no
operator-provided discovery package. All compatibility-matrix rows remain `unverified`.

## 3. Odoo version if verified

**Not verified.** No Odoo version/edition is known; none was assumed. The connector does not
branch on any version.

## 4. hanRP modules if verified

**Not verified.** No custom hanRP module names/versions are known; `apps/integration` contains
no module-specific code.

## 5. Authentication mechanism if verified

**Not verified.** `ERP_AUTH_TYPE` is a configuration slot (`api_key` default, reserved for
`oauth2` / `service_account`) exactly as Phase 9A decreed. No adapter performs any
authentication because no mechanism has been verified and no credential exists.

## 6. API mechanism if verified

**Not verified.** The phase did not assume JSON-RPC vs REST vs XML-RPC. The HTTP client is
protocol-agnostic; the `OdooHanRPProvider` adapter has no endpoint mapping.

## 7. Provider architecture

Implemented per ADR-0006 and `docs/architecture/erp-integration.md`, following the existing
`apps/common` Clean Architecture conventions:

```
apps/integration/
├── apps.py                            IntegrationConfig (no models)
├── domain/                            framework-free
│   ├── interfaces/erp_provider.py     ERPProvider port (ABC)
│   ├── exceptions/erp_errors.py       ERP error taxonomy (ADR-0011)
│   └── value_objects/provider_health.py  ProviderHealth / ProviderCapabilities
├── application/
│   └── services/erp_status_service.py ErpStatusService (status payload, cache)
├── infrastructure/
│   ├── transport/http_transport.py    stdlib http.client transport (connect/read/overall)
│   ├── redaction.py                   secret redaction helpers
│   └── providers/
│       ├── base_http_provider.py      shared client: retries/backoff/errors/ids/logging
│       ├── null_provider.py           NullProvider (safe default)
│       ├── odoo_hanrp.py              OdooHanRPProvider (health+capabilities only)
│       └── registry.py                config-driven selection + validation
├── presentation/
│   └── api/
│       ├── permissions.py             IsIntegrationOperator (staff/integration.view)
│       ├── views.py                   ErpHealthView (staff-only)
│       └── urls.py                    /api/v1/integration/erp/health/
├── migrations/__init__.py             empty (no models → no migrations)
└── tests/                            6 test modules (62 tests)
```

Rules honoured: the port is a plain Python ABC with no Django/HTTP/Odoo imports; adapters are
the only place that knows provider specifics; cross-cutting retry/backoff lives in the shared
HTTP base (identical behaviour per provider); provider selection is configuration-driven.

## 8. Connector implementation

### 8.1 `ERPProvider` port
Six capabilities, bounded to what Phase 9A named and what later phases require:
`name`, `health_check()`, `get_capabilities()`, `get_resource()`, `create_resource()`,
`update_resource()`, `send_event()`.

### 8.2 `NullProvider`
Active whenever `ERP_ENABLED=false` (or the provider config is invalid). `health_check()`
reports `disabled`; every resource/event operation raises `ERPOperationNotSupportedError`.
**No network calls.**

### 8.3 HTTP base client (provider-agnostic)
- `ERP_CONNECT_TIMEOUT` / `ERP_READ_TIMEOUT` / `ERP_TIMEOUT` genuine timeout handling via
  stdlib `http.client` (no new dependency; `requests` is not installed).
- Bounded retries (`ERP_RETRY_COUNT`, default 3) with exponential backoff + jitter
  (`ERP_RETRY_BACKOFF`, `ERP_RETRY_BACKOFF_CAP`).
- Retryable: network/timeout errors, HTTP 408/429/5xx. Non-retryable: 400/401/403/422.
  `Retry-After` parsed on 429.
- `X-Request-ID` propagated on every outbound call (request-ID middleware base).
- Every transport failure normalized to the ERP taxonomy (`ERPTimeoutError`,
  `ERPConnectionError`, `ERPAuthError`, `ERPValidationError`, …); no raw errors escape.
- Safe logging: only provider/method/path/attempt/status/request-id + redacted URL; never
  payloads, credentials, or raw responses (`redact_headers`, `redact_url`).
- Transport is dependency-injected so the normal test suite never touches the network.

### 8.4 `OdooHanRPProvider`
Only `health_check()` (bounded read-only connectivity probe against the configured
`ERP_BASE_URL`, never raises) and `get_capabilities()` (`verified=False`). All resource/event
operations raise `ERPOperationNotSupportedError` — the honest result of zero verified mapping.

### 8.5 Provider registry
`ERP_PROVIDER=none|null|odoo_hanrp`; unknown/misconfigured providers fall back to
`NullProvider` with a warning. `validate_erp_config()` powers this and the tests.

## 9. Configuration

Added to `config/settings/base.py` and `.env.example` (values only — no secrets):

`ERP_ENABLED` (default `false`), `ERP_PROVIDER` (default `null`), `ERP_AUTH_TYPE`,
`ERP_BASE_URL`, `ERP_TIMEOUT` (30), `ERP_CONNECT_TIMEOUT` (5), `ERP_READ_TIMEOUT` (15),
`ERP_RETRY_COUNT` (3), `ERP_RETRY_BACKOFF` (1), `ERP_RETRY_BACKOFF_CAP` (30),
`ERP_API_KEY`, `ERP_WEBHOOK_SECRET` (reserved, empty).

Rules: `.env` was **not** modified; no credential has a default; the app is safe with
`ERP_ENABLED=false` (verified by tests).

## 10. Health/status implementation

- `GET /api/v1/integration/erp/health/?probe=<true|false>` — staff/integration-operator only;
  never public. Response is the standard envelope; `Cache-Control: no-store`; returns provider,
  enabled, connectivity, latency_ms, details (URLs redacted), checked_at, error, request_id.
- `probe=true` performs the bounded connectivity probe only when ERP is enabled (it targets the
  configured `ERP_BASE_URL`, never caller input). Disabled → reports `disabled` with zero
  network. Cached (15 s TTL) so repeated reads never hammer the ERP host.
- OpenAPI: documented via `@extend_schema`; schema validates (`drf-spectacular`).

## 11. Security

- No secrets in source/logs/responses: redaction helpers + sanitized status payloads
  (`base_url`/`url`/`endpoint` redacted), structured logs carry ids/status only.
- Staff-only operational endpoint (`IsIntegrationOperator`: superuser | is_staff | admin role |
  `integration.view` codename). `integration.view` added to the existing permission catalog
  (`apps/accounts/seeders.py`) and granted to SUPER_ADMIN + COMPANY_ADMIN; the
  `integration.manage/configure` codenames remain Phase 9E.
- SSRF control: the client contacts only the configured `ERP_BASE_URL`; the health endpoint's
  `probe` never accepts a host from a request. Arbitrary-URL configuration documented as an
  operator-controlled env value.
- Timeouts bounded; no response-size limits implemented yet (no ERP reads exist) — noted
  under limitations for the future adapter.
- Auth failures are non-retryable, normalized to `ERPAuthError`, logged without credentials.
- Webhook secret (`ERP_WEBHOOK_SECRET`) is reserved-but-empty; the webhook receiver is NOT
  implemented (Phase 9D) — no surface to protect yet.
- No DB model was introduced; no data write path exists, so no auth-configured writes.

## 12. Tests

`backend/apps/integration/tests/` — **62 tests**, all offline (fake transport, no ERP server):

| Module | Covers |
|---|---|
| `test_redaction.py` | secret/header/URL/payload redaction |
| `test_null_provider.py` | disabled health, empty capabilities, every operation raises not-supported |
| `test_base_http_provider.py` | timeout, retry-then-success, exhaust-retries, non-retryable (400/401/403), 429+Retry-After, malformed JSON, request-ID propagation, URL join, no payload leakage |
| `test_odoo_hanrp.py` | name, unverified capabilities, unsupported ops, health ok/error/unavailable, never-raises |
| `test_provider_registry.py` | config validation (valid/unknown/missing-URL/bad-scheme/disabled), safe defaults, selection + fallback |
| `test_erp_status_service.py` | disabled no-network, probe path, cache reuse, URL redaction |
| `test_erp_health_api.py` | authorization (anon 401 / non-staff 403 / staff / superuser / admin role / integration.view), payload shape, no-store, request_id, probe-disabled-no-network, POST 405 |

Provider "swap" and "disabled" behaviours are proven by `test_provider_registry.py` +
`test_erp_status_service.py`. No test depends on ERP availability.

## 13. Build verification

| Check | Result |
|---|---|
| `python manage.py check` | ✅ no issues |
| `python manage.py makemigrations --check --dry-run` | ✅ no changes detected |
| `python manage.py migrate` | ✅ "No migrations to apply" |
| Backend `pytest` (SQLite CI fallback) | ✅ **274 passed** (212 baseline + 62 new) |
| Backend ruff on new code | ✅ clean (`apps/integration` all checks passed) |
| OpenAPI schema (`drf-spectacular` validate_schema) | ✅ valid; `/api/v1/integration/erp/health/` present |
| Frontend `npm run typecheck` | ✅ |
| Frontend `npm run lint` | ✅ |
| Frontend `npm run test` | ✅ 147 passed (baseline unchanged) |
| Frontend `npm run build` | ✅ |
| Frontend `npm run build-storybook` | ✅ |

No pre-existing route, API, auth, admin, CMS, Page Builder, or content feature was touched
(seeders gained one additive permission row; no schema/logic change).

## 14. Migration status

**No migrations.** `apps/integration` is a model-less app (mirrors the `apps.user` scaffold
convention); `makemigrations --check` reports no pending changes and `migrate` applied nothing.

## 15. Files created / modified

Created (backend):
`backend/apps/integration/{apps.py, __init__.py, domain/interfaces/erp_provider.py,
domain/exceptions/erp_errors.py, domain/value_objects/provider_health.py,
application/services/erp_status_service.py,
infrastructure/transport/http_transport.py, infrastructure/redaction.py,
infrastructure/providers/{base_http_provider,null_provider,odoo_hanrp,registry}.py,
presentation/api/{views,urls,permissions}.py, migrations/__init__.py}` + layer
`__init__.py` scaffold.

Created (tests): `backend/apps/integration/tests/{test_redaction,test_null_provider,
test_base_http_provider,test_odoo_hanrp,test_provider_registry,test_erp_status_service,
test_erp_health_api}.py`

Created (docs): `docs/reports/phase-09B-discovery.md`, `docs/reports/phase-09B-report.md`.

Modified:
- `backend/config/settings/base.py` — ERP settings block, `apps.integration` in `INSTALLED_APPS`,
  `apps.integration(.errors)` loggers.
- `backend/.env.example` — ERP configuration block (template values only).
- `backend/config/api/v1.py` — mounts `integration/` namespace.
- `backend/apps/accounts/seeders.py` — `integration.view` permission (+ SUPER_ADMIN auto,
  COMPANY_ADMIN explicit).
- `docs/architecture/erp-integration.md`, `docs/architecture/erp-security.md` — implementation
  status notes.
- `CHANGELOG.md`, `NEXT_PHASE.md`, `docs/reports/next-phase.md` — Phase 9B tracking.

## 16. Real ERP calls performed

**None.** No ERP host was contacted, probed, or scanned. `ERP_ENABLED=false` everywhere and the
health endpoint's probe path is disabled-by-default. No real smoke test exists (there is no
target).

## 17. Statement on ERP data modification

**No ERP data was created, updated, or deleted — no ERP was contacted at all.** The website's
own data was untouched (no migrations, no model changes, no data writes).

## 18. Known limitations

- The `OdooHanRPProvider` cannot read/write/send events until the real hanRP mapping is
  verified (by design). Business flows that "appear missing" are intentionally deferred.
- Response-size limits and pagination handling are not implemented (no verified read path
  exists); they surface with the first real adapter.
- OAuth2/API-key/service-account authentication plumbing exists only as configuration; the
  exhaustive auth handling belongs to Phase 9C against a real environment.
- Circuit breaker and idempotency store were not added: Phase 9A placed idempotency + circuit
  breaker in the sync service/outbox (Phase 9C) and the connector introduces no mutating path
  today. The HTTP base already centralizes the retry policy those will reuse.
- No Django-admin ERP surface: no models exist and env config is sufficient; the quickest ops
  surface is the health API. The admin status dashboard is Phase 9E work.
- `LOCAL_APPS`/`INSTALLED_APPS` now include `apps.integration`; verified harmless with
  `ERP_ENABLED=false`.

## 19. Deferred work (carried to later phases)

Per the phase brief, **not implemented**: customer/lead/contact/invoice/project/product/
employee/CRM synchronization, ERP webhooks, background queues, outbox persistence, scheduled
reconciliation, AI, customer portal. Also deferred: `integration.manage` /
`integration.configure` codenames (9E), admin status dashboard (9E), response-size/pagination
handling for future reads, renewable token handling (9C).

## 20. Exact prerequisites for Phase 9C

Phase 9C (Website→ERP operational flows) must be preceded by the operator discovery package:

1. **Odoo/hanRP version + edition** and gateway/REST surface type.
2. **Sandbox/staging instance** access with **scoped test credentials** (never production).
3. **Verified authentication mechanism** (OAuth2 client-credentials / scoped API key /
   service-account) + rotation procedure.
4. **API documentation / schema**: endpoint paths, methods, payloads, pagination, error format.
5. **Entity mappings** for the ownership-matrix rows: ERP model names, required fields, value
   enums, dedup key (external id).
6. **Webhook capability** (registration, payloads, signing) — Phase 9D.
7. **Rate limits**, maintenance windows, incident contact.

Hand-offs from 9B the 9C team can rely on: the provider port, `NullProvider`, the HTTP base
(retry/backoff/request-ID/error taxonomy), the registry, and tests that prove swap-safety.
Only after mapping verification should `OdooHanRPProvider` gains real operations, and
`ERP_ENABLED=true` + `ERP_BASE_URL` + secrets be enabled **in staging only**.

## 21. Risks

- **Unverified ERP facts (unchanged from 9A):** the biggest risk is that the real hanRP API
  differs from the (explicitly un-assumed) design. Mitigated by discovery-first, feature
  gating, and `verified=False` capabilities.
- **Quiet over-granting:** `integration.view` is additive; if a future phase wants tighter
  control it should gate endpoint reads on codename instead of `IsStaffOrAdmin`-style checks.
- **LocMem cache** for the health snapshot is process-local (pre-existing platform property).
- **Repo not under version control** in this environment (pre-existing) — no baseline diff
  history available.

## 22. Rollback considerations

- **Backend:** remove `apps.integration` from `INSTALLED_APPS` and the two LOGGING entries, the
  ERP settings block, the `integration/` include in `config/api/v1.py`, the `integration.view`
  seed row, and delete `backend/apps/integration/` + the two new docs/CHANGELOG/NEXT_PHASE
  edits. **No migration exists to reverse**; `.env.example` can be trimmed.
- **Runtime:** `ERP_ENABLED=false` (current) keeps behaviour identical; setting
  `ERP_PROVIDER=null` alone is also sufficient because the registry falls back safely.
- **Db:** no schema change, no data touched — nothing to restore.
- **Frontend:** untouched; nothing to roll back.

---

## FINAL: phase completion statement

**PHASE 9B COMPLETE — READY FOR REVIEW**

- **Report path:** `docs/reports/phase-09B-report.md`
- **Discovery report path:** `docs/reports/phase-09B-discovery.md`
- **Test results:** backend `pytest` **274 passed** (62 new integration tests, all offline);
  frontend `typecheck`/`lint`/`test` (147)/`build`/`build-storybook` all green.
- **Migration status:** no migrations — `makemigrations --check` no changes, `migrate` no-op.
- **Real ERP server contacted:** **No.** `ERP_ENABLED=false`; `OdooHanRPProvider` exposes only
  `health_check`/`get_capabilities`; no ERP endpoint, model, or auth flow was invented. No ERP
  data was modified.