# ERP Data Ownership (Phase 9A)

## Purpose

Defines which system owns each piece of data in the Hanahoush ecosystem, what may flow between
the website and the ERP (hanRP/Odoo), what must **never** be duplicated, and what has a single
source of truth. The rule set below is the contract that Phase 9B+ mappings must satisfy.

## The five systems

| System | Role | Writes | Reads |
|---|---|---|---|
| **Hanahoush public website** | Public marketing/editorial experience rendered by the SPA from the Hanahoush API | contact/newsletter submissions, analytics events | published content, public project/service status |
| **Hanahoush CMS** | Editorial content authoring (articles, projects, services, pages, company info, media) | all content entities | its own content |
| **Hanahoush internal administration** | Staff operations: editorial workflow, media, newsletter, contact inbox, analytics, future ERP operations | workflow state, media, contact handling, sync operations | CMS content + ERP mirrors |
| **hanRP** | Hanahoush's ERP product layer (domain of the ERP) | leads, customers, projects delivery, sales, invoices | mirrored marketing/project data from the website |
| **Odoo** | The ERP technology underneath hanRP | ERP records | ERP records only |

hanRP is an Odoo-based product; for integration purposes the boundary treats **hanRP/Odoo as
one external ERP system** whose internal structure is discovered, not assumed.

## Ownership model vocabulary

- **Website-owned** — created/maintained by Hanahoush; ERP may receive a copy but never
  overwrites the website.
- **ERP-owned** — created/maintained in the ERP; the website may mirror selected fields but
  never writes them.
- **Shared** — each side writes a defined partition; conflicts resolved by the owner rule
  (never both-write the same field).
- **Read-only mirror** — a denormalized copy for rendering only; the mirror is derived and
  must be re-derivable.
- **Event-derived** — computed from events/aggregates; never treated as a source of truth.
- **Not synchronized** — explicitly excluded; must never flow across the boundary.

## Data ownership matrix

| Entity | Ownership | Source of truth | Sync direction | Frequency | Real-time? | Eventual consistency OK? |
|---|---|---|---|---|---|---|
| `accounts.User` | **Not synchronized** (until a customer-portal phase is explicitly designed) | Website | — | — | n/a | n/a |
| `ContactRequest` | Website-owned; **event-derived** lead copy flows to ERP | Website | Website → ERP | Near-real-time (webhook/outbox) | Yes (submission) | Yes |
| `NewsletterSubscription` | Website-owned; ERP receives opt-in list copy for campaigns | Website | Website → ERP | Scheduled (daily/batch) | No | Yes |
| `Article` | Website-owned | Website (CMS) | Website → ERP (optional marketing mirror, if ERP campaigns need it) | Scheduled | No | Yes |
| `Project` public profile | Website-owned (marketing content) | Website (CMS) | Website → ERP (ref to ERP project once linked) | On publish (webhook/outbox) | No | Yes |
| `Project` delivery/status | **ERP-owned** | ERP (hanRP) | ERP → Website (selected status fields only) | Scheduled + webhook on change | Optional for status changes | Yes |
| `Service` (marketing) | Website-owned | Website (CMS) | Website → ERP (optional catalog mirror) | Scheduled | No | Yes |
| Company information (About, team, offices, social) | Website-owned | Website (CMS) | — (no ERP need today; future: ERP may use as reference) | — | n/a | n/a |
| `MediaFile` | Website-owned | Website (media library) | — (never synced; ERP uses its own attachments or a provided URL reference) | — | n/a | n/a |
| `AnalyticsEvent` / `PageView` / `Visitor` | Website-owned, **event-derived**; never leaves website | Website | — (aggregates only, e.g. dashboard) | — | n/a | n/a |
| **Lead** | **ERP-owned** | ERP (hanRP) | Website → ERP (created from ContactRequest); ERP → Website (status mirror) | Near-real-time; status via scheduled sync | Submission: yes; status: no | Yes |
| **Customer** | **ERP-owned** | ERP | Website → ERP (contact data creates/links); ERP → Website (selected profile fields if portal exists) | On lead→customer conversion | No | Yes |
| **Company** (ERP entity) | **ERP-owned** | ERP | — (future portal read-only mirror if needed) | Scheduled | No | Yes |
| **Employee** | **ERP-owned** | ERP | — (never mirrored to public website) | — | n/a | n/a |
| **Sales information** | **ERP-owned** | ERP | — (internal reports only; not public) | — | n/a | n/a |
| **Invoices** | **ERP-owned** | ERP | — (customer portal phase, read-only mirror if designed) | Scheduled | No | Yes |
| **Products/services** (ERP catalog) | **ERP-owned** | ERP | ERP → Website (if website ever renders real pricing/services from ERP) | Scheduled | No | Yes |
| **Support requests** | **ERP-owned** (or split: intake = website, triage = ERP) | ERP (triage) | Website → ERP (future support form); ERP → Website (status mirror if portal) | Near-real-time intake | Intake: yes | Yes |

