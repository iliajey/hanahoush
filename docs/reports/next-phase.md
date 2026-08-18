# Hanahoush — Next Phase Preparation (docs/reports/next-phase.md)

---

## Current project status

Phase 9F delivered the **immersive brand identity & living visual system** — the real
organizational logo as the primary site mark, a living grid (scroll parallax +
section-aware energy), a token-driven scroll visual-state mechanism, and the Living
Cursor elevated to the primary desktop pointer experience. No ERP work, no architecture
rewrite. See `docs/reports/phase-09F-report.md`.

- **Logo** — processed (not redrawn) source mark served from `public/brand/`, rendered
  through a shared `BrandLogo` component in Navbar, Footer, AuthShell, Design Playground
  and the brand Storybook showcase; favicon / apple-touch-icon / manifest icons added
  (wide-mark caveat documented).
- **Living grid** — CSS layers consume `--vs-*` visual-state variables; a transform-only
  rAF engine adds subtle parallax + pointer nudge that stops at idle; gated on
  fine-pointer / non-reduced-motion / concurrency.
- **Scroll story** — `PageRenderer` adds `data-visual-state`
  (hero → services → erp → projects → articles → cta); `VisualStateProvider`
  (IntersectionObserver) publishes CSS variables on `<html>`; no per-component hacks.
- **Living Cursor** — element-state morphing (link/button/card/draggable/text/disabled);
  system cursor suppressed only on fine-pointer desktops via `html.hh-live-cursor`;
  text-entry surfaces keep a native I-beam; touch/reduced-motion unaffected.
- **Palette** — re-measured the logo (k-means `#90298E`/`#272260`) vs existing tokens
  (`#932990`/`#272161`): accurate, **no token changes**; all new visuals consume the
  existing brand/ring tokens.
- **ERP safety** — `ERP_ENABLED=false`, `ERP_PROVIDER=null`, `NullProvider` active, no
  ERP network calls; Phase 9A/9B foundation untouched.

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
| Backend pytest | ✅ 274 passed (`USE_SQLITE=true`) |
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
connector foundation is untouched and `ERP_ENABLED=false`.

**Option A (recommended when Odoo 19 is deployed):**
**Phase 10 — Website → ERP operational flows**: outbox table + dispatcher + lead/contact/
newsletter events using the Phase 9B provider port, in a staged sandbox, per
`docs/architecture/hanrp-odoo-compatibility.md`.

**Option B (if the site continues to lead):**
**Phase 10 — Verification & delivery hardening (priority)**: browser-based
responsive/a11y/SEO harness (Playwright-style) to verify the Phase 9F living-cursor
suppression, grid parallax and visual-state transitions in a real browser; Storybook
viewport sweeps; prerender/SSR feasibility; centralising i18n + backend-seed copy.
Optional 9F follow-ups: a dedicated **square logo glyph** variant for crisper
favicon/app-icon marks, and live-browser **tuning** of visual-state/parallax intensities.

## Risks

- **SPA SEO ceiling** — metadata applied client-side; static `index.html` head hardened
  in 9D; prerender/SSR remains a candidate.
- **Copy drift (backend ↔ frontend)** — frontend key drift is test-guarded; backend seed
  copy is still manual.
- **Bootstrap copy overwrite** — `_sync_section` reapplies canonical demo copy on each
  `bootstrap`.
- **Browser-harness gap** — Phase 9F living-background/cursor behaviours are code- and
  token-verified but not pixel-verified in a real browser.
- **Visual-state tuning** — intensity defaults may be tuned after a real-browser pass
  (single-file token change).
- Local PostgreSQL role cannot create test DBs (backend tests use the documented SQLite
  CI fallback).
- Repo is not under version control in this environment.