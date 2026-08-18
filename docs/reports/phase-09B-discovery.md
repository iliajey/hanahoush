# Phase 9B — hanRP / Odoo Environment Discovery Report

**Status:** Discovery executed — see conclusion below.
**Date:** 2026-08-11
**Phase:** 9B — ERP connector foundation (environment discovery part)

---

## REAL ERP ACCESS: NOT AVAILABLE

**No real hanRP/Odoo server endpoint is configured, documented, or reachable from this
environment. No connector code was written against any assumed Odoo API.**

---

## 1. What was searched

The project tree and runtime configuration were searched for every ERP/hanRP/Odoo signal
named in the phase brief:

| Search key | Scope | Result |
|---|---|---|
| `Odoo` / `ODOO_*` | whole repo (docs excluded from "config found" conclusion) | content only (marketing/page-builder/seeds/copy) |
| `hanRP` / `hanrp` | whole repo | marketing content, page-builder `erp` section type, ADR/docs |
| `ERP` / `ERP_*` (env vars) | `backend/.env`, `backend/.env.example`, `config/settings/*.py` | **none** — no ERP variables exist |
| `ERP_URL` / `ERP_BASE_URL` | whole repo | none |
| `ODOO_HOST` / `ODOO_DB` / `ODOO_API` | whole repo | none |
| `JSON-RPC` / `jsonrpc` / `XML-RPC` / `xmlrpc` | whole repo | none (except architecture docs describing *future* discovery) |
| `OAuth` (ERP context) | config/settings, scripts | only existing website JWT/SimpleJWT auth — nothing ERP-related |
| `API key` (ERP context) | config/settings, scripts | none |
| `webhook` (ERP context) | config/settings, scripts | none (website has no ERP webhook receiver) |
| `integration provider` | config/settings, scripts | none |
| `.env.example` | full file read | contains Django/DB/CORS/JWT/email/bootstrap/gunicorn only — **no ERP block** |
| Local ERP installation | `backend/`, `frontend/`, scripts | none (no Odoo containers, no ERP tooling) |
| Test/staging ERP URL | whole repo | none |
| Documented API endpoint | docs/ (all architecture + reports) | none — Phase 9A explicitly documented the ERP surface as *future/provisional* |

### Notable non-matches (documented so the search is reproducible)

- `ERP` appears widely in **marketing content**: `apps/page_builder/models.py` (`erp` section type),
  `apps/page_builder/seed.py`, `apps/common/seed.py`, frontend `ERPSection.tsx`, stories and
  illustration guides. These are **CMS/content references to the hanRP product**, not integration
  configuration.
- `apps.accounts.User.phone` docstring mentions "CRM/ERP integration" readiness — a comment only.
- `config/ws/__init__.py` mentions "real-time ERP sync events" as a future use case — design note only.
- `docs/architecture/*.md` and `docs/adr/ADR-0006…0011` describe the **planned** integration
  boundary; they contain no verified endpoint, version, or credential.
- The Phase 9A report and `NEXT_PHASE.md` already state that all Odoo/hanRP facts are
  provisional until operator-provided discovery (Phase 9B prerequisite).

## 2. What was found

1. **No ERP environment variables** exist in `backend/.env`, `backend/.env.example`, or any
   `config/settings/*.py` file.
2. **No ERP/ODBC connection strings, hosts, databases, or API URLs** are configured anywhere.
3. **No authentication material** (OAuth client id/secret, API keys, service-account
   credentials) exists in source, env files, or documentation.
4. **No Odoo version, edition, module list, or custom hanRP module list** is recorded anywhere.
5. **No JSON-RPC / XML-RPC / REST endpoint documentation or schema** is present.
6. **No sandbox/staging/test hanRP instance** is referenced in this repository.
7. The application's `apps/` inventory contains **no integration app** yet (`apps/integration`
   is created by this phase as the provider foundation, deliberately without assumed ERP
   behaviour).

## 3. What is missing (exact information required to continue)

The following must be supplied by the hanRP/Odoo operator before any ERP-specific adapter
behaviour can be implemented. This is the Phase 9B prerequisite checklist from
`docs/architecture/hanrp-odoo-compatibility.md`.

### Required: Odoo/hanRP environment

| # | Item | Why it is required |
|---|---|---|
| 1 | **Odoo version + edition** (e.g. 17.0 Community/Enterprise) and whether a REST/JSON-RPC gateway or an external API gateway fronts Odoo | decides which API surface (JSON-RPC `/jsonrpc`, XML-RPC, REST, gateway) the adapter can target |
| 2 | **Installed modules** list (stock Odoo + custom) | identifies which records are Odoo-native vs hanRP-owned |
| 3 | **Custom hanRP module names + versions** | defines the hanRP-owned entities (leads, projects, statuses) that may sync |
| 4 | **Sandbox/staging instance** host + access procedure (never production) | the only environment discovery is allowed to run against |

