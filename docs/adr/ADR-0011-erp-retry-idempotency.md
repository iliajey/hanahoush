# ADR-0011 — ERP error / retry / idempotency strategy

- **Status:** Accepted
- **Date:** 2026-08-11
- **Applies to:** integration reliability

## Context

Outbound ERP calls can time out, be rate-limited, partially fail, or complete server-side
without the response arriving. Without a defined policy the system would either retry too
aggressively (duplicates, load on the ERP) or silently drop operations (data loss).

## Decision

- **Timeouts:** `ERP_CONNECT_TIMEOUT` (default 5 s), `ERP_READ_TIMEOUT` (default 15 s),
  `ERP_TIMEOUT` overall (default 30 s), all configurable.
- **Retries:** up to `ERP_RETRY_COUNT` (default 3) with exponential backoff
  (`base * 2^attempt`, jitter, base 1 s, cap 30 s).
- **Retryable errors:** network failures, connection resets, timeouts, HTTP 408/429/5xx.
- **Non-retryable errors:** HTTP 4xx (except 408/429), auth failures, validation errors,
  malformed payloads — surfaced immediately with a normalized reason.
- **Rate limiting:** 429s honor `Retry-After`, then a `rate_limited` state; the dispatcher is
  throttled so Hanahoush never hammers the ERP.
- **Circuit breaker:** after 5 consecutive provider failures, the breaker opens for 60 s and
  outbound calls fail fast as `provider_unavailable` (outbox items stay queued); reset by a
  successful probe. Implemented in the sync service, not the adapter.
- **Idempotency keys:** every mutating outbound operation carries a key
  (`erp-<entity>-<uuid>`) stored with the outbox item; ERP-side dedup expected, local delivery
  tracked by key so timeouts never cause double records.
- **Partial failure:** per-record outcomes; failures stay pending/failed and are individually
  retryable by staff.
- **Dead-letter:** items past the retry budget move to `failed` in the outbox table (which is
  the dead-letter store); no separate queue required.

## Consequences

- Guaranteed at-least-once delivery with bounded, predictable load on the ERP.
- No duplicate business records (idempotency keys + per-record tracking).
- Operational visibility into every retry/failure through sync history and status APIs.
- A future queue/worker can replace the management-command dispatcher without changing the
  policy.

## References

- `docs/architecture/erp-security.md`
- `docs/architecture/erp-sync-strategy.md`
