# ERP Synchronization Strategy (Phase 9A)

## Purpose

Compares the four candidate integration patterns and recommends a **hybrid strategy** for each
data flow. Nothing here is implemented in Phase 9A; this is the design the Phase 9B+ connector
and Phase 9C/9D operational flows will implement.

## The four patterns

### A) REST API integration

Direct synchronous calls from Hanahoush to the ERP's HTTP API (e.g. Odoo JSON-RPC or a REST
layer), through the provider adapter.

- **Good for** low-volume, latency-tolerant, request/response operations where the caller wants
  an immediate result (health checks, status queries, small lookups).
- **Bad for** high-volume bulk sync, guaranteed delivery, and any operation that must survive a
  website or ERP outage.
- **Failure mode:** request lost, timeout, partial response → needs retry + idempotency
  regardless (the baseline for every pattern below).

### B) Webhooks

Inbound HTTP push from the ERP to Hanahoush (ERP → Website) and/or outbound calls from
Hanahoush to the ERP (Website → ERP) for event notification.

- **Good for** near-real-time change notification with low latency (project status change, lead
  converted, subscription opt-out), and for decoupling the two systems so neither polls.
- **Bad for** initial backfill and large bulk loads; webhooks are events, not a data sync
  mechanism.
- **Failure mode:** delivery may be lost or replayed → needs signature verification, timestamp
  validation, replay protection, idempotency (see `erp-security.md`).

### C) Scheduled synchronization

Batch/periodic jobs (management commands or a lightweight scheduler) that pull or push deltas.

- **Good for** bulk mirroring, reconciliation, newsletter opt-in lists, marketing-content
  mirrors, and everything where minutes/hours of latency are acceptable.
- **Bad for** anything requiring immediate user-visible effect.
- **Failure mode:** overlapping runs, drift, partial batches → needs locking, idempotent
  upserts, and per-record error handling.

### D) Event / outbox architecture

The website writes domain events to an **outbox table in the same transaction** as the business
write; a dispatcher delivers each event to the ERP exactly-once-ish (at-least-once + idempotent
consumer).

- **Good for** guaranteed, auditable delivery of website → ERP flows (leads, contact requests,
  newsletter events, content-published events). This is the recommended backbone for all
  Website → ERP flows.
- **Bad for** request/response lookups (use REST A) and large bulk sync (use C).
- **Dependency note:** the outbox dispatcher can be a management command (scheduled) or a small
  in-process worker. No Celery/Redis is required for the initial implementation; a queue is a
  future scaling option documented, not installed, in this phase.

## When to use which

| Scenario | Pattern |
|---|---|
| Lead/contact submission (Website → ERP) | **D** outbox (at-least-once + idempotent) |
| Newsletter opt-in/out (Website → ERP) | **D** outbox or **C** scheduled batch |
| Content published event (Website → ERP) | **D** outbox |
| ERP → Website project status change | **B** webhook receive + **C** scheduled reconciliation |
| ERP → Website catalog/service mirror | **C** scheduled |
| Health/status checks, lookups | **A** REST request/response |
| Initial backfill of any mirror | **C** scheduled full sync |
| Future customer portal data | **C** scheduled + **B** for status changes |

## Recommended hybrid strategy

**Website → ERP:** the website writes into an **outbox table in the same DB transaction** as the
source record (contact request, subscription, publish). A dispatcher (management command, run on
a schedule and on demand) delivers outbox items to the ERP through the provider adapter with
retry/backoff, idempotency keys, and a dead-letter state for manual retry. This gives guaranteed
delivery and a built-in audit trail without adding a broker.

**ERP → Website:** a **signed webhook receiver** handles near-real-time ERP events (status
changes), plus **scheduled reconciliation jobs** keep read-only mirrors accurate and catch missed
webhooks. The receiver validates signatures/timestamps, deduplicates by event id, and applies
events idempotently.

**Cross-cutting:** every flow uses the provider adapter, the standard envelope where the ERP
initiates anything, correlation IDs, and per-record sync status so partial failures are visible
and retryable.

## Proposed flows (proposed until verified with the real ERP API)

### Website → ERP

- **Contact/lead submission:** on `ContactRequest` creation (consent given, not spam), an
  outbox event `erp.lead.created` is enqueued. The dispatcher maps it to the ERP lead/customer
  intake and records the ERP reference on the event.
- **Customer inquiry / project inquiry / service request:** same path as leads with a
  `source`/`subject` context (the existing `ContactRequest` already captures
  service_category/project_type/budget_range).
- **Newsletter subscription:** outbox or scheduled batch delivers `erp.contact.subscribed` /
  `erp.contact.unsubscribed`.

### ERP → Website

- **Selected public project status:** ERP emits `project.status.changed`; the receiver updates a
  **read-only status mirror** on the website's `Project` (delivery status field, never the
  marketing content). A scheduled reconciliation job re-syncs status fields from the ERP.
- **Selected public service information:** scheduled mirror of availability/catalog fields.
- **Potential future customer portal information:** explicitly deferred until a portal phase is
  designed; the boundary supports it (scheduled + webhook) without schema changes today.

## Synchronization semantics

- **At-least-once delivery** everywhere; consumers are **idempotent** (dedup by event/record
  identity) so replays are harmless.
- **Eventual consistency is the default** for every mirror. Real-time is reserved for:
  lead submission (user-visible confirmation), and ERP status events where a delay is
  operationally meaningful.
- **Idempotency keys** are generated per outbound mutation and stored with the outbox item; the
  ERP (or its gateway) is expected to deduplicate on the key, and Hanahoush logs/dedups inbound
  webhook ids locally.
- **Partial failure** is per-record; a failed item stays in the outbox/dead-letter state and is
  retried with exponential backoff, never silently dropped.

## Sequencing and lifecycle

1. **Phase 9B** — connector foundation: provider port + NullProvider + HTTP base + idempotency
   store + settings (no business flows).
2. **Phase 9C** — Website → ERP: outbox table + dispatcher command + lead/contact outbox events.
3. **Phase 9D** — ERP → Website: webhook receiver + status mirrors + reconciliation commands.
4. **Phase 9E** — operations surfaces: sync history, retry UI, mapping status.

## Related documents

- `docs/architecture/erp-integration.md` — the provider boundary all flows go through.
- `docs/architecture/erp-data-ownership.md` — which flows are allowed at all.
- `docs/architecture/erp-security.md` — webhook and idempotency security rules.
- `docs/architecture/erp-observability.md` — sync IDs and traceability for each flow.
- `docs/adr/ADR-0008` — synchronization strategy decision record.