### Required: API / authentication

| # | Item | Why it is required |
|---|---|---|
| 5 | **Authentication mechanism** supported by the instance (OAuth2 client-credentials / scoped API key / dedicated service account / other) + rotation procedure | the `ERP_AUTH_TYPE` config selects this; auth is verified, never guessed |
| 6 | **API surface documentation**: endpoint paths, methods, request/response shapes, pagination, error format (or an OpenAPI/schema document) | nothing is invented; endpoints are implemented from real docs only |
| 7 | **Scoped test credentials** (into environment/secret store, never committed) | read-only discovery + future smoke tests |
| 8 | **Rate limits**, allowed concurrency, maintenance windows, incident contact | drives retry budget and operational policy |

### Required: entity mappings

| # | Item | Why it is required |
|---|---|---|
| 9 | **ERP model names + key fields** for the ownership-matrix rows (lead, customer/company, project delivery status, newsletter/contact) | the adapter maps normalized DTOs → ERP payloads only inside the adapter |
| 10 | **Required fields + value enumerations** (e.g. project statuses) | validation without guessing |
| 11 | **ERP-side dedup/identity key** (external id field) | idempotency keys and mirrors rely on it |
| 12 | **Webhook capability** (if any): registration endpoint, payloads, signing mechanism | Phase 9D receiver design |

## 4. Discovery hard rules honoured

- **Read-only:** no ERP record was created, updated or deleted (no server contact at all).
- **No credential guessing:** nothing was probed, brute-forced or scanned.
- **No destructive operation** was attempted.
- **No secrets:** nothing sensitive was printed or recorded anywhere in this repository.
- **No fabricated facts:** every "verified" claim below is a statement about *absence of
  configuration*, never about the ERP.

## 5. Compatibility matrix status (as of Phase 9B)

| Area | Fact | Value | Verified? | Source | Date |
|---|---|---|---|---|---|
| Odoo version | exact version | — | no | operator required | — |
| Odoo edition | Community/Enterprise | — | no | operator required | — |
| Auth | supported mechanisms | — | no | operator required | — |
| Protocol | JSON-RPC / REST / XML-RPC / gateway | — | no | operator required | — |
| Entity: Lead | ERP model name | — | no | operator required | — |
| Entity: Project | ERP model name / status field | — | no | operator required | — |
| Entity: Contact/Newsletter | ERP model name | — | no | operator required | — |
| Webhooks | ERP→website delivery | — | no | operator required | — |
| Idempotency | ERP-side dedup key | — | no | operator required | — |

Every row remains `unverified`; no adapter behaviour depends on any of them.

## 6. Consequence for this phase

Per the phase brief, with no verified ERP endpoint the phase **stops before attempting real
connector calls**, produces this report, and continues with the connector foundation **only in
forms that do not invent ERP-specific behaviour**:

- `ERPProvider` port (contract) — generic, provider-agnostic.
- `NullProvider` — safe default; the app behaves exactly as before when `ERP_ENABLED=false`.
- HTTP base client — provider-agnostic transport (timeouts, retries, backoff, request-id,
  error normalization, secret redaction). No Odoo endpoint assumed.
- `OdooHanRPProvider` — **only** `health_check()` / `get_capabilities()` are implemented
  (both provider-agnostic connectivity/config introspection). Every resource/event operation
  raises `ERPOperationNotSupportedError` until the real hanRP mapping is verified.
- Configuration + a staff-only health endpoint.

No business flows (leads, contacts, newsletter, content mirrors), webhook receiver, outbox,
scheduler or AI features were implemented (Phase 9C+).

## 7. How to enable real discovery (next steps for the operator)

1. Provide the checklist in section 3 (a concrete instance of
   `docs/architecture/hanrp-odoo-compatibility.md`).
2. Place scoped test credentials into environment configuration / the secret store
   (`ERP_AUTH_TYPE`, `ERP_API_KEY` or OAuth fields, `ERP_BASE_URL`, …) — never into source.
3. Set `ERP_ENABLED=true` and `ERP_PROVIDER=odoo_hanrp` in the **staging environment only**.
4. Run the discovery sequence (read-only schema/protocol probes against the sandbox) and fill
   the compatibility matrix.
5. Only then implement the verified entity mappings (Phase 9C+).

---

**REAL ERP ACCESS: NOT AVAILABLE — discovery report complete.**
