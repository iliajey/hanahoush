# ADR-0008 — ERP synchronization strategy

- **Status:** Accepted
- **Date:** 2026-08-11
- **Applies to:** integration flows

## Context

Four candidate integration patterns exist: REST API calls, webhooks, scheduled synchronization,
and event/outbox architecture. Each suits different flows, and a single pattern cannot cover
lead intake, newsletter batch sync, ERP status events and reconciliation.

## Decision

Adopt a **hybrid strategy**:

- **Website → ERP:** an **outbox table written in the same transaction** as the business write
  (contact request, subscription, publish event). A dispatcher (management command, run on a
  schedule and on demand) delivers outbox items through the provider adapter with retry/backoff,
  idempotency keys, and a failed/dead-letter state for staff retry. No broker (Celery/Redis) is
  required for the initial implementation — documented as a future scaling option only.
- **ERP → Website:** a **signed webhook receiver** for near-real-time ERP events (status
  changes) plus **scheduled reconciliation jobs** to keep read-only mirrors accurate and to
  catch missed webhooks.
- **Request/response lookups and health probes:** direct **REST** calls through the adapter.
- **Backfill and bulk mirroring:** **scheduled** jobs.

Delivery semantics: at-least-once everywhere, idempotent consumers, eventual consistency as the
default; real-time only where user-visible (lead submission) or operationally meaningful (status
change events).

## Consequences

- Guaranteed, auditable delivery for website → ERP without adding a broker today.
- Webhooks + scheduled reconciliation make ERP → Website resilient to missed deliveries.
- Per-record sync status and dead-letter states make partial failures visible and retryable.
- No new infrastructure dependency; a queue can be added later without redesigning the flows.

## References

- `docs/architecture/erp-sync-strategy.md`
- `docs/architecture/erp-integration.md`
