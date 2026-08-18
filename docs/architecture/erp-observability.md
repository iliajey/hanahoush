# ERP Observability Architecture (Phase 9A)

## Purpose

Defines how ERP integration activity will be observed, traced and audited using the **existing**
logging, request-ID and analytics infrastructure — no second telemetry platform, no Sentry/APM
yet (deferred to production hardening, Phase 9F).

## ID model

Four scoped identifiers, layered on top of the existing `X-Request-ID` middleware:

| ID | Scope | Created by | Purpose |
|---|---|---|---|
| `request_id` | one HTTP request | `RequestIDMiddleware` (existing) | base correlation for every API/webhook call |
| `correlation_id` | a business operation spanning multiple requests (e.g. one lead submission → dispatch → ERP ack) | dispatcher/receiver at the start of the operation | links outbox item, ERP call, retries, and webhook ack together |
| `integration_id` | the ERP integration instance (stable, per environment) | settings (`ERP_BASE_URL` + provider) | distinguishes environments/providers in logs |
| `sync_id` | one sync run (batch) | sync service per run | groups all records in a scheduled/reconciliation run |

Propagation:

- Website → ERP: `request_id` (from the originating write) becomes the correlation base; the
  outbox item stores `request_id` + `correlation_id`; HTTP calls to the ERP carry
  `X-Request-ID: <correlation_id>` (or `X-ERP-Request-ID`) so the ERP operator can correlate.
- ERP → Website: the webhook receiver maps the ERP event id → local event id and stores the
  ERP's request/correlation header when present.
- All four ids are attached to structured log records and to any persisted sync history row.

## Structured logging

Reuses the existing `LOGGING` pipeline (`config/settings/base.py`). New fields added to the
JSON formatter when the integration layer logs:

```json
{
  "time": "...", "level": "...", "logger": "...",
  "message": "...",
  "request_id": "...", "correlation_id": "...",
  "integration_id": "...", "sync_id": "...",
  "provider": "odoo_hanrp",
  "entity": "lead", "operation": "dispatch", "outcome": "delivered"
}
```

Rules (enforced in Phase 9B, documented now):

- Loggers: `apps.integration` (INFO operations), `apps.integration.errors` (ERROR/WARNING).
- Never log secrets, payload bodies, signatures or raw ERP responses (see `erp-security.md`).
- Every retry increments a `retry` counter on the log record of the same correlation_id, so one
  operation's full lifecycle is one searchable line per attempt.

## Metrics

No Prometheus/StatsD is installed. Metrics are produced from **existing** aggregates and
structured log counts, surfaced through the existing staff dashboard API
(`GET /api/v1/admin/dashboard/`, Phase 9E extends its operations section):

| Metric | Source | Surface |
|---|---|---|
| Provider health / `ERP_ENABLED` state | provider status probe (NullProvider or real) | status API / dashboard |
| Success / failure counters (per flow: lead, newsletter, content, status) | outbox + sync history rows | sync history / dashboard |
| Latency (last dispatch, avg per flow) | provider timing on outbound calls | sync history / dashboard |
| Retry counts | log-record counters / outbox attempt field | sync history |
| Last successful sync, last failure | sync history rows | status API / dashboard |
| Pending / failed / dead-lettered outbox items | outbox table counts | dashboard |
| Circuit-breaker state | sync service state | status API |

The analytics system (`AnalyticsEvent`) is **not** used for ERP telemetry — ERP observability
is operational data, not visitor analytics. No second analytics platform is created; the
dashboard and status APIs are the single operational surface.

## Status surface (proposed)

`GET /api/v1/integration/erp/status/` (staff-only, `integration.view`, `Cache-Control: no-store`)
returns, in the standard envelope:

```json
{
  "enabled": false,
  "provider": "null",
  "auth": "not_configured",
  "circuit_breaker": "closed",
  "last_sync": null,
  "last_failure": null,
  "last_successful_sync": null,
  "pending_outbox": 0,
  "failed_outbox": 0
}
```

Implemented in Phase 9E; the shape is proposed until then.

## Related documents

- `docs/architecture/analytics.md` — the visitor analytics system that ERP telemetry must not
  duplicate.
- `docs/architecture/security.md` — logging/secret rules this document extends.
- `docs/architecture/erp-integration.md` — where IDs are produced (sync service, dispatcher,
  receiver).
- `docs/architecture/erp-security.md` — what must never appear in logs.
