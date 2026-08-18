# ERP Integration Architecture (Phase 9A)

## Purpose

This document defines the **architectural boundary** between the Hanahoush website/CMS and
hanRP, the future ERP system built on Odoo. Phase 9A is design-only: no connector is written,
no ERP server is contacted, and no Odoo-specific schema is assumed. The goal is a clean,
provider-based integration layer so the website never becomes coupled to Odoo internals and
the provider can be replaced later without touching domain code.

The final connector is implemented in Phase 9B onward, only after the actual hanRP/Odoo API
surface has been discovered (see [`hanrp-odoo-compatibility.md`](./hanrp-odoo-compatibility.md)).

## Implementation status (Phase 9B)

The connector foundation now exists in `apps/integration` (same `domain → application →
infrastructure → presentation` layout below): the `ERPProvider` port, `NullProvider` (safe
default), the shared HTTP base client (timeouts, bounded retries + backoff, request-ID
propagation, normalized errors, secret redaction), `OdooHanRPProvider` (health_check +
get_capabilities only), a configuration-driven provider registry, `ERP_*` settings, and a
staff-only `GET /api/v1/integration/erp/health/` endpoint. The application still runs with
`ERP_ENABLED=false` (NullProvider) exactly as before. No real ERP contact occurred during
Phase 9B (see `docs/reports/phase-09B-discovery.md`); resource/event operations raise
`ERPOperationNotSupportedError` until the real hanRP mapping is verified.

## The boundary

```
                      ┌─────────────────────────────┐
                      │  Hanahoush public website   │   React SPA (public, read-mostly)
                      └──────────────┬──────────────┘
                                     │  /api/v1 (standard Hanahoush envelope)
                      ┌──────────────▼──────────────┐
                      │  Hanahoush backend (Django) │   CMS, Page Builder, editorial,
                      │  + ERP Integration Layer    │   accounts, analytics, search
                      └──────────────┬──────────────┘
                                     │  provider interface (ERP_UNIT_OF_WORK)
                      ┌──────────────▼──────────────┐
                      │  ERP Integration Layer      │   credential management, request
                      │  (ports & adapters)         │   construction, normalisation,
                      │                             │   retries, timeouts, idempotency
                      └──────────────┬──────────────┘
                                     │  ERP provider adapter (HTTP)
                      ┌──────────────▼──────────────┐
                      │  hanRP / Odoo (ERP)         │   external system; never reachable
                      └─────────────────────────────┘   from the browser
```

Rules enforced at the boundary:

- **The website never talks to Odoo directly.** All ERP traffic goes through the integration
  layer inside the Django process. The browser only ever calls the Hanahoush API.
- **No Odoo-specific import leaks into domain code.** Models, services and views depend on the
  provider interface, not on the Odoo adapter.
- **No hard-coded Odoo schema.** Odoo model names, fields and endpoints are discovered at
  integration time (Phase 9B) and kept inside the adapter, not spread around the app.
- **No secrets in source code.** Credentials live in environment configuration or a secret
  store, never committed.

## What belongs to the website and what belongs to the ERP

A detailed single-source-of-truth matrix is in [`erp-data-ownership.md`](./erp-data-ownership.md).
In short:

| Surface | Owner | Notes |
|---|---|---|
| Public content (Article, Project public profile, Service marketing copy, Page, SEO) | Website | CMS-owned; ERP is not the source |
| Contact/inquiry intakes (`ContactRequest`) | Website | flows **to** the ERP as leads (future) |
| Newsletter subscriptions | Website | may flow to ERP for campaigns (future) |
| Anonymous analytics | Website | never leaves the website; aggregates only |
| Leads, customers, sales, invoices, delivery status | ERP | mirrored **into** the website only when the website needs to render them |
| Employees, financials, purchases, inventory, accounting | ERP | never mirrored unless a future feature requires it |

## What the integration layer is responsible for

