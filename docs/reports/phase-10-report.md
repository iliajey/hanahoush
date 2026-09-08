# Phase 10 — Browser Verification & Delivery Hardening

**Status:** ✅ COMPLETE
**Date:** 2026-08-20
**Phase:** Real browser verification (Playwright + axe), six-role flows, workspace flows,
responsive/RTL/theme/motion/SEO/performance/security checks, production build re-verification,
and hardening fixes. ERP remains parked.

**ERP constraint honoured:** `ERP_ENABLED=false`, `ERP_PROVIDER=null`, no ERP network calls,
no ERP migrations/models/sync, no credentials invented. Nothing in Phase 10 started ERP work.

---

## 1. Executive summary

Phase 10 performed a **real, browser-driven verification pass** over the existing Hanahoush
application using Microsoft Edge (system-installed Chromium) through Playwright and ax-core.
All previous phases were code-, token- and HTTP-verified only (Phase 9F/9G). A real browser
exposed four genuine production bugs that unit tests and HTTP probes had missed:

1. **Backend API double prefix (CRITICAL).** The axios client uses `VITE_API_BASE_URL`
   (`http://localhost:8000/api/v1`) as its baseURL while most authenticated/protected request
   paths also carried the `/api/v1` prefix (`/api/v1/auth/login/`), producing
   `http://localhost:8000/api/v1/api/v1/...` → 404. **Login and every staff/admin request
   failed in a real browser.** Fixed by normalizing the request paths to be relative to the
   API base.
2. **Editorial workflow lookup 400 (HIGH).** The workflow list endpoint declared
   `content_type` as a DjangoFilter FK filterset field while also resolving it as a label
   (`articles.article`) in `get_queryset` — the filterset rejected the label with a 400, so
   "workflow for content" queries and the articles-row workflow cell always failed in-browser.
3. **Workflow detail had no response envelope (HIGH).** DRF's default `retrieve` returned the
   flat serializer payload, so the frontend `data.data` unwrap was `undefined` and the whole
   workflow-detail page rendered its error state.
4. **Accessibility/UX defects (MEDIUM):** the media workspace heading literally read
   "Title" (a duplicate JSON key — i18next keeps the last occurrence), the navbar/right
   cluster overflowed horizontally between 1024–1280px, the dashboard rail could not shrink
   on small screens (68px overflow at 390px), the home CTA outline button was white-on-near-white
   (1.02:1 contrast), and the partner/tech marquee text labels failed AA contrast (1.8:1)
   because the whole chip was dimmed with `opacity-40`. All fixed. The animation grid and
   living-cursor scroll story were verified functional and non-intrusive.

The complete browser matrix (143 tests) now passes **against the production build**, the
frontend unit suite (216) passes, the backend suite (281) passes, and no migrations or
database resets were performed.

## 2. Environment

| Item | Value |
|---|---|
| Host | Windows 11, PowerShell 5.1 |
| Node / npm | v24.18.0 / 11.16.0 |
| Python / Django | 3.14.6 / Django 5.2.16 |
| PostgreSQL | 16 (`postgresql-x64-16` service), real `hanahoush` database (63 tables, live data) |
| Backend server | `python manage.py runserver 127.0.0.1:8000 --noreload` (`config.settings.local`) |
| Frontend server | Vite dev on :5173 (for development-mode run) and `npm run preview` on :5173 serving the production build |
| Browsers available | Microsoft Edge, Google Chrome, Mozilla Firefox (all system-installed) |
| Browsers used | Microsoft Edge (headless, `channel: "msedge"`) |

No database reset was performed. `migrate` reported "No migrations to apply", `bootstrap`
was idempotent, and the six demo users plus the `admin` superuser were confirmed present.

## 3. Browser harness

- Installed `@playwright/test@1.62.1` and `@axe-core/playwright@4.13.0` as frontend dev
  dependencies only (no architecture change; no browser binaries downloaded — the local
  Edge channel is reused).
- Configuration: `frontend/playwright.config.ts` — single project, workers 1, per-test
  isolation, 90s timeout, screenshot/trace on failure, HTML report in `e2e-artifacts/`.
- Evidence: HTML report (`e2e-artifacts/report/`), per-failure screenshots +
  accessibility snapshots (`test-results/<test>/error-context.md`), axe JSON per scanned
  page (`e2e-artifacts/axe/*.json`), performance request/CLS logs
  (`e2e-artifacts/perf-*.json`).
