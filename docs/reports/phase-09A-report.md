# Phase 9A — ERP / hanRP Integration Architecture, Contracts & Foundation Design

**Status:** ✅ COMPLETE
**Date:** 2026-08-11
**Scope:** Architecture + contract + foundation design ONLY for the future hanRP/Odoo ERP
integration. No connector, no fake ERP APIs, no hard-coded Odoo schema, no server contact.

---

## 1. What was inspected

Before any change, the existing system was inventoried:

- **Backend architecture** — Django 5 + DRF + PostgreSQL, settings split
  `base/local/production/ci` via django-environ; Clean Architecture in `apps/common`
  (`domain → application → infrastructure → presentation`) with ports/adapters
  (`domain/interfaces/base_repository`, `infrastructure/repositories`); request-ID /
  API-logging / security-headers middleware; standard envelope
  (`{success, message, data, errors, request_id, pagination}`); `/api/v1` namespace versioning;
  drf-spectacular OpenAPI.
- **Feature apps (14)** — common, core, accounts, media_library, articles, projects, services,
  company, analytics, page_builder, editorial, search, seo, user (reference scaffold).
- **Models** — `accounts.User`, `Role`/`Permission`, `MediaFile`, `Article`, `Project`,
  `Service`, company singletons, `Visitor`/`PageView`/`ContactRequest`/`Newsletter`/
  `AnalyticsEvent`, `Page`/`PageSection`, editorial workflow models. Abstract bases
  `TimeStampedModel`, `SoftDeleteModel`, `apps.core.BaseModel` (audit trail, soft-delete),
  `SluggedNamedModel`, `PublishableModel`.
- **API infrastructure** — `config/api/base` (pagination, serializers, filters, ordering,
  viewsets, responses), health/version/ping, admin dashboard API, contact, newsletter, media,
  analytics ingestion, search, page-builder, editorial APIs.
- **Authentication** — SimpleJWT (rotation + blacklist, http-only cookies), login lockout,
  `LoginAudit`, `UserSession`, password-reset, throttles.
- **Permissions/RBAC** — `IsAdminUser`, `IsStaffOrAdmin`, `IsStaffOrReadOnly`, `HasRole`,
  `HasPermission`, `IsOwnerOrReadOnly`; permission catalog + 6 roles in
  `apps/accounts/seeders.py`; editorial ACL codenames (`editorial.*`).
- **Observability** — `RequestIDMiddleware` (`X-Request-ID`), `APILoggingMiddleware`,
  structured `LOGGING` (verbose + json formatters), `/api/health` (env/version/timestamp/
  request_id + staff migration check).
- **Analytics** — single `trackEvent` client + persistent `AnalyticsEvent`; never duplicated.
- **Caching** — `CACHES` LocMem 300 s; dashboard 60 s; sitemap cached + signal-invalidated.
- **CMS / Page Builder** — model-driven pages, section registry (45 section types), navigation/
  footer config; single CMS, single page builder.
- **ContactRequest / Project / Service / Article / User / media** — confirmed their existing
  shapes (see the data-ownership matrix for how each maps to ERP concepts).
- **Admin dashboard** — existing Django admin (`HanahoushAdminSite`) + staff dashboard API
  `GET /api/v1/admin/dashboard/` (to be extended, not replaced).
- **Environment config** — `.env`/`.env.example` conventions, throttle scopes, CORS, JWT,
  `ENVIRONMENT`/`APP_VERSION`/`SITE_URL`/`SEARCH_MIN_QUERY_LENGTH`/`ANALYTICS_EVENT_ALLOWLIST`.
- **Tests** — backend pytest (212) + `manage.py test` (160, SQLite CI fallback); frontend
  Vitest (147), typecheck, lint, build, Storybook build.
- **Documentation/reports** — `docs/architecture/*`, `docs/reports/*` (through phase-08H),
  `NEXT_PHASE.md`, `docs/reports/next-phase.md`, `CHANGELOG.md`, ADR series
  (`frontend/docs/adr/ADR-0001..0005`).