The integration layer is the single place that owns every cross-system concern:

1. **Credential/connection management** — provider configuration, token lifetime, rotation,
   testability without real credentials.
2. **Request construction** — provider-specific payloads built from normalized domain DTOs.
3. **Response normalization** — ERP responses converted into normalized provider results so
   domain code sees one canonical shape.
4. **Retries + timeout handling** — bounded retries, exponential backoff, connect/read timeouts.
5. **Error normalization** — ERP errors mapped onto a provider error taxonomy (transient /
   permanent / auth / validation) so callers handle one error model.
6. **Idempotency** — idempotency keys on every mutating outbound operation, duplicate
   detection without a queue (ready for the Phase 9C outbox).
7. **Synchronization orchestration** — mapping, deduplication, and (from Phase 9C) the outbox
   that decouples website writes from ERP delivery.
8. **Observability** — correlation IDs, structured logs, integration health/latency counters
   reusing the existing logging and analytics infrastructure.
9. **Provider replacement** — a second provider (non-Odoo ERP, accounting package, CRM)
   implements the same interface with zero changes to domain code.

## Provider / adapter architecture

Consistent with the existing Clean Architecture in `apps/common`
(`domain → application → infrastructure → presentation`):

```
apps/integration/                       # future app (Phase 9B), layout proposed
├── domain/
│   ├── entities/erp_lead.py            # normalized DTOs (website domain, no ERP fields)
│   ├── value_objects/erp_sync_status.py
│   ├── interfaces/erp_provider.py      # the ERP provider PORT (ABC)
│   └── exceptions/erp_errors.py        # ERPTimeout, ERPAuthError, ERPRateLimited,
│                                       #    ERPTransientError, ERPValidationError, ...
├── application/
│   ├── use_cases/sync_lead.py          # orchestration depends only on the port
│   └── services/erp_sync_service.py    # retry/backoff/circuit-breaker orchestration
├── infrastructure/
│   ├── providers/                      # ADAPTERS implementing the port
│   │   ├── http/base_http_provider.py  # shared HTTP client (timeouts, retries)
│   │   ├── odoo_hanrp.py               # adapter for hanRP/Odoo (Phase 9B+)
│   │   └── null_provider.py            # always returns "disabled"; used when ERP off
│   ├── idempotency/idempotency_store.py
│   └── repositories/erp_inbox_repository.py
└── presentation/
    ├── api/{views,serializers,urls}.py # staff/admin operational APIs (Phase 9E)
    └── webhooks/{views,verify}.py      # inbound webhook receiver (Phase 9D)
```

Conceptual diagram:

```
ERPIntegrationService                    (application layer)
        │
        ├── ERPProvider (port, ABC)      (domain layer — the contract)
        │        │
        │        ├── OdooHanRPProvider   (infrastructure adapter — reads provider config)
        │        ├── FutureProvider      (infrastructure adapter — same port)
        │        └── NullProvider        (used when ERP integration is disabled)
        │
        └── relies on canonical Domain DTOs + IdempotencyStore
```

Rules:

- **The port is a plain Python ABC with no Django/requests/odoo imports** — mirroring
  `apps.common.domain.interfaces.base_repository`. Domain code catches only the port's
  exception taxonomy.
- **Adapters are the only place that know provider specifics** (how to authenticate to Odoo,
  which Odoo endpoint a lead maps to, payload field names, pagination quirks).
- **The sync service, not the adapter, owns retries/backoff/circuit-breaking and idempotency**
  so behaviour is identical regardless of provider.
- **Provider selection is configuration-driven** (`ERP_PROVIDER=odoo_hanrp|null`), so the app
  works with zero ERP configuration (NullProvider) exactly as it does today.

## Reuse inventory (no duplication)

The integration layer intentionally reuses:

- **Standard API envelope + versioning** — all future endpoints live under `/api/v1/` and use
  `config.api.base.responses.build_response` / `hanahoush_exception_handler`.