### Matrix conventions

- **Not synchronized** entries exist on only one side and are excluded from every mapper.
- **Read-only mirrors** are marked with an `erp_ref`/`sync_key` link back to the ERP record
  so mirrors are re-derivable (re-sync never guesses identity).
- **Frequency** is a Phase 9B/9C tuning knob, not a schema commitment.

## Data flow rules

### Website → ERP (allowed)

- Contact/inquiry submissions (as lead/customer intake), including consent flag and source.
- Newsletter opt-in/opt-out events (copy of the subscription, not the whole table).
- Selected marketing content (article/project/service) if ERP campaigns need it.
- Any future support-form intake.

### ERP → Website (allowed)

- Selected public project delivery status (e.g. `planned → active → delivered`) for the
  case-study/portfolio page.
- Selected service availability/catalog fields if the website renders ERP-backed offerings.
- Lead/customer status mirrors for staff dashboards (never public).
- Future customer-portal data (explicitly out of scope until a portal phase is designed).

### Never duplicated

- **Article/Project/Service/Page marketing content** — the ERP must not become a second CMS.
  If the ERP needs the content it receives a **read-only mirror or a reference**, never a
  writable copy.
- **Analytics** — events and aggregates exist only on the website.
- **User accounts** — one `accounts.User` model on the website; ERP accounts (if any) stay in
  the ERP, linked only by reference.

### Single source of truth rules

1. Every field has exactly one owner.
2. If both systems show the same field, the owner's value wins on conflict (no bidirectional
   field sync).
3. Mirrors always carry the owner reference (`sync_key`) so a re-sync reconciles, not creates
   duplicates.
4. Deletes propagate as tombstone/status events, never as silent mirror deletion (a website
   mirror can outlive an ERP record for archiving).

## Conflict and reconciliation policy

- **Conflict resolution:** owner-wins by field (not whole record).
- **Duplicate detection:** canonical identity from the owner's `sync_key`/external-id plus a
  deterministic dedup key (email for contacts, external-id for ERP records).
- **Reconciliation:** scheduled full/partial resync of mirrored fields from the owner; the
  mirror is disposable and rebuilt from the owner.
- **Partial failure:** per-record results; failures are visible in the sync history and
  retryable individually (see `erp-sync-strategy.md`).

## Changes outside this matrix

Any future phase proposing to sync an entity not listed above (e.g. customer portal, support
tickets, ERP product catalog on the website) must first amend this matrix, then
`hanrp-odoo-compatibility.md`, then the mapping work. Nothing is synced "by default".

## Related documents

- `docs/architecture/erp-integration.md` — the boundary and provider architecture.
- `docs/architecture/erp-sync-strategy.md` — how each flow is implemented.
- `docs/adr/ADR-0007` — data ownership decision record.