- For login scenarios the real UI form is used (never API tokens); passwords are read from a
  file generated directly from the backend seeder and are never printed to logs or reports.

## 4. Routes tested

Public: `/`, `/services`, `/projects`, `/articles`, `/about`, `/contact`, `/search`
Detail: `/projects/demo-corporate-website`, `/articles/demo-devops-culture`
Auth: `/login`, `/forgot-password`, `/reset-password`, `/unauthorized`, `/session-expired`
Staff: `/dashboard`, `/dashboard/editorial`, `/dashboard/editorial/:id`,
`/dashboard/articles` (+`/new`, `/:id/edit`), `/dashboard/projects` (+`/new`,
`/:id/edit`), `/dashboard/media`, `/dashboard/contact`, `/dashboard/newsletter`

Every route verified: HTTP/runtime reachability, non-blank render, no uncaught React error,
no fatal console error, no unexpected redirect, document title, at least one non-blank
heading, usable layout, loading state resolution, API-error resilience, and
back/forward navigation. In the production build, `/design` and `/dev/api` correctly render
the SPA 404 page (dev surfaces are absent from the bundle).

## 5. Six-role matrix

Live browser logins for all six backend-authoritative accounts (credentials read from the
seeder, never printed): `superadmin` (27 perms), `companyadmin` (25),
`contentmanager` (16), `projectmanager` (10), `editor` (8), `viewer` (6).

| Check | superadmin | companyadmin | contentmanager | projectmanager | editor | viewer |
|---|---|---|---|---|---|---|
| UI login → `/dashboard` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Role-aware title on dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Profile card shows `@username` + localized role | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Sidebar shows exactly granted links | ✅ | ✅ | ✅ ✅ | ✅ | ✅ | ✅ |
| Direct nav to a forbidden workspace route → `/unauthorized` | ✅ (none) | ✅ (none) | ✅ `/projects` | ✅ `/articles/new` | ✅ `/articles`,`/media` | ✅ `/articles`,`/contact` |
| Backend gates (dashboard/media/contact/newsletter) | 200/200/200 | 200/200/200 | 200/200/200 | 200/200/200 | 403/403/403 | 403/403/403 |
| Logout → `/login`; protected route then redirects | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

Frontend RBAC remains UX-only; every gated backend endpoint (dashboard, media, contact,
newsletter, editorial actions) was re-verified directly against the running backend with the
session token, confirming the backend is authoritative and returns 401/403 correctly.

## 6. Workspace flows

All flows executed as real browser interactions with the live API (create/edit/save are real
PUT/POST mutations on the local demo database; one draft article per run is created and
labelled `Phase 10 E2E Draft`).

- Articles (contentmanager): search narrows rows, status tabs filter, open + save existing
  article unchanged (real PUT), create draft through the trilingual form, backend persistence
  confirmed. Restricted roles (projectmanager) see no create/edit controls and are blocked on
  `/dashboard/articles/new` (client) and by the backend.
- Projects (companyadmin): search/filter, open the public case study, edit + save unchanged.
- Media (companyadmin): list renders (heading now correct), upload a 1×1 PNG through the
  dialog, edit metadata, reference counts shown, soft-delete the uploaded file.
- Contact (companyadmin): list/filter/status filter, inspect dialog, Mark handled / status
  transition, search narrowing.
- Newsletter (companyadmin): list, filter, activate/deactivate a subscriber, CSV export —
  the payload is verified to **never** contain `unsubscribe_token` (and the string does not
  appear anywhere in the DOM).
- Editorial (companyadmin): draft → "Start review" (ensure) → workflow detail → "Submit for
  review" → review queue → open detail → approvals/comments/revisions/timeline panels.
  Approval/comment affordances are hidden for roles without the matching capability.

## 7. Responsive QA

Six viewports: 1440×900, 1280×800, 1024×768, 768×1024, 390×844, 375×812. For every public
route and the staff dashboard/workspaces: heading renders, no document-level horizontal
overflow (≤1px), staff mobile drawer opens/closes inside the viewport and navigates.

