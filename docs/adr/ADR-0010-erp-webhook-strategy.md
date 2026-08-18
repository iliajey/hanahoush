# ADR-0010 — ERP webhook strategy

- **Status:** Accepted
- **Date:** 2026-08-11
- **Applies to:** inbound integration security

## Context

The ERP (hanRP/Odoo) will push events to Hanahoush (project status changes, lead conversion,
etc.). An unauthenticated receiver would let attackers inject fabricated events. The receiver
must be safe against replay, forgery, oversized payloads and malformed data without relying on
user authentication.

## Decision

Inbound webhook handling will enforce, in order:

1. **Signature verification** — `X-ERP-Signature` as HMAC-SHA256 over the raw body with
   `ERP_WEBHOOK_SECRET` (constant-time compare).
2. **Timestamp validation** — reject payloads outside a skew window (default 5 min) to block
   replay.
3. **Replay protection** — the webhook event `id` is persisted; duplicate ids are acknowledged
   (200) and skipped.
4. **Idempotent application** — applying an event is idempotent by event id and target-record
   identity.
5. **Payload validation + size caps** — strict schema validation, default 1 MB cap (413
   otherwise); malformed → 400.
6. **Authentication model** — webhook endpoints are signature-authenticated, never user
   credentials; excluded from JWT/Cookie auth and the `AllowAny` default.
7. **Logging without secrets** — log event id/type/source/outcome; never raw payloads,
   signatures or the shared secret.

## Consequences

- ERP events can be trusted end-to-end (forgery, replay, duplication all addressed).
- The receiver behaves as a pure event sink that feeds the reconciliation/idempotency machinery.
- An ERP without webhook support simply uses scheduled reconciliation instead; the receiver
  remains optional.

## References

- `docs/architecture/erp-security.md`
- `docs/architecture/erp-sync-strategy.md`
