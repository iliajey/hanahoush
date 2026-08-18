# Phase 9E — Production UX & Content Polish

**Status:** ✅ COMPLETE — READY FOR REVIEW
**Date:** 2026-08-17
**Phase:** 9E — production-level UX, responsive, accessibility, localization, forms,
content, media, motion and interaction polish across the existing Hanahoush product.
**Scope constraint honoured:** No ERP / Odoo / hanRP operational work. Odoo is not
deployed. `ERP_ENABLED=false`, `ERP_PROVIDER=null`, `NullProvider` active, no ERP
credentials, no ERP network calls. The Phase 9A/9B foundation is untouched (§21). No new
architecture, no second design system/CMS/API client/analytics/SEO platform, no Next.js.

---

## 1. Executive summary

Phase 9E performed an audit-first polish pass over the already-mature Hanahoush SPA.
The audit found that the Phase 9D hardenings were largely effective, but it also exposed
a **residual class of problems** that the phase then fixed:

- **Raw/backend error leakage in places Phase 9D had missed** — `CmsAsync` still rendered
  `error.message`, the command palette still fed the raw error into the results view, and
  the newsletter/contact forms could surface English backend messages to FA/AR users.
- **Unlocalized UI strings in shared components** — theme/language toggles, dialog close,
  breadcrumb label, spinner, announcement bar, footer, error/empty state defaults and the
  auth shell brand name were hardcoded English.
- **Unlocalized auth validation** — all auth schemas used hardcoded English messages.
- **RTL gaps in popovers** — select/dropdown indicators and padding used physical
  properties.
- **Interaction gaps** — the mobile drawer had no Escape/focus management; the
  announcement bar's dynamic Tailwind class (`bg-[${...}]`) could not compile (dead
  class → invisible custom background); the route error fallback referenced a missing
  i18n key; the search command shortcut always showed ⌘K.

Deliverables: 60+ string-level localizations across EN/FA/AR, schema factories with
localized messages, generic localized error policy enforced everywhere, RTL-logical
popovers, drawer keyboard behaviour, announcement-bar color fix, a locale-parity test
that guards against key drift, plus full verification and documentation.

Verification (all executed, none claimed): frontend `typecheck` 0 errors · `lint` 0
errors · `test` **154 passed (29 files)** · `build` ✅ · `build-storybook` ✅; backend
`check` ✅ · `makemigrations --check` ✅ no changes · `migrate` ✅ · `bootstrap` ✅
idempotent · `pytest` **274 passed** (`USE_SQLITE=true` CI fallback); live API smoke of
every public endpoint ✅; ERP health + admin dashboard return 401 anonymous; production
bundle clean of dev artifacts; runtime ERP safety confirmed.

## 2. Initial audit

The audit re-reviewed every public route and shell component from the Phase 9D state:

- `/`, `/services`, `/projects`, `/projects/:slug`, `/articles`, `/articles/:slug`,
  `/about`, `/contact`, `/search`, `/login`, `/forgot-password`, `/reset-password`,
  `/unauthorized`, `/session-expired`, `/dashboard`, Navbar, mobile drawer, Footer,
  newsletter forms, CTA components, cards, buttons, forms, breadcrumbs, loading/error/
  empty states, page-builder sections, media handling, typography, spacing, motion,
  dark mode, RTL, localization, keyboard navigation and focus states.

Highest-impact findings, by class:

