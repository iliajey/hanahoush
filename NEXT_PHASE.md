# Hanahoush — Next Phase Preparation

---

## Current project status

Phase 9E delivered the **production UX & content polish pass** (localization
completeness, error/loading/empty policy completion, RTL popover corrections, mobile
drawer keyboard behaviour, announcement-bar colour fix, i18n key-drift guard) — no ERP
work, no architecture rewrite. See `docs/reports/phase-09E-report.md`.

- **Localization** — shared UI chrome (theme/language toggles, dialog close, breadcrumb,
  spinner, announcement bar, navbar, footer, error/empty defaults, auth brand) now reads
  from i18n in EN/FA/AR; auth validation is localized via schema factories; contact form
  fallback options localized; a new locale-parity test guards against key drift.
- **Error policy completed** — `CmsAsync`, `SearchResults`/`SearchCommand`,
  `NewsletterCTA`, `ContactForm` and `ErrorBoundary` no longer leak raw exception or
  English backend messages; generic localized copy + retry everywhere.
- **Interaction & a11y** — mobile drawer closes on Escape with focus return +
  `aria-controls`; route-error SEO uses the active locale; search shortcut is
  platform-correct (Ctrl K / ⌘K).
- **RTL & visuals** — select/dropdown popovers use logical properties; announcement bar
  custom colours render correctly (dead Tailwind class fixed).
- **Brand & ERP safety** — brand anchors preserved (`#932990`/`#272161`/`#FDFBFC`);
  `ERP_ENABLED=false`, `ERP_PROVIDER=null`, Phase 9A/9B foundation untouched.
- **Visual QA** — `docs/screenshots/phase-09E/production-polish.svg` (token-accurate).

## Verification summary (Phase 9E)

| Check | Result |
|---|---|
| `npm run typecheck` | ✅ 0 errors |
| `npm run lint` | ✅ 0 errors |
| `npm run test` | ✅ 154 passed (29 files) |
| `npm run build` | ✅ |
| `npm run build-storybook` | ✅ |
| `manage.py check` | ✅ |
| `makemigrations --check` | ✅ no changes |
| `migrate` | ✅ no-op |
| `bootstrap` | ✅ idempotent |
| Backend pytest | ✅ 274 passed (`USE_SQLITE=true` fallback) |
| API smoke (public endpoints) | ✅ 200 |
| ERP health + admin dashboard (anon) | ✅ 401 |
| Production bundle dev-artifact scan | ✅ clean |
| i18n locale parity | ✅ enforced by test |
| ERP safety | ✅ `ERP_ENABLED=false`, `null` provider, no credentials |

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
| 9E | Production UX & content polish (this phase) | ✅ |

## Recommended next phase

The ERP track stays **parked until the real Odoo 19 ERP is deployed** — the Phase 9A/9B
connector foundation is untouched and `ERP_ENABLED=false`. Two candidate continuations:

**Option A (recommended when Odoo 19 is deployed):**
**Phase 10 — Website → ERP operational flows**: outbox table + dispatcher +
lead/contact/newsletter events using the Phase 9B provider port, in a staged sandbox, per
`docs/architecture/hanrp-odoo-compatibility.md`.

**Option B (if the site continues to lead):**
**Phase 10 — Verification & delivery hardening**: browser-based responsive/a11y/SEO
verification harness (Playwright-style), Storybook viewport sweeps, prerender/SSR
feasibility, and centralising the i18n + backend-seed copy source of truth (the frontend
locale-parity test now prevents key drift; unifying the backend seed copy remains).

## Risks

- **SPA SEO ceiling** — metadata is applied client-side; non-JS crawlers see the static
  `index.html` head (hardened in 9D). Pre-render/SSR remains a candidate.
- **Copy drift (backend ↔ frontend)** — frontend locale files and backend seed copy both
  carry EN/FA/AR strings; frontend key drift is now test-guarded, but the two sources are
  still maintained manually.
- **Bootstrap copy overwrite** — `_sync_section` reapplies canonical demo copy on each
  `bootstrap`; editorial changes must be made in the CMS after bootstrap.
- Browser-harness verification (pixel-level responsive, screen-reader, keyboard-only)
  remains to be executed when the environment permits.
- Local PostgreSQL role still cannot create test DBs; backend tests use the documented
  SQLite CI fallback.
- Repo is not under version control in this environment.