- **RBAC** — `apps.accounts.api.permissions` (`HasPermission`, `IsStaffOrAdmin`) and the
  existing permission catalog in `apps/accounts/seeders.py`. No parallel permission system.
- **Request IDs** — `RequestIDMiddleware` (`X-Request-ID`) is the base for every correlation /
  integration / sync ID (see `erp-observability.md`).
- **Structured logging** — the existing `api.request` logger pipeline; no second log system.
- **Analytics** — only the existing `trackEvent` / `AnalyticsEvent` system; no second analytics
  platform. ERP health metrics are surfaced through the dashboard API, not a second telemetry
  system.
- **Caching** — existing `CACHES` (LocMem today; Redis-ready swap without code change).
- **Base models** — `apps.core.BaseModel` + `apps.common.infrastructure.models` for any future
  sync-tracking tables.
- **Throttling** — new throttle scopes are added to the existing `DEFAULT_THROTTLE_RATES`
  table, following the `search`/`analytics` precedent.

## Proposed operational API surface

These endpoints are **proposed and provisional** — they are implemented only in the phase where
the architecture demonstrates they are needed (mostly Phase 9E), and each one must then follow
the existing envelope/versioning/throttle/RBAC conventions.

| Method | Path | Purpose | Access | Phase |
|---|---|---|---|---|
| `GET` | `/api/v1/integration/erp/status/` | provider connectivity, last sync/failure, health flags | staff/admin | 9E |
| `GET` | `/api/v1/integration/erp/syncs/` | sync history list/pagination | staff/admin | 9E |
| `POST` | `/api/v1/integration/erp/syncs/retry/` | retry a failed sync by id | staff/admin | 9E |
| `GET` | `/api/v1/integration/erp/mappings/` | mapping status (entity/field ↔ ERP) | staff/admin | 9E |
| `POST` | `/api/v1/integration/erp/webhooks/...` | inbound ERP webhook receiver | signed, no user auth | 9D |
| `GET` | `/api/v1/integration/erp/health/` | deep health probe for ops tooling | staff/admin | 9E |

Nothing in this list is implemented in Phase 9A. Until the connector exists, the only real
surface is the future **NullProvider** returning `disabled`.

## API classes (future, non-negotiable)

The current public API class taxonomy is extended, not changed:

- **Public API** — read-mostly, `AllowAny`, throttled (articles, projects, services, pages,
  search, sitemap, contact, newsletter, analytics ingestion).
- **Authenticated user API** — `/api/v1/auth/*`, user-scoped data.
- **Staff/admin API** — dashboard, newsletter admin, editorial, media admin
  (`IsStaffOrAdmin` / `HasPermission`).
- **Internal integration API** — the `/api/v1/integration/erp/*` operations surface; staff-only,
  never public.
- **Webhook API** — inbound endpoint(s) reachable by the ERP/operator; authenticated by
  signature (HMAC/token), never by user credentials (see `erp-security.md`).

## Non-goals for Phase 9A

- Implementing any connector, provider adapter, schema, or endpoint.
- Contacting a real ERP/Odoo host or using any placeholder credentials.
- Adding a queue/worker (documented only).
- Duplicating CMS, analytics, API client, SEO, or permission systems.
- Modifying existing business models or breaking existing routes/APIs/auth.

## Related documents

- `docs/architecture/erp-data-ownership.md` — what is owned where, single source of truth.
- `docs/architecture/erp-sync-strategy.md` — REST/webhook/scheduled/outbox comparison.
- `docs/architecture/erp-security.md` — authentication, webhook security, security model.
- `docs/architecture/erp-observability.md` — IDs, logging, metrics.
- `docs/architecture/hanrp-odoo-compatibility.md` — discovery requirements for Phase 9B.
- `docs/adr/ADR-0006` … `ADR-0011` — the recorded decisions.