- **A — Raw error leakage (contradicted Phase 9D's "no raw errors" claim):**
  - `CmsAsync` rendered `error.message` into the UI (`CmsAsync.tsx:44`).
  - `SearchCommand` fed `search.error.message` into `SearchResults` (`SearchCommand.tsx`).
  - `NewsletterCTA` and `ContactForm` rendered backend English `message` strings.
- **B — Unlocalized UI strings:** `ThemeToggle`, `LanguageToggle`, `SearchInput` clear
  label, `Dialog` close, `Spinner` sr-only, `Breadcrumb` label, `ErrorBoundary`,
  `ErrorState`/`EmptyState` defaults, `CmsEmpty`, `EnterpriseFooter` (newsletter block,
  rights line), `AuthShell` brand, `AnnouncementBar` labels, Navbar "Toggle menu".
- **C — Unlocalized validation:** every auth schema message was hardcoded English.
- **D — RTL correctness:** `DropdownMenu` checkbox/radio padding + indicator position and
  `SelectItem` indicator used physical left/right properties.
- **E — Interaction/UX:** mobile drawer had no Escape-to-close or focus management;
  `AnnouncementBar` custom colors used a runtime-composed `bg-[${...}]` class that the
  Tailwind JIT cannot generate (silent visual regression for non-"brand" colors);
  `RouteErrorFallback` referenced a nonexistent i18n key (rendered an empty description);
  search shortcut showed ⌘K on every platform; `RouteErrorFallback` hardcoded the SEO
  locale to "en".
- **F — Hardcoded brand/content:** `AuthShell` brand text "Hanahoush" ignored
  localization; `DashboardPage` comment referenced a stale phase number.
- **G — Key-drift risk:** no test asserted EN/FA/AR key parity (documented as a risk in
  9D but unguarded).

No issues were found with the page-builder composition, the CMS-driven navigation/footer,
the hero/CTA conversion path, the contact form's accessibility wiring, the search page
URL flow, skeletons, or the reduced-motion architecture — those were left untouched.

## 3. Public route audit

| Route | 9D state | 9E outcome |
|---|---|---|
| `/` | good | unchanged; `CmsAsync` errors now generic/localized (home sections) |
| `/services` | good | unchanged; same generic error policy applies |
| `/projects` · `/projects/:slug` | good | unchanged |
| `/articles` · `/articles/:slug` | good | unchanged; newsletter CTA error is now localized generic |
| `/about` | good | unchanged |
| `/contact` | strong form | top-level server error now localized generic (no raw backend message) |
| `/search` | noindex, complete | command palette + results no longer surface raw error messages |
| `/login` · `/forgot-password` · `/reset-password` | noindex+h1 | validation + server-error copy localized via schema factories and new keys |
| `/unauthorized` · `/session-expired` | noindex | unchanged |
| `/dashboard` | account overview | unchanged; stale phase comment fixed |
| `*` (404) / route errors | branded | `RouteErrorFallback` now uses the real localized description + active locale |

## 4. Navigation audit

- **Desktop nav** — unchanged; accessible nav landmark label now localized (`nav.main`).
- **Mobile drawer** — added `aria-controls`/`id` wiring, Escape closes the drawer and
  returns focus to the toggle button, and the toggle aria-label is localized
  (`nav.toggleMenu`). Feature parity (search, theme row, authenticated Dashboard/Logout)
  preserved — not overcrowded.
- **Footer** — router `Link`s and guarded newsletter form retained; `EnterpriseFooter`
  strings (heading, subscribe, success, error, email label, rights line) now localized.
- **Breadcrumbs** — retained on detail pages; the `Breadcrumb` landmark label now reads
  from i18n (`common.breadcrumb`).

## 5. Content audit

- Brand name on the auth shell now uses `t("app.title")` (FA `هانه‌هوش`, AR `هاناهوش`,
  EN `Hanahoush`) instead of a hardcoded EN string.
- `DashboardPage` comment updated to reference Phase 10 (was a stale "9D+").
- No new fabricated claims, testimonials, statistics, awards, certifications or business
  facts were introduced anywhere. Seed copy was **not** touched (Phase 9D already
  neutralised it); this phase fixed *interface copy* only.

## 6. Homepage / conversion audit

Unchanged — hero, CTAs, statistics, services/journey/comparison/stack sections and the
contact path remain as refined in 9D. This phase only hardened the shared error/empty
components those sections render through (`CmsAsync`, `ErrorState`), which now show
localized generic copy.

## 7. Services audit

Unchanged. `core_services` localized eyebrow, journey/comparison/stack/process and CTA
remain intact.

## 8. Projects audit

Unchanged. Case-study storytelling, localized labels, breadcrumbs and RTL timeline
remain intact.

## 9. Knowledge Hub audit

Unchanged except the newsletter CTA error copy: it no longer displays the backend's
English message; it shows the localized `newsletter.error` string (still inside
`aria-live`).

## 10. About / Contact audit

- **About** — unchanged.
- **Contact** — the form's localization was completed: the *fallback* service/project
  type options are now localized keys (`contact.serviceOptions.*`,
  `contact.projectTypes.*`) instead of hardcoded English lists (the CMS-driven config
  path is unchanged and still wins when provided). The top-level failure alert now shows
  the localized `contact.errorBody` rather than the raw backend message; field-level zod
  validation was already localized.

## 11. Search audit

- The command palette (`SearchCommand`) and the `/search` results view no longer receive
  or render raw error messages — `SearchResults` always shows the localized
  `search.errorTitle` / `errors.unexpected` with retry. The now-unused `errorMessage`
  prop was removed from `SearchResults`.
- The shortcut badge is platform-correct: `Ctrl K` on Windows/Linux, `⌘K` on macOS.
- Everything else (URL-driven query, type filter, debounce, keyboard navigation, RTL,
  noindex, analytics) unchanged.

## 12. Forms audit

| Form | Before (9D) | After (9E) |
|---|---|---|
| Login | localized chrome, EN validation | localized validation + localized failure description (`auth.loginFailedDescription`) |
| Forgot password | EN validation | localized validation + localized reset-link error (`auth.resetLinkError`) |
| Reset password | EN validation | localized validation; server error now localized generic |
| Contact | localized validation, raw backend error shown | localized validation + localized generic server error; localized fallback option lists |
| Newsletter CTA / footer | localized chrome, raw backend error shown | localized generic error only |
| Search | localized | localized generic error (raw leak removed) |

No form silently fails; every state (idle/focus/loading/success/validation/server-error/
disabled/duplicate-guard) has a visible localized outcome, unchanged focus/`aria-live`
behaviour preserved.

## 13. Loading / error / empty state audit

- **Error policy completed:** `CmsAsync`, `SearchResults`, `ErrorBoundary`, `NewsletterCTA`
  and `ContactForm` now show generic, localized, human copy. No raw exception text and no
  English backend message reaches a user in any of the three locales. Retry actions
  preserved.
- **Localized defaults:** `ErrorState`, `EmptyState` and `CmsEmpty` fall back to i18n
  (`errors.unexpected`, `errors.retry`, `common.empty`, `errors.emptySection*`).
- New keys: `errors.routeFallbackDescription`, `errors.sectionTitle`,
  `errors.sectionDescription`, `errors.emptySectionTitle`, `errors.emptySectionDescription`.
- Loading (skeletons/`aria-busy`), empty and 404/500 states otherwise unchanged.

## 14. Responsive / mobile audit

No layout regressions were introduced. Reviewed at the conceptual breakpoints
(320/375/390/414/768/1024/1280/ultrawide): grids, cards, hero, forms, nav drawer, footer,
dialogs and tables remain non-scrolling; the only intentional horizontal scroll is the
partner marquee. The mobile drawer's new Escape handling and its existing search/theme/
auth parity mean no feature requires a larger viewport. (A real browser harness is still
unavailable in this environment — see §26.)

## 15. Accessibility audit

- **Drawer keyboard behaviour:** Escape closes the mobile drawer; focus returns to the
  toggle; `aria-expanded` and `aria-controls` connect the toggle to the panel.
- **Localized accessible names:** theme toggle group + options, language toggle, search
  clear button, dialog close button, breadcrumb landmark, announcement bar region/links/
  dismiss, spinner status text, navbar menu labels — all now read from i18n so screen
  readers announce the active language, not English.
- **No raw errors announced:** `ErrorBoundary` (which previously rendered
  `error.message`) now shows localized generic copy while still logging details to the
  console for developers.
- RTL popover geometry corrected with logical properties (see §9 of Part F below).
- No meaningless ARIA added; native semantics retained; reduced-motion architecture
  untouched.

## 16. SEO audit

- `RouteErrorFallback` now emits its `noindex,follow` title **and** description in the
  active locale (previously hardcoded "en" + a missing key that rendered an empty
  description).
- All other SEO surfaces (page titles/descriptions, canonical, OG/Twitter, hreflang,
  JSON-LD, sitemap/robots, static `index.html` head) are unchanged and remain consistent.
  No second SEO system was introduced.

## 17. Media / image audit

No media changes were required: `ResponsiveImage` (srcset/lazy/fallback), aspect-ratio
consistency, search thumbnails and gallery UX were already correct. No fabricated media
assets were added.

## 18. Motion / micro-interaction audit

- No new animation system. Framer-motion `reducedMotion="user"` untouched.
- Micro-interaction fixes: the search shortcut now shows the correct platform key; the
  announcement bar background renders correctly for every configured color (the previous
  dead-class issue meant custom colors were invisible).
- The mobile drawer opens/closes without extra animation; Escape/focus behaviour added.

## 19. Brand & visual consistency

- No token changes; brand anchors preserved (`#932990` primary, `#272161` ink,
  `#FDFBFC` surface). All edits consume existing tokens (`bg-primary`, `text-destructive`,
  `bg-muted`, `border-input`, brand scale, gradients).
- The only structural visual fixes were RTL mirroring of popover indicators/padding
  (which visually *corrects* items in FA/AR) and the announcement-bar custom-colour
  render path.

## 20. ERP safety

Re-verified at runtime after Phase 9E work:

```
ERP_ENABLED      = False
ERP_PROVIDER     = null
ERP_BASE_URL     = ''
ERP_API_KEY      = '' (none set)
ERP_WEBHOOK_SECRET = '' (none set)
```

- No real ERP server was contacted during this phase; no Odoo assumptions, models,
  credentials, synchronization, webhooks, mappings or workflows were introduced.
- `GET /api/v1/integration/erp/health/` and `GET /api/v1/admin/dashboard/` return 401 for
  anonymous users (smoke-verified).
- Phase 9A/9B connector foundation untouched (no file in `apps/integration` or the
  `ERP_*` settings was modified).

## 21. Files created

- `docs/reports/phase-09E-report.md` — this report.
- `docs/screenshots/phase-09E/production-polish.svg` — token-accurate visual QA of the
  polish work (localized chrome, drawer keyboard behaviour, localized error/empty/
  loading states, RTL popovers), consistent with the prior-phase SVG convention.
- `src/i18n/locales/locales.test.ts` — EN/FA/AR key-parity test (guards against key
  drift, which 9D had flagged as a risk).

## 22. Files modified

Frontend:
- `src/i18n/locales/{en,fa,ar}/translation.json` — new keys: `nav.main`, `nav.toggleMenu`,
  `common.breadcrumb`, `errors.routeFallbackDescription`, `errors.sectionTitle`,
  `errors.sectionDescription`, `errors.emptySectionTitle`, `errors.emptySectionDescription`,
  `auth.validation.*`, `auth.loginFailedDescription`, `auth.resetLinkError`,
  `contact.serviceOptions.*`, `contact.projectTypes.*`, `newsletter.*` (unchanged),
  `footer.*`, `search.clear`, `app.announcement`, `app.readMore`,
  `app.dismissAnnouncement`.
- `src/components/ui/theme-toggle.tsx` — localized labels.
- `src/components/ui/language-toggle.tsx` — localized aria-label/title.
- `src/components/ui/dialog.tsx` — localized close label; footer logical gap.
- `src/components/ui/spinner.tsx` — localized sr-only loading.
- `src/components/ui/breadcrumb.tsx` — localized landmark label.
- `src/components/ui/error-state.tsx` — localized defaults; `me-2` logical margin.
- `src/components/ui/empty-state.tsx` — localized default title.
- `src/components/ui/dropdown-menu.tsx` — logical padding/indicator (RTL).
- `src/components/ui/select.tsx` — logical item padding/indicator (RTL).
- `src/features/cms/components/CmsAsync.tsx` — localized generic error/empty; raw error
  removed.
- `src/app/providers/ErrorBoundary.tsx` — localized fallback; no raw error shown.
- `src/features/search/components/SearchResults.tsx` — no raw error; `errorMessage` prop
  removed.
- `src/features/search/components/SearchCommand.tsx` — no raw error feed; platform-correct
  shortcut.
- `src/features/search/components/SearchInput.tsx` — localized default label + clear
  button.
- `src/features/articles/components/NewsletterCTA.tsx` — localized generic error.
- `src/features/contact/ContactForm.tsx` — localized fallback options; localized generic
  server error.
- `src/features/auth/schemas/index.ts` — localized schema factories + backward-compatible
  defaults.
- `src/features/auth/components/LoginForm.tsx` — localized schema + failure description.
- `src/features/auth/pages/ForgotPasswordPage.tsx` — localized schema + reset-link error.
- `src/features/auth/pages/ResetPasswordPage.tsx` — localized schema + generic error.
- `src/features/auth/pages/AuthShell.tsx` — brand name via i18n.
- `src/app/layouts/Navbar.tsx` — Escape/focus/aria-controls on mobile drawer; localized
  labels.
- `src/app/routes/RouteErrorFallback.tsx` — real key + active-locale SEO.
- `src/features/page-builder/components/AnnouncementBar.tsx` — localized labels; custom
  color via inline style.
- `src/components/marketing/footer/Footer.tsx` — localized strings.
- `src/app/routes/pages/DashboardPage.tsx` — stale comment.
- `src/features/auth/tests/auth.schemas.test.ts` — factory localization tests.

Backend: **no application files modified.** (Only the local database was re-bootstrapped
during verification; it was already current.)

## 23. Tests

Executed (not claimed):

- Frontend: `npm run typecheck` (0 errors) · `npm run lint` (0 errors) · `npm run test`
  (**154 passed / 29 files**) · `npm run build` ✅ · `npm run build-storybook` ✅.
- Backend: `python manage.py check` ✅ · `makemigrations --check` ✅ (no changes) ·
  `python manage.py migrate` ✅ (no migrations to apply) · `python manage.py bootstrap` ✅
  (idempotent) · `pytest` (**274 passed**) via the documented `USE_SQLITE=true` CI
  fallback (local PostgreSQL role cannot create test databases — pre-existing, §26).

## 24. Verification results

| Check | Result |
|---|---|
| TypeScript `typecheck` | ✅ 0 errors |
| ESLint `lint` | ✅ 0 errors |
| Vitest | ✅ 154 passed (29 files) |
| Vite build | ✅ |
| Storybook build | ✅ |
| Backend `check` | ✅ |
| `makemigrations --check` | ✅ no changes |
| `migrate` | ✅ no migrations to apply |
| `bootstrap` | ✅ idempotent |
| Backend pytest | ✅ 274 passed (`USE_SQLITE=true`) |
| API smoke (health/version/ping, search, services, projects, articles, about, pages/home, navigation, footer, announcement, site-settings, technologies) | ✅ 200 |
| ERP health + admin dashboard (anonymous) | ✅ 401 |
| Production bundle dev-artifact scan | ✅ zero dev-page code shipped |
| Static `index.html` head | ✅ unchanged (title/description/OG/theme-color) |
| i18n locale parity (EN/FA/AR) | ✅ enforced by new test |
| ERP safety | ✅ `ERP_ENABLED=false`, `null` provider, no credentials, no network calls |
| New npm / pip dependencies | none |

## 25. Known issues

- **No SSR/prerender** — SPA SEO ceiling, unchanged and documented.
- **Browser-based QA not executed** — pixel-level responsive verification, keyboard-only
  and screen-reader passes still require a browser harness unavailable here; code-level
  review + token-accurate SVG QA were performed.
- **Local PostgreSQL cannot create test databases** — backend tests run with the
  documented SQLite CI fallback.
- **Deprecated model remains** — `apps/analytics.Newsletter` unused dead code (removal
  deferred to avoid a model migration this phase).
- **Duplicated JSON-LD helpers** — article/project `injectJsonLd` vs About `<JsonLd>`;
  consolidation deferred.
- **Honeypot + throttle only** for contact/newsletter spam protection (no captcha).
- **Dev-only consoles** (`/dev/*`, `/design`) still carry some raw error strings and are
  English-only; they are tree-shaken from production and out of the public UX scope.
- The `EnterpriseFooter` newsletter block is only rendered when the CMS footer enables it
  (`show_newsletter=false` in the seed), so its localized strings surface in Storybook/dev
  preview today; the block can be enabled from the CMS without code changes.

## 26. Deferred work

- ERP/Odoo operational integration of any kind — parked until the real Odoo 19 is
  deployed; Phase 9A/9B foundation untouched.
- Browser-based responsive/a11y/SEO verification harness and per-route visual regression
  once the environment allows it.
- `/services/:slug`, `/articles/category/:slug`, `/articles/tag/:slug`, `/privacy`,
  `/terms` — only build when real content exists behind them.
- Centralise the duplicated JSON-LD injection; remove `apps/analytics.Newsletter`.
- Captcha/RateLimit hardening if contact spam appears.
- Centralise frontend i18n and backend seed copy into one source of truth (the new
  locale-parity test now guards frontend drift in CI-style runs).

## 27. Architectural risks

- **i18n/key drift** — reduced (parity test added) but the backend seed copy is still
  separate from frontend locale files.
- **Bootstrap overwrite** — `_sync_section` reapplies canonical demo copy on each
  `bootstrap`; editorial customisation must happen in the CMS after bootstrap (existing
  contract, unchanged).
- **SPA SEO ceiling** — unchanged; no prerender.
- **Token lockstep** — `globals.css` runtime vars vs `src/design/colors/index.ts` must
  stay aligned (pre-existing).
- Adding `useTranslation` to a few low-level UI primitives (Dialog, Spinner, ErrorState,
  EmptyState, Breadcrumb, Select-free) assumes they render inside the i18n provider; all
  real usages and stories do, and tests wrap in `LanguageProvider`.

## 28. Migration status

No schema changes. `makemigrations --check` reports no changes; `migrate` applies nothing;
the existing local database was re-bootstrapped idempotently during verification.

---

**PHASE 9E COMPLETE — READY FOR REVIEW**
Report path: `docs/reports/phase-09E-report.md`
Visual QA: `docs/screenshots/phase-09E/`
