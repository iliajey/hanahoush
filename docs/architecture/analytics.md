# Analytics Architecture (Phase 8H)

## Overview

Hanahoush has **one analytics system** with two layers:

1. **Client layer** (`src/features/analytics/`) — the single `trackEvent()` entry point plus the
   in-memory event store, typed domain helpers (`domains.ts`), `useSectionVisibility`,
   `useScrollDepth`.
2. **Persistence layer** (`src/features/analytics/persistence.ts` + backend `AnalyticsEvent`) —
   batches tracked events and ships them to the backend.

There is no second analytics tool, no third-party pixel, and no parallel event system.

## Event flow

```
trackEvent(name, payload)
  → in-memory store (unchanged, MAX_EVENTS=200)
  → enqueueAnalyticsEvent()  [batches, 5 s / 25 max]
  → fetch(keepalive) POST /api/v1/analytics/events/   [never blocks, never uses axios/loading UI]
  → AnalyticsEvent.bulk_create(...)
```

- Persistence is **disabled in test mode** (`import.meta.env.MODE === "test"`), so all existing
  analytics tests keep their pure in-memory behaviour.
- The shared axios client is deliberately **not** used for ingestion so analytics never toggles
  the global loading indicator and never triggers the token-refresh flow.

## Backend

### Model `apps.analytics.AnalyticsEvent`

Append-only event sink. Key fields: `event_name` (indexed), `timestamp` (indexed, composite
`(event_name, timestamp)`), `session_key`, `client_id` (anonymous visitor id from localStorage),
`user` (FK, when authenticated), `visitor` (FK, optional), `locale`, `path`, `referrer`,
`metadata` (JSON), `request_id` (from the request-ID middleware), `user_agent`, `ip_address`.

### Endpoint `POST /api/v1/analytics/events/`

- Public, throttled (scope `analytics`, default `120/min`).
- Accepts a single event or a batch: `{ "events": [...] }` (batch ≤ 50).
- Validates shape/size; invalid items within a batch are dropped and counted; a fully invalid
  payload returns 400; success returns **202** with `{ accepted, dropped }`.
- Optional `ANALYTICS_EVENT_ALLOWLIST` (comma-separated env) restricts accepted event names.
- Anonymous visitors are persisted via `client_id`; authenticated users via `user`.

## Privacy & retention

- **Never stored**: passwords, tokens, authorization headers, cookies. The client scrubs
  credential-like metadata keys (`password`, `token`, `secret`, `authorization`, `cookie`, …)
  before queueing; the model has no credential columns.
- **Minimal PII**: `ip_address` and `user_agent` are captured for abuse/quality signals (same
  fields already stored on `Visitor`/`PageView`). `client_id` is a random UUID — not an email or
  username. No PII is exposed through any public API.
- **Retention strategy**: analytics fact tables are append-only. Recommended retention window is
  **12 months** for raw events and page views; aggregate counts (dashboard) can be kept longer.
  A scheduled purge job is a Phase 9+ item (no worker exists yet).

## Operational notes

- Ingestion is synchronous `bulk_create` in the request path — throttled + capped, acceptable at
  current volume. Move to a queue (outbox) when traffic grows (Phase 9).
- The dashboard aggregates `AnalyticsEvent` (`search_*` activity) and `PageView` counts with
  aggregation queries + 60 s caching.
