# hanRP / Odoo Compatibility Strategy (Phase 9A)

## Purpose

The future connector must **not** assume a specific Odoo version or a fixed hanRP custom-module
layout until the actual hanRP API is provided. This document fixes the discovery strategy the
connector (Phase 9B) must follow, a compatibility matrix to record findings, and the exact
information checklist the integration team must obtain from the real hanRP/Odoo installation
before writing the adapter.

## Guiding principles

- No Odoo model names, field names, endpoint paths, or module structures are hard-coded anywhere
  in this repository today.
- The adapter is the **only** place that maps between Hanahoush DTOs and whatever the ERP
  actually exposes.
- Every Odoo fact learned during discovery is recorded in this document's compatibility matrix,
  versioned per integration attempt.
- Absent verified information, the connector remains behind `ERP_ENABLED=false` (NullProvider)
  — it never guesses.

## Discovery sequence (Phase 9B, before any business flow)

Discovery runs against a **documented, operator-provided staging or sandbox hanRP instance**,
never production, and never without explicit authorization.

| Step | What is discovered | How |
|---|---|---|
| 1. Odoo version | exact Odoo edition/version (e.g. 16/17/18 Community/Enterprise) | version endpoint or operator statement; drives which API surface exists (JSON-RPC `/jsonrpc`, REST-ish, XML-RPC) |
| 2. Installed modules | list of installed apps/modules | operator statement or module listing endpoint; identifies stock Odoo vs custom |
| 3. Custom hanRP modules | names and versions of Hanahoush-specific modules | operator statement; defines which records are hanRP-owned (leads, projects, statuses) |
| 4. API capability | which protocols the instance exposes (JSON-RPC, XML-RPC, REST, gateway, OpenAPI doc) | probe documented endpoints read-only with test credentials in sandbox |
| 5. Authentication discovery | which auth the instance accepts (OAuth2 client credentials, API key, service account, session) | operator statement + sandbox test; recorded per `erp-security.md` |
| 6. Schema discovery | Odoo model names, key fields, field types, required fields, relations for the entities in the ownership matrix | read-only schema introspection (fields_get / model listing) or OpenAPI schema |
| 7. Endpoint discovery | exact endpoint paths, methods, payload shapes, pagination, error format | probe documented routes; record status codes and envelope |
| 8. Compatibility matrix | a concrete matrix (below) filled from steps 1–7 | this document |

### Hard rules for discovery

- **Read-only** — no data creation, update or deletion against any real or sandbox ERP during
  discovery.
- **Test credentials only** — provided by the operator into environment variables; never
  committed.
- **No schema guessing** — if the ERP does not expose a discoverable schema, the adapter for the
  affected entity is **not written** until the operator supplies the mapping; the entity stays
  "unsynced" per `erp-data-ownership.md`.
- **Record every assumption** as a compatibility-matrix row with `status=unverified` until the
  operator confirms it.

## Compatibility matrix (template)

Filled during Phase 9B discovery. A row per entity/protocol fact.

| Area | Fact | Value | Verified? | Source | Date |
|---|---|---|---|---|---|
| Odoo version | exact version | e.g. 17.0 Community | no | — | — |
| Auth | supported mechanisms | none | no | — | — |
| Protocol | JSON-RPC / REST / XML-RPC | none | no | — | — |
| Entity: Lead | ERP model name | e.g. `crm.lead` | no | — | — |
| Entity: Lead | required fields | none | no | — | — |
| Entity: Project | ERP model name | none | no | — | — |
| Entity: Project | status field + allowed values | none | no | — | — |
| Webhooks | event delivery mechanism (if any) | none | no | — | — |
| Idempotency | ERP-side dedup support (key field) | none | no | — | — |

## Phase 9B prerequisite checklist (information required from the operator)

Before any connector code is written, the operator must provide:

1. **Odoo/hanRP version** and edition (Community/Enterprise), plus whether a REST/JSON-RPC
   gateway or an external API-gateway/CRM is in front of Odoo.
2. **Access to a sandbox/staging instance** with documented connection details and test
   credentials scoped to the entities in `erp-data-ownership.md`.
3. **Authentication mechanism** supported by that instance (OAuth2 client-credentials, API key,
   service account, or other) and credential rotation procedure.
4. **API surface documentation** — endpoints (paths, methods, request/response shapes,
   pagination, error format) or a schema/OpenAPI document.
5. **Entity mappings** for each row in the ownership matrix: ERP model name, key fields,
   required fields, value enumerations (e.g. project statuses), and the ERP-side dedup/identity
   key (external id field).
6. **Webhook capability** (if any): endpoint to register, event payloads, signing mechanism.
7. **Operational expectations**: rate limits, allowed concurrent calls, maintenance windows,
   whether ERP-initiated sync is possible, and a contact for incident coordination.

If any item is missing, the affected flow is **deferred**, never approximated.

## Compatibility strategy over time

- **Per-instance:** the matrix is recorded per integration environment; version upgrades of
  Odoo require re-running discovery and updating the matrix before the adapter is re-enabled.
- **Feature gating:** each entity mapping is independently `enabled/disabled` by config; an
  unverified mapping keeps its flow off.
- **Fallback plan:** if hanRP exposes no programmable API at all, the integration defaults to
  `ERP_ENABLED=false` and the website continues exactly as today (NullProvider) until the ERP
  side adds a gateway.

## Related documents

- `docs/architecture/erp-integration.md` — the provider boundary the connector lives behind.
- `docs/architecture/erp-data-ownership.md` — the entity set the matrix must cover.
- `docs/architecture/erp-security.md` — authentication and webhook contracts to verify.
- `docs/architecture/erp-sync-strategy.md` — flows the discovery unblocks.
