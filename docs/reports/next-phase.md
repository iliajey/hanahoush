# Hanahoush — Next Phase Preparation (docs/reports/next-phase.md)

> **Note:** Phase 11 has been completed. See `docs/reports/phase-11-report.md` for details.

---

## Current project status

Phase 10 delivered a reproducible **real-browser verification and delivery-hardening pass**
over the existing application: a Playwright + axe-core harness (system Microsoft Edge, no
browser downloads) ran 143 scenarios against the live stack and the production build,
covering public/auth/staff routes, all six backend roles, every staff workspace, six
viewports, RTL/LTR (en/fa/ar), light/dark/system themes, the 9F living cursor and grid/scroll
visual system, accessibility, error/edge cases, SEO, performance and security. Genuine bugs
were found and fixed: the axios double-`/api/v1` prefix that broke login and all staff/admin
calls, editorial workflow filter/detail-envelope defects, responsive overflow at 1024px,
the "Title" media heading (duplicate i18n key), outline-button and marquee-text contrast
failures, missing accessible names on case-study related-article links, and a duplicate nav
key warning. The full browser matrix is green against both the dev server and the production
build. See `docs/reports/phase-10-report.md`.

## Verification summary (Phase 10)

| Check | Result |
|---|---|
| Playwright browsers | ✅ Microsoft Edge (system), headless, real DOM |
| Browser scenarios | ✅ 143 passed (dev server) and 143 passed (production build) |
| Axe (9 pages) | ✅ 0 critical / 0 serious |
| `npm run typecheck` | ✅ 0 errors |
| `npm run lint` | ✅ 0 errors |
| `npm run test` | ✅ 216 passed (36 files) |
| `npm run build` | ✅ |
| `npm run build-storybook` | ✅ |
| `manage.py check` / `makemigrations --check` / `migrate` | ✅ / ✅ no changes / ✅ no-op |
| `bootstrap` | ✅ idempotent |
| Backend pytest | ✅ 281 passed (`USE_SQLITE=true`) |
| ERP runtime | ✅ `ERP_ENABLED=false`, `ERP_PROVIDER=null`, `NullProvider`, no network calls |

## Completed phases

| Phase | Deliverable | Status |
|---|---|---|
| 1–7 | Foundation, auth, bootstrap, design system, marketing library, landing | ✅ |
| 8A–8G | CMS/editorial/services/projects/knowledge-hub/company/media/contact/newsletter | ✅ |
| 8H | Production readiness · search · dashboard · analytics · SEO · hardening | ✅ |
| 9A | ERP / hanRP integration architecture (design-only) | ✅ |
| 9B | ERP connector foundation (port + NullProvider + HTTP base + config) | ✅ |
| 9C | Brand identity integration + visual system refinement (frontend) | ✅ |
| 9D | Production UX, content & website excellence | ✅ |
| 9E | Production UX & content polish | ✅ |
| 9F | Immersive brand identity & living visual system | ✅ |
| 9G | Frontend RBAC + staff workspace + role-based dashboard | ✅ |
| 10 | Browser verification & delivery hardening (this phase) | ✅ |

## Recommended next phase

The ERP track stays **parked until the real Odoo 19 ERP is deployed** — the Phase 9A/9B
connector foundation is untouched and `ERP_ENABLED=false`.

**Option A (recommended when Odoo 19 is deployed):**
**Phase 10A — Website → ERP operational flows**: outbox table + dispatcher + lead/contact/
newsletter events using the Phase 9B provider port, in a staged sandbox, per
`docs/architecture/hanrp-odoo-compatibility.md`. The Phase 10 browser harness can then verify
the ERP surfaces end to end.

**Option B (if the site continues to lead):**
**Phase 11 — Content & operations depth (priority)**: unlock the intentional "not added"
management surfaces (services/pages/analytics/company/settings) as the backend grows real
write endpoints; the backend ACL codename-enforcement hardening phase; prerender/SSR for the
SPA SEO ceiling; and richer editorial tooling (per-field HTML editing, cover pickers, inline
previews) on the existing APIs.

## Risks

- **SPA SEO ceiling** — metadata is applied client-side; non-JS crawlers see the static
  `index.html` head. Pre-render/SSR remains a candidate.
- **Copy drift (backend ↔ frontend)** — frontend key drift is test-guarded; backend seed
  copy is still manual and partially empty for AR.
- **Bootstrap copy overwrite** — `_sync_section` reapplies canonical demo copy on each
  `bootstrap`.
- **Backend gate vs catalog mismatch** — content codenames are not enforced server-side
  (writes rely on `is_staff`); the frontend mirrors the effective gate; ACL tightening is a
  separate hardening phase.
- **Sitemap/robots routing** — `robots.txt` advertises a frontend-origin sitemap while the
  backend serves the sitemap; production needs a reverse-proxy or static sitemap.
- Local PostgreSQL role cannot create test DBs (backend tests use the documented SQLite CI
  fallback).
- Repo is not under version control in this environment.