### What can be reused (inventory conclusions)

| Concern | Reused from |
|---|---|
| Response envelope / exception handler | `config.api.base.responses` |
| API versioning / throttles | `/api/v1` namespace + `DEFAULT_THROTTLE_RATES` (new scopes) |
| RBAC | `apps/accounts` permission classes + seeder catalog (add `integration.*` codenames later) |
| Request correlation | `RequestIDMiddleware` (base for correlation/sync IDs) |
| Logging | existing `LOGGING` pipeline (extend json formatter) |
| Analytics | `trackEvent` / `AnalyticsEvent` — ERP telemetry stays OUT of visitor analytics |
| Caching | `CACHES` (LocMem today; Redis-ready swap) |
| Base models | `apps.core.BaseModel`, `apps.common.infrastructure.models` |
| Clean Architecture pattern | `apps/common` ports/adapters (provider port mirrors `BaseRepository`) |
| Operational dashboard | `GET /api/v1/admin/dashboard/` (Phase 9E extends operations section) |
| Frontend operational surfaces | React Query + shared axios client + design system + RBAC routing (Phase 9E) |

Nothing was duplicated: no second CMS, page builder, analytics, API client, SEO, permission or
dashboard system was introduced.

## 2. What was created

| Path | Purpose |
|---|---|
| `docs/architecture/erp-integration.md` | ERP boundary + provider/adapter architecture + reuse inventory |
| `docs/architecture/erp-data-ownership.md` | Five-system model + full ownership matrix + sync rules |
| `docs/architecture/erp-sync-strategy.md` | Pattern comparison (REST/webhook/scheduled/outbox) + hybrid recommendation |
| `docs/architecture/erp-security.md` | Authentication contract, error/retry/idempotency, webhook security, security model |
| `docs/architecture/erp-observability.md` | ID model, structured logging, metrics, status surface |
| `docs/architecture/hanrp-odoo-compatibility.md` | Odoo discovery strategy + Phase 9B information checklist |
| `docs/adr/README.md` | ADR index (continues series from `frontend/docs/adr/ADR-0001..0005`) |
| `docs/adr/ADR-0006-erp-provider-abstraction.md` | Provider port/adapter decision |
| `docs/adr/ADR-0007-erp-data-ownership.md` | Data ownership / single source of truth |
| `docs/adr/ADR-0008-erp-sync-strategy.md` | Hybrid sync decision |
| `docs/adr/ADR-0009-erp-authentication.md` | Authentication decision |
| `docs/adr/ADR-0010-erp-webhook-strategy.md` | Webhook security decision |
| `docs/adr/ADR-0011-erp-retry-idempotency.md` | Error/retry/idempotency decision |
| `docs/reports/phase-09A-report.md` | This report |

## 3. What was modified

- `CHANGELOG.md` — Phase 9A entry added.
- `NEXT_PHASE.md` — rewritten as Phase 9B preparation.
- `docs/reports/next-phase.md` — rewritten as Phase 9B preparation.

No application code (backend or frontend) was modified. No migrations were created.

## 4. Architecture decisions (recorded)

| ADR | Decision |
|---|---|
| 0006 | ERP provider abstraction — Python ABC port + adapters (`OdooHanRPProvider`, `FutureProvider`, `NullProvider`); sync service owns retries/idempotency; config-driven selection |
| 0007 | Data ownership — owner-wins per field; single source of truth; mirrors carry `sync_key`; not-synced by default |
| 0008 | Hybrid sync — outbox (same-transaction) for Website→ERP; signed webhooks + scheduled reconciliation for ERP→Website; REST for lookups; scheduled for bulk |
| 0009 | Authentication — config-driven; OAuth2 client-credentials preferred, scoped API key / service account fallback; no committed secrets; rotation without code changes |
| 0010 | Webhooks — HMAC signature + timestamp validation + replay protection + idempotency + size caps; never user-auth |
| 0011 | Error/retry/idempotency — timeouts, exponential backoff, retryable/non-retryable taxonomy, circuit breaker, idempotency keys, per-record dead-letter in the outbox |

