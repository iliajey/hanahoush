# ADR-0006 — ERP provider abstraction

- **Status:** Accepted
- **Date:** 2026-08-11
- **Applies to:** backend integration architecture

## Context

Hanahoush will integrate with hanRP, an ERP based on Odoo, and must not become coupled to Odoo
internals. The existing `apps/common` Clean Architecture already defines ports and adapters
(`domain/interfaces/base_repository`, `infrastructure/repositories`). The integration layer
needs the same decoupling: website domain code must depend on an ERP contract, not on Odoo.

## Decision

- Introduce an **ERP provider port** — a plain Python ABC with no Django, `requests` or Odoo
  imports — as the single contract between the website and the ERP.
- Implement providers as **adapters** behind the port: `OdooHanRPProvider` (the future Odoo
  connector), `FutureProvider`, and a `NullProvider` used when ERP integration is disabled
  (`ERP_ENABLED=false`), so the application runs exactly as it does today without any ERP.
- The **sync service owns cross-cutting concerns** (retries, backoff, circuit breaker,
  idempotency) above the port, so behaviour is identical for every provider.
- Provider selection is **configuration-driven** (`ERP_PROVIDER`), never hard-coded.
- Domain DTOs between the port and the sync service are **normalized website entities**; ERP
  payload field names live only inside the adapters.

## Consequences

- The website never depends on Odoo-specific classes or schema; Odoo can be replaced without
  touching domain code.
- Every outbound flow goes through one auditable, observable boundary.
- Slight indirection cost (one extra layer) is accepted for the future-proofing.
- Phase 9B implements the port, NullProvider, HTTP base and idempotency store; the Odoo adapter
  is written only after discovery (see `hanrp-odoo-compatibility.md`).

## References

- `docs/architecture/erp-integration.md`
- `docs/architecture/hanrp-odoo-compatibility.md`