Real issues found and fixed: the marketing navbar rendered the full desktop nav plus the
expanded inline search at 1024px, overflowing ~153px; the dashboard rail could not shrink on
narrow screens (68px overflow at 390px); the search command's placeholder+kbd label inflated
the navbar cluster between 768–1024px. Fixed at the exact breakpoints (`xl` for the desktop
nav/search labels) and with `min-w-0` on the dashboard grid children.

## 8. RTL / localization QA

For `en` (LTR), `fa` (RTL) and `ar` (RTL): the document `dir`/`lang` flip correctly across
all public pages and the staff workspace, the in-app language toggle cycles through all three
locales, and no raw backend error text (Traceback/psycopg/sqlite Code smells) appears on
FA/AR pages. Translation-key parity is enforced by the frontend suite (locale parity test).
One genuine defect found: the media workspace heading was literally "Title" in every locale
because `mediaWorkspace.title` appeared twice in the JSON (i18next keeps the last). The
duplicate key was removed and a dedicated `form.title` label added in en/fa/ar.

## 9. Theme QA

Light, dark and system themes verify the real brand tokens are preserved and applied:
- Light: `--primary` 302 56% 37% (~#932990), `--ring` 302 56% 37%, `--background` 330 33% 99% (~#FDFBFC).
- Dark: `--primary` 302 49% 57%, `--ring` 303 56% 69%, `--background` 252 43% 7%.
- System follows the OS `color-scheme` preference in both directions.
- Focus-visible rings use the theme ring token; the brand logo renders with real dimensions in
  the navbar. A genuine defect was fixed: the outline button variant lacked `text-foreground`,
  so outline buttons inside white-text gradient CTAs were white-on-near-white (1.02:1).
  Adding `text-foreground` restores AA contrast for every outline button in both themes.

## 10. Living cursor QA

Verified in a real browser: the living cursor activates only on fine pointers (with
`pointer: fine`), renders its three layers (glow/orb/ring), is `position: fixed` with
`pointer-events: none`, follows the pointer via `translate`, morphs state over links and text
inputs (native I-beam preserved on text fields), causes zero document-layout change, and is
disabled under `prefers-reduced-motion: reduce` (no permanent rAF loop). Keyboard Tab focus
is unaffected.

## 11. Grid / scroll QA

The animated grid, grid-energy bloom and gradient mesh render with `pointer-events: none` and
subtle opacity (<1). The scroll story transitions were verified live: scrolling to
`[data-visual-state="projects"]` sections publishes the correct `--vs-grid-scale` (0.97) and
`--vs-energy-opacity` (0.3) tokens on `documentElement`. Wheel scrolling applies only a
transform (no layout shift), and the whole system is disabled under reduced motion.

## 12. Accessibility

ax-core scans (WCAG 2.1 A/AA) across 9 pages: home, services, articles, article-detail,
projects, project-detail, about, contact, login. **After the fixes there are 0 critical and 0
serious violations.** Additional structural checks: exactly one meaningful `<h1>` per public
page, banner/nav/main/contentinfo landmarks present, contact controls all programmatically
labelled (label-for, implicit label, or aria-label), and images carry alt text or
`aria-hidden`. One remaining LOW finding: the page-level `<main>` wrappers were removed from
eight routed pages (the landmark belongs to the app shell), and the two affected unit tests
were updated accordingly.

## 13. Error / edge cases

All scenarios pass and never leak raw backend exceptions: SPA 404, missing article/project
slugs (friendly alert states), aborted API (page keeps its shell + error state), malformed
HTML 500 response (usable page), slow API (loading skeleton then resolves), invalid contact
form (inline validation + `aria-invalid`), duplicate submits are idempotent, expired session
redirects to `/session-expired`, and unauthenticated access returns 401 with a login
redirect. Login failures render the localized "Login failed" alert without crashing.

## 14. SEO

Browser inspection of the live head for `/articles/:slug`, `/projects/:slug`, `/services`,
`/articles`, `/projects`, `/about`, `/contact`: title, meta description, canonical (origin +
path), robots `index,follow`, OpenGraph (og:title/type/url/locale) and Twitter cards are all
present. Auth/error pages (`/login`, `/search`, `/unauthorized`, `/session-expired`, 404)
carry `noindex,follow`. JSON-LD (Organization/FAQ) renders on `/about`. The backend serves
`/robots.txt` (disallows admin/api/dashboard/search/auth surfaces) and `/sitemap.xml` (real
URL set) on the API host.

## 15. Performance

- Production build is chunked at the route level (React/query/motion/manual chunks + per-page
  lazy chunks); initial JS ≈ index 401 kB (131 kB gzip) + react 207 kB (68 kB gzip) +
  motion 115 kB (38 kB gzip) on separate chunks.
- No duplicate API GETs on the home page when grouping by URL+query (the earlier false
  duplicates were 301-redirect follows from non-slash URLs and distinct filter queries; the
  redirect churn is noted as a low-priority API-path convention improvement).
- Measured CLS on the home page < 0.25 (no layout shift above the warning threshold).
- The dashboard/workspace pages lazy-load their own chunks; console warnings after fixes are
  limited to benign library notices (React Future Flag, Vite dev-server info).

## 16. Security

- No credentials or secrets in frontend source or the built bundle (`password`/`secret` hits
  are i18n strings and the analytics scrub-allowlist; no `Bearer <jwt>`, no `Admin@123456`,
  no `local-dev-secret`).
- Dev surfaces (`DesignPlayground`, `MarketingPreview`, `ApiDevPage`, `PageBuilderDevPage`,
  `EditorialDevPage`, `apiRegistry`, `timingStore`) are **absent from the production bundle**
  and their routes 404 in the production build.
- No JWT parsing for authorization; role/permissions come from `/auth/me/` and the login
  payload only. No alternate role store exists.
- `unsubscribe_token` is never referenced by the frontend feature, never appears in the DOM,
  and never appears in the newsletter CSV export.
- Protected APIs return 401/403 correctly for anonymous/unauthorized users (verified live).
- Security headers (nosniff, Referrer-Policy, Permissions-Policy, no-store on auth/admin)
  are applied by middleware; production settings enable SSL redirect, HSTS, secure cookies.

## 17. Production build

- `npm run typecheck` ✅ 0 errors
- `npm run lint` ✅ 0 errors
- `npm run test` ✅ 216 passed (36 files)
- `npm run build` ✅ (Vite production build; route-level chunking confirmed)
- `npm run build-storybook` ✅ (Storybook static export built)
- The **entire 143-test browser suite was re-run against the production build** (via
  `npm run preview`): all 143 pass, `/design` and `/dev/api` 404, login and the staff
  dashboard work end-to-end.

## 18. Backend verification

- `manage.py check` ✅
- `makemigrations --check` ✅ no changes
- `migrate` ✅ no migrations to apply (no reset, no new migrations)
- `bootstrap` ✅ idempotent (roles/users/content already present)
- `pytest` ✅ **281 passed** (278 pre-existing + 3 new regression tests) with the documented
  `USE_SQLITE=true` CI fallback (the local PostgreSQL role cannot create test databases).

## 19. Frontend verification

- Vitest 216 passed (36 files) including the locale-key parity test, article/project/media/
  contact/newsletter/editorial/dashboard capability tests, and the axios interceptor tests
  (updated for the relative API-path convention).
- Browser level: 143 Playwright tests passed against the production build (summary in §4–16).

## 20. Issues found

| # | Severity | Issue | Found by |
|---|---|---|---|
| 1 | CRITICAL | Axios request paths double the `/api/v1` base prefix → all auth/staff/admin calls 404 in browsers | Real login in the browser |
| 2 | HIGH | Editorial workflow list rejected the `content_type` label with 400 (filterset FK conflict) | Articles workspace row's workflow cell |
| 3 | HIGH | Workflow detail returned a flat payload (no envelope) → workspace workflow detail errored | Editorial flow in the browser |
| 4 | MEDIUM | Media workspace heading read "Title" (duplicate i18n key; i18next keeps the last) | Workspace browser flow |
| 5 | MEDIUM | Navbar overflow (~153px) at 1024px and expanded search inflating the cluster below 1280px | Responsive sweep |
| 6 | MEDIUM | Dashboard rail could not shrink on narrow screens (68px overflow at 390px) | Mobile viewport sweep |
| 7 | MEDIUM | Outline button inside gradient CTA was white-on-near-white (contrast 1.02:1) | axe contrast scan |
| 8 | MEDIUM | Partner/tech marquee text labels failed AA (1.8:1) because the chip was dimmed with opacity-40 | axe contrast scan |
| 9 | LOW | Case-study related-article links had no accessible text (`article.title` didn't exist on the payload; API returns `title_en`) | axe link-name scan |
| 10 | LOW | Navbar duplicated the Home nav item key (`key` `"/"` collision → React warning) | Console warning capture |

## 21. Fixes applied

- Normalized all request paths to be relative to the API base (`/auth/…`, `/admin/…`,
  `/articles/…`, `/media/…`, `/editorial`, `/analytics/events/…`) across the axios client,
  auth/staff/dashboard/admin/newsletter/editorial APIs, and the analytics ingest URL.
- Removed `content_type` from the editorial workflow `filterset_fields` (it is resolved as a
  label in `get_queryset`) and overrode `retrieve` to return the standard envelope.
- Fixed the media i18n duplicate key and added a dedicated `mediaWorkspace.form.title`.
- Restructured the navbar to the `xl` breakpoint for the full desktop nav and collapsed the
  inline search label; removed the duplicate Home nav key.
- Added `min-w-0` to the dashboard rail/grid children.
- Added `text-foreground` to the outline button variant.
- Moved the opacity/grayscale dimming from the partner/tech chip container onto the logo image
  only, keeping the text at full contrast.
- Added title fallbacks (`title_en/fa/ar`/slug) to the case-study related-article cards.
- Converted page-level `<main>` wrappers to `<div>` in the eight routed page components and
  updated the two affected unit tests.
- Added three backend regression tests for the workflow filter and detail-envelope fixes.

## 22. Remaining known issues

- SPA SEO ceiling: metadata is applied client-side; non-JS crawlers only see the static
  `index.html` head. Pre-render/SSR remains a candidate (pre-existing).
- Several content codenames (`articles.*`, `projects.*`, etc.) are still not enforced
  server-side (writes rely on `is_staff`); the frontend mirrors the effective gate, but
  backend ACL tightening is a separate hardening phase (pre-existing 9G risk).
- `robots.txt` advertises `Sitemap: <frontend-origin>/sitemap.xml` while the sitemap is
  served by the backend; production must reverse-proxy `/sitemap.xml` (and `/robots.txt`) to
  the API host or ship a static sitemap on the frontend origin (delivery gap).
- `SWAGGER_PUBLIC` defaults to `True`; it should be disabled in the production environment.
- Local PostgreSQL role still cannot create test databases; the documented SQLite CI
  fallback is in use.
- The per-run E2E flow creates one draft article per run (`Phase 10 E2E Draft`); leftover
  drafts accumulate in the local demo database.

## 23. Deferred work

- ERP integration remains parked until a real Odoo/HanRP 19 environment exists (Phase 10A).
- Backend ACL codename enforcement for articles/projects/services/media/analytics.
- Prerender/SSR feasibility for the SPA SEO ceiling.
- Real management surfaces for services/pages/analytics/company/settings once the backend
  exposes write endpoints (intentionally not built in 9G/10).
- Deep article editing (per-field HTML body editor, cover picker) on top of the existing API.

## 24. Deployment readiness

Audited: `.env.example` (complete templates incl. ERP-gated values), local/CI/production
settings, CORS/CSRF trusted origins, ALLOWED_HOSTS, static/media storage
(`ManifestStaticFilesStorage` in production), logging, security headers middleware, cache
(locmem), database wiring, and the frontend API base URL / production build behavior.

Required production values to set: `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS`, `SITE_URL`
(drives canonical/sitemap/robots URLs), `VITE_API_BASE_URL` (production API origin),
`JWT_AUTH_COOKIE_SECURE=true`, `SWAGGER_PUBLIC=false`, and a reverse proxy for `/sitemap.xml`
/ `robots.txt`. Nothing here requires code changes.

## 25. ERP safety

- `ERP_ENABLED=false` (default; no override in `.env` or the environment).
- `ERP_PROVIDER=null` (default; `NullProvider` active).
- No ERP network calls were made or observed in the server logs during the entire phase.
- No ERP migrations, models, sync jobs, credentials, or endpoints were added.

## 26. Final status

**COMPLETE.** Phase 10 delivered a reproducible real-browser verification and hardening pass:
143 Playwright tests green (dev and production builds), 9 axe-critical/serious-free pages, all
six roles verified end-to-end, all workspace flows exercised, real bugs found and fixed,
frontend and backend suites green (216 / 281), no database reset, no migrations, and ERP
safety preserved throughout.