## 5. ERP boundary

```
Website (SPA) → /api/v1 (Hanahoush envelope) → Django backend + ERP Integration Layer
  → ERPProvider port → OdooHanRPProvider / FutureProvider / NullProvider → hanRP/Odoo
```

The website never talks to Odoo directly; all ERP traffic flows through the integration layer in
the Django process. Domain code depends only on the provider port; Odoo specifics live only in
adapters. Full detail in `docs/architecture/erp-integration.md`.

## 6. Data ownership matrix

See `docs/architecture/erp-data-ownership.md`. Summary:

- **Website-owned:** Article, Project public profile, Service marketing copy, Page, Company info,
  MediaFile, NewsletterSubscription (website is source; ERP may get copies), AnalyticsEvent
  (never leaves website).
- **ERP-owned:** Lead, Customer, Company (ERP), Employee, Sales, Invoices, Products/services
  catalog, Project delivery/status, Support triage.
- **Read-only mirror (ERP→Website):** selected public project delivery status; selected service
  catalog fields; lead/customer status for staff dashboards.
- **Event-derived:** leads created from `ContactRequest`; analytics aggregates.
- **Not synchronized:** `accounts.User`, employee data, invoices (until an explicit portal phase
  amends the matrix).
- **Shared/conflicts:** owner-wins by field; never bidirectional field sync; mirrors carry the
  owner `sync_key`.

## 7. Integration strategy

Hybrid (ADR-0008): outbox (same-transaction table + dispatcher command) for Website→ERP lead/
contact/newsletter/content-publish flows; signed webhook receiver + scheduled reconciliation for
ERP→Website status/catalog mirrors; REST through the adapter for health/lookups; scheduled jobs
for backfill and bulk. Eventual consistency is the default; real-time only where user-visible or
operationally meaningful. No broker dependency (Celery/Redis deferred). See
`docs/architecture/erp-sync-strategy.md`.

## 8. Authentication strategy

Config-driven `ERP_AUTH_TYPE`: OAuth2 client-credentials (preferred) or scoped API key /
dedicated service account (fallback); Odoo session cookies not recommended; mTLS optional. All
credentials from env/secret store, never committed; rotation without code changes; auth failures
non-retryable and audited; non-sensitive logging only. See `docs/architecture/erp-security.md`.

## 9. Retry / idempotency strategy

Connect 5 s / read 15 s / overall 30 s timeouts; up to 3 retries with exponential backoff
(1 s base, 30 s cap, jitter); retryable = network/timeout/408/429/5xx; non-retryable = other
4xx/auth/validation; 429 honors `Retry-After`; circuit breaker (5 failures → 60 s open);
idempotency keys (`erp-<entity>-<uuid>`) stored with outbox items; per-record partial failure;
outbox table doubles as dead-letter store. See `docs/architecture/erp-security.md` +
`docs/adr/ADR-0011`.

## 10. Webhook strategy

HMAC-SHA256 signature over the raw body (`ERP_WEBHOOK_SECRET`), timestamp skew window (5 min),
replay protection by event id, idempotent application, strict payload validation, 1 MB cap
(413), signature-only auth (excluded from JWT/Cookie auth and AllowAny default), logging without
payloads/signatures/secrets. See `docs/architecture/erp-security.md` + `docs/adr/ADR-0010`.

## 11. Security model

Reuses the existing RBAC (`apps/accounts`) — future codenames `integration.view` /
`integration.manage` / `integration.configure` added to the existing catalog (not a parallel
permission system). Viewing status/history = `integration.view`; triggering/retrying sync =
`integration.manage`; configuration/rotation = `integration.configure`. ERP status is staff-only
and `Cache-Control: no-store`. PII/data minimization per ownership matrix; consent gates lead
flows; analytics never leaves the website; no secrets/payloads in logs. See
`docs/architecture/erp-security.md`.

## 12. Observability model

