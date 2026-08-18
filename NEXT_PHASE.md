# Hanahoush — Next Phase Preparation

---

## Current project status

Phase 9F delivered the **immersive brand identity & living visual system**: the real
organizational logo adopted as the primary site mark, the grid evolved into a living
background (parallax + section-aware energy), a reusable scroll visual-state mechanism,
and the Living Cursor elevated to the primary desktop pointer experience (element-state
morphing + scoped system-cursor suppression). No ERP work, no architecture rewrite. See
`docs/reports/phase-09F-report.md`.

- **Logo** — the real brand mark (icon lockup from `IMG_2854 (1).PNG`, processed for
  transparency, not redrawn) is served from `public/brand/` and rendered via a shared
  `BrandLogo` component in the Navbar, Footer, AuthShell, Design Playground and the brand
  Storybook showcase; favicon + apple-touch-icon + manifest icons included (wide-mark
  caveat documented).
- **Living grid** — CSS-only grid/mesh/energy layers consume visual-state variables;
  transform-only rAF engine adds a subtle scroll parallax and pointer nudge that stops
  when settled; gated on fine-pointer / no-reduced-motion / concurrency.
- **Scroll story** — `PageRenderer` annotates sections with `data-visual-state`
  (hero/services/erp/projects/articles/cta); `VisualStateProvider` publishes `--vs-*`
  on `<html>`; the background interpolates token-driven states (no per-component hacks).
- **Living Cursor** — link/button/card/draggable/text/disabled states; system cursor
  suppressed only on fine-pointer desktops via `html.hh-live-cursor` + CSS; text-entry
  surfaces keep the native I-beam; touch/reduced-motion unaffected.
- **Palette** — re-measured the logo (k-means): `#90298E`/`#272260` vs tokens
  `#932990`/`#272161` — accurate, no token change; everything consumes existing tokens.
- **Brand & ERP safety** — `ERP_ENABLED=false`, `ERP_PROVIDER=null`, Phase 9A/9B
  foundation untouched.
- **Visual QA** — `docs/screenshots/phase-09F/` (7 token-accurate mockups).

## Verification summary (Phase 9F)

| Check | Result |
|---|---|
| `npm run typecheck` | ✅ 0 errors |
| `npm run lint` | ✅ 0 errors |
| `npm run test` | ✅ 168 passed (31 files) |
| `npm run build` | ✅ |
| `npm run build-storybook` | ✅ |
| `manage.py check` | ✅ |
| `makemigrations --check` | ✅ no changes |
| `migrate` | ✅ no-op |
| `bootstrap` | ✅ idempotent |
| Backend pytest | ✅ 274 passed (`USE_SQLITE=true` fallback) |
| Production bundle dev-artifact scan | ✅ clean |
| Logo asset referenced | ✅ `BrandLogo` → `/brand/hanahoush-logo.png` (+ full) |
| Cursor suppression scope | ✅ `(pointer:fine)` + reduced-motion `no-preference` only |
| ERP runtime | ✅ `ERP_ENABLED=false`, `null` provider, `NullProvider`, no network calls |

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
| 9F | Immersive brand identity & living visual system (this phase) | ✅ |

## Recommended next phase

The ERP track stays **parked until the real Odoo 19 ERP is deployed** — the Phase 9A/9B
connector foundation is untouched and `ERP_ENABLED=false`. Two candidate continuations:

**Option A (recommended when Odoo 19 is deployed):**
**Phase 10 — Website → ERP operational flows**: outbox table + dispatcher +
lead/contact/newsletter events using the Phase 9B provider port, in a staged sandbox, per
`docs/architecture/hanrp-odoo-compatibility.md`.

**Option B (if the site continues to lead):**
**Phase 10 — Verification & delivery hardening (priority)**: browser-based
responsive/a11y/SEO verification harness (Playwright-style) that can finally *verify*
the Phase 9F living-cursor suppression, grid parallax and visual-state transitions in a
real browser; Storybook viewport sweeps; prerender/SSR feasibility; centralising i18n +
backend-seed copy. Optional follow-ups surfaced by 9F: a dedicated **square logo glyph**
variant for crisper favicon/app-icon marks, and live-browsing **final tuning** of the
visual-state energy/parallax intensities.

## Risks

- **SPA SEO ceiling** — metadata is applied client-side; non-JS crawlers see the static
  `index.html` head. Pre-render/SSR remains a candidate.
- **Copy drift (backend ↔ frontend)** — locale files and backend seed copy both carry
  EN/FA/AR strings; frontend key drift is test-guarded, backend seed copy is manual.
- **Bootstrap copy overwrite** — `_sync_section` reapplies canonical demo copy on each
  `bootstrap`; editorial changes must be made in the CMS after bootstrap.
- **Browser-harness verification** — the 9F living-background/cursor behaviours are
  code- and token-verified only; pixel-level verification (motion smoothness, parallax
  displacement, cursor-state rendering) needs a real browser harness.
- **Visual-state tuning** — the `--vs-*` intensities are measurements-based defaults;
  fine-tuning may be desired after a real-browser pass (single-file token change).
- Local PostgreSQL role still cannot create test DBs; backend tests use the documented
  SQLite CI fallback.
- Repo is not under version control in this environment.