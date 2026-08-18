# ADR-0007 — ERP data ownership & single source of truth

- **Status:** Accepted
- **Date:** 2026-08-11
- **Applies to:** integration data model

## Context

Without explicit ownership rules, the future ERP sync could duplicate the CMS, the analytics
system, or create conflicting copies of contacts, projects and content. Both the website and
the ERP could end up editing the same fields, causing divergence.

## Decision

- Adopt the ownership matrix in `docs/architecture/erp-data-ownership.md`: every entity is
  classified as Website-owned, ERP-owned, Shared, Read-only mirror, Event-derived, or Not
  synchronized.
- **Every field has exactly one owner.** Owner-wins conflict resolution; never bidirectional
  field sync.
- **Single source of truth per domain:** content and marketing data are owned by the website
  CMS; leads/customers/sales/delivery are owned by the ERP; analytics never leaves the website.
- **Mirrors always carry the owner reference** (`sync_key`/external id) so re-sync reconciles
  instead of duplicating.
- **Not synchronized entities** (e.g. `accounts.User`, employees, invoices) are excluded by
  default and only added by an explicit amendment to the matrix.
- **Deletes propagate as tombstones/status events**, never silent mirror deletion.

## Consequences

- No entity is synced "by default"; every future sync requires a matrix amendment first.
- Conflict resolution is deterministic (owner-wins by field), preventing divergence loops.
- Mirrors are disposable and rebuildable from their owner, simplifying reconciliation.
- Some ERP data the website might one day want (e.g. full customer records) stays out of the
  public website by design.

## References

- `docs/architecture/erp-data-ownership.md`
- `docs/architecture/erp-integration.md`