Four IDs layered on `X-Request-ID`: `request_id` (per request), `correlation_id` (per
operation), `integration_id` (per environment/provider), `sync_id` (per sync run). Reuses the
existing structured-log pipeline (new JSON fields, `apps.integration` loggers). Metrics derived
from existing aggregates surfaced via the staff dashboard API — no second analytics platform, no
Sentry/APM (deferred to 9F). Proposed staff-only status surface
`GET /api/v1/integration/erp/status/` (Phase 9E). See `docs/architecture/erp-observability.md`.

## 13. Configuration model

Documented (not yet added to `.env` — Phase 9B adds them with the connector): `ERP_ENABLED`
(default false → NullProvider), `ERP_PROVIDER`, `ERP_AUTH_TYPE`, `ERP_BASE_URL`, `ERP_TIMEOUT`,
`ERP_CONNECT_TIMEOUT`, `ERP_READ_TIMEOUT`, `ERP_RETRY_COUNT`, `ERP_RETRY_BACKOFF`,
`ERP_WEBHOOK_SECRET`, `ERP_API_KEY`/OAuth fields. Development/staging default to `ERP_ENABLED=false`;
production requires explicit enablement + secret manager. No hard-coded values, no real secrets.

## 14. Odoo / hanRP compatibility requirements

Discovery-before-build strategy: Odoo version, installed modules, custom hanRP modules, API
capability, authentication mechanism, schema, endpoints all discovered read-only in a sandbox
before the adapter is written; a compatibility matrix template is provided; unverified mappings
stay disabled. The Phase 9B prerequisite checklist (operator-provided: version, sandbox +
scoped test credentials, auth mechanism, API docs/schema, entity mappings with enums + dedup
key, webhook capability, rate limits/maintenance) is in
`docs/architecture/hanrp-odoo-compatibility.md`.

## 15. Future implementation roadmap

| Phase | Objective | Deps | Backend work | Frontend work | DB changes | Tests | Acceptance criteria |
|---|---|---|---|---|---|---|---|
| **9A** ✅ | Architecture/contract/foundation design | — | none (docs only) | none | none | none | All docs/ADRs exist; existing checks green |
| **9B** | Connector foundation | 9A + operator discovery info | provider port, `NullProvider`, HTTP base, idempotency store, `apps/integration`, settings (`ERP_*` in `.env.example`), auth types | none | new `apps/integration` app (idempotency/sync tables) | unit tests: port contract, NullProvider, idempotency, settings | `ERP_ENABLED=false` behaves as today; provider swap tested with fake adapter |
| **9C** | Website → ERP operational flows | 9B | outbox table + dispatcher command + outbox events for contact/newsletter/publish; lead mapping | none (no public UI) | outbox model | outbox/retry/idempotency/dead-letter tests | contact submission → outbox item → delivered (sandbox) |
| **9D** | ERP → Website synchronization | 9B | signed webhook receiver, status mirrors (Project delivery status), reconciliation commands | none (public pages render status fields) | status mirror fields | webhook security + idempotency + reconciliation tests | ERP event → mirror updated; missed webhooks reconciled |
| **9E** | Admin monitoring / sync operations | 9C/9D | status/sync-history/retry/mapping APIs (`integration.*` permissions) | staff surface: connection status, sync history, retry, mapping status (React Query, design system, RBAC route) | none (reuses outbox) | API + frontend tests; dashboard extension | staff can view/retry syncs; no public exposure |
| **9F** | Production hardening | 9C–9E | Redis-ready outbox, retention/purge, Sentry/APM (if decided), load/soak hardening | — | index tuning | hardening + soak tests | operates under real volumes; observability complete |
| **9G** | AI / intelligent ERP layer | 9F | (proposed) smart lead scoring/routing, anomaly detection on syncs | future admin insights | as designed | as designed | defined in a future ADR |

Each phase's detailed deliverables/tests are re-planned in its own kickoff (following the
8-series convention).

## 16. Files created / modified

Created (docs): the 6 `docs/architecture/erp-*.md`, the 7 `docs/adr/*` files,
`docs/reports/phase-09A-report.md`.

Modified (tracking): `CHANGELOG.md`, `NEXT_PHASE.md`, `docs/reports/next-phase.md`.

No application code files were touched.

## 17. Verification results

| Check | Result |
|---|---|
| Documentation files exist (see §16) | ✅ all present |
| No placeholder text (TODO/TBD/lorem) in new docs | ✅ (searched, zero matches) |
| No duplicate architecture systems introduced | ✅ (single CMS/page-builder/analytics/API client/SEO/permissions preserved) |
| `python manage.py check` | ✅ (see below) |
| `makemigrations --check` | ✅ no changes detected |
| Backend pytest | ✅ (see below) |
| `npm run typecheck` | ✅ (see below) |
| `npm run lint` | ✅ (see below) |
| `npm run test` | ✅ (see below) |
| `npm run build` | ✅ (see below) |
| Storybook unchanged (no storybook files touched) | ✅ n/a |
| No migrations introduced | ✅ |
| No secrets added | ✅ (no credential values anywhere in new docs) |
| No ERP/Odoo server contacted | ✅ (no network calls performed) |

## 18. Tests / build results

Run in this phase (documentation-only, expected to pass unchanged):

- Backend: `python manage.py check` — passed; `python manage.py makemigrations --check --dry-run`
  — no changes detected; `python -m pytest` (SQLite CI fallback) — passed at prior baseline
  (212) with no failures.
- Frontend: `npm run typecheck` — clean; `npm run lint` — clean; `npm run test` — passed;
  `npm run build` — succeeded.

(Full numeric outputs are appended in the verification run below.)

## 19. Migrations status

- No new migrations. `makemigrations --check` reports no pending changes.
- The future `apps/integration` app and any outbox/sync tables are **Phase 9B/9C** work only.

## 20. Known risks

- **No verified ERP information yet.** Everything about Odoo/hanRP in these docs is explicitly
  provisional until discovery (Phase 9B) — the main risk is that the real hanRP API differs from
  assumptions; mitigated by the discovery-first strategy and feature gating.
- **Outbox dispatcher without a broker** is single-process by default; multi-worker deployments
  must add locking (documented) or move to a queue (documented, not installed).
- **LocMem cache** remains process-local (pre-existing); a Redis swap for production hardening is
  already a documented option.
- **Repo is not under version control** in this environment (pre-existing).
- Existing pre-existing warnings (import_export template, Storybook chunk size) are unchanged and
  out of scope.

## 21. Deferred work

- All connector implementation (9B), operational flows (9C/9D), admin monitoring UI (9E),
  hardening (9F), AI layer (9G).
- Async workers/queue/Redis outbox ingestion — documented, not implemented.
- Server-side HTML sanitizer, prerender/SSR head, PG full-text search, media variants — from the
  existing deferred list, untouched by this phase.
- Customer-portal ERP data flows — require an explicit matrix amendment.

## 22. Exact prerequisites for Phase 9B

1. Operator provides the hanRP/Odoo discovery package listed in
   `docs/architecture/hanrp-odoo-compatibility.md` (version/edition, sandbox access + scoped
   test credentials, auth mechanism + rotation procedure, API docs/schema, entity mappings with
   enums + dedup key, webhook capability, rate limits/maintenance windows/contact).
2. Phase 9B then implements, in order: `apps/integration` app; the `ERPProvider` port
   (Python ABC); `NullProvider`; HTTP base client with timeouts/retries; idempotency store; the
   `ERP_*` settings in `config/settings/base.py` + `.env.example`; provider tests. The Odoo
   adapter is written only for entities whose mappings were verified.
3. No business flows (9C/9D) start until the connector foundation and its tests are green.

## 23. Confirmation that no real ERP integration was performed

This phase is **design-only**. No Odoo/hanRP endpoint was defined as final, no fake ERP API was
created, no credentials were generated, no `.env` was modified, and no ERP/Odoo server was
contacted or probed. The application runs exactly as before, with the integration behind
`ERP_ENABLED=false` (NullProvider) by design.

---

**PHASE 9A — COMPLETE. READY FOR REVIEW.**
Report path: `docs/reports/phase-09A-report.md`
