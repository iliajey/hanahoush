# Hanahoush — CHANGELOG

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Phase 9F] — 2026-08-18 — Immersive Brand Identity & Living Visual System

### Real organizational logo (source: `E:\Ilia Jamali\Hana\IMG_2854 (1).PNG`)
- Programmatic source analysis (dimensions 1080×1080, pure-white ~81% bg, mark =
  icon lockup x[145..1031] y[166..613] + Persian wordmark below; ~0.9% interior white
  design holes → background removed via border-connected flood-fill transparency).
- Processed, non-redrawn assets in `frontend/public/brand/`: `hanahoush-logo.png`
  (icon-only mark, transparent, 512px), `hanahoush-logo-full.png` (full lockup),
  `icon-192/512.png` (manifest). Also `favicon.png` (32×32) + `apple-touch-icon.png`
  (180×180); `index.html` + `manifest.webmanifest` updated (docs caveat: wide mark is
  small at 16/32px — a dedicated square glyph remains deferred).
- New shared `BrandLogo` component (`src/components/brand/BrandLogo.tsx`) + asset
  constants (`src/config/brand.ts`). Replaced the gradient "ه" placeholder in Navbar
  (desktop + mobile/drawer header), Footer (company block + loading bar), AuthShell,
  Design Playground and the brand/design-token Storybook showcases. CMS logo override
  still takes precedence in the navbar. Mark renders as-is in light/dark + RTL (alt
  text localized, `h-*/w-auto` sizing, no layout shift).

### Living grid / immersive background
- `SiteBackground` upgraded: `hh-backdrop` oversized fixed canvas (parallax-safe),
  `GridEnergy` section-aware energy bloom, visual-state-driven grid density morph
  (`--vs-grid-scale`), mesh opacity, plus a transform-only rAF engine for subtle
  scroll parallax (±60px) and pointer nudge (±7/5px). Engine stops when settled and
  is gated to fine-pointer, non-reduced-motion, non-low-concurrency devices.
- Existing `AnimatedGrid`/`GradientMesh`/`NoiseLayer`/`Particles` primitives reused;
  no second effect library, no new dependency.

### Scroll visual states (the "scroll story")
- New token-driven mechanism `src/design/visual-states/` (`index.ts` +
  `VisualStateProvider.tsx`): sections are annotated `data-visual-state` centrally by
  `PageRenderer` (`visualStateForSectionType`), an IntersectionObserver publishes
  `--vs-grid-size/-scale/-energy-*/--vs-mesh-opacity` on `<html>`, and the background
  interpolates (700ms CSS transitions).
- Story: hero (strongest) → services (settles) → erp (denser) → projects (spatial) →
  articles (calm) → cta (energy return). No per-component page hacks.

### Living Cursor as primary pointer experience
- Renamed/extended ternary visuals + element-state engine: link / button / card /
  draggable (dashed ring) / text (orb+ring hidden → native I-beam) / disabled.
- System cursor suppressed by CSS only on `(pointer:fine)` +
  `prefers-reduced-motion:no-preference` while `html.hh-live-cursor` is present;
  text-entry surfaces always keep a native cursor; touch / coarse /
  reduced-motion are never suppressed. `pointer-events:none` retained; keyboard
  navigation untouched.
- `classifyCursorState()` is pure/exported + unit-tested; `Card` carries an explicit
  `data-cursor="card"` hook.

### Palette verification (Part E)
- K-means re-measurement of the actual logo: magenta cluster `#90298E` vs token
  `#932990`, indigo `#272260` vs ink `#272161` — existing palette accurate, **no
  token changes introduced**. Grid energy, cursor glow, CTA gradients and focus
  states all consume the existing brand/ring tokens.

### Video decision
- CSS/SVG/token prototype judged to already deliver the premium effect; video
  deferred. `VIDEO ASSET SPECIFICATION — OPTIONAL FUTURE ENHANCEMENT` documented in
  the phase report (§12) — no stock footage, no video code.

### Accessibility
- Reduced-motion: animations zeroed, visual states still apply (no motion carries
  information), living cursor disabled, native cursor visible, grid dimmed.
- Text selection, keyboard nav, focus rings, RTL/LTR, light/dark all preserved.

### Tests & verification
- New tests: `src/design/tests/visual-states.test.ts` (tokens, section mapping,
  scroll-story ordering, cursor state classification), `BrandLogo.test.tsx`,
  `PageRenderer` data-visual-state annotation test.
- Frontend: `typecheck` ✅ 0 · `lint` ✅ 0 · `test` **168 passed (31 files)** ·
  `build` ✅ · `build-storybook` ✅. Production bundle scanned clean of dev-only
  artifacts and includes the brand assets via `public/`.
- Backend: `check` ✅ · `makemigrations --check` ✅ no changes · `migrate` ✅ ·
  `bootstrap` ✅ idempotent · `pytest` **274 passed** (`USE_SQLITE=true`).
- ERP runtime: `ERP_ENABLED=false`, `ERP_PROVIDER=null`, no credentials,
  `NullProvider` active, no ERP network calls.

### Visual QA
- `docs/screenshots/phase-09F/`: `logo-integration.svg`, `light-theme-grid.svg`,
  `dark-theme-grid.svg`, `scroll-states.svg`, `cursor-states.svg`,
  `mobile-fallback.svg`, `reduced-motion-fallback.svg` (token-accurate mockups,
  clearly labelled, not browser screenshots).

### ERP & scope safety
- No ERP/Odoo/hanRP work; no migrations; no new npm/pip dependencies; no new
  architecture (one token system, one cursor, one background engine, one Page
  Builder).

### Verification
Frontend `typecheck` ✅ · `lint` ✅ · `test` **168 passed (31 files)** ✅ · `build` ✅ ·
`build-storybook` ✅. Backend `check` ✅ · `makemigrations --check` ✅ no changes ·
`migrate` ✅ · `bootstrap` ✅ idempotent · `pytest` **274 passed** ✅. ERP runtime
`ERP_ENABLED=false`, `ERP_PROVIDER=null`, `NullProvider`, no network calls. Production
bundle clean of dev-only artifacts; logo asset present and referenced; cursor
suppression CSS confirmed scoped to fine-pointer/desktop contexts.

---

## [Phase 9E] — 2026-08-17 — Production UX & Content Polish

### Audit-first
Re-audited every public route, shell component, form and locale file against the Phase
9D state. The 9D hardenings were largely intact; the audit surfaced a residual class of
localization, error-policy and interaction gaps, which this phase fixed without adding
any new subsystem.

### Localization completeness (EN / FA / AR)
- Shared UI now reads from i18n: theme toggle (group + Light/Dark/System), language
  toggle, dialog close button, breadcrumb landmark, spinner status, search clear button,
  announcement bar (region/read-more/dismiss), navbar menu labels, error/empty state
  defaults, `CmsEmpty`, `AuthShell` brand name (`t("app.title")`), `EnterpriseFooter`
  (newsletter heading/subscribe/success/error/email label/rights line).
- Auth validation localized via new schema factories (`createLoginSchema`,
  `createForgotPasswordSchema`, `createResetPasswordSchema`, `createChangePasswordSchema`,
  `createProfileSchema`) — Login, Forgot Password and Reset Password forms pass `t()`.
- Login failure and reset-link server errors use localized descriptions
  (`auth.loginFailedDescription`, `auth.resetLinkError`) instead of English backend text.
- Contact form fallback service/project-type lists localized
  (`contact.serviceOptions.*`, `contact.projectTypes.*`).
- New locale-parity test (`src/i18n/locales/locales.test.ts`) asserts EN/FA/AR key
  parity (plural-suffix aware), closing the documented key-drift risk.

### Error / loading / empty states (policy completed)
- No raw exception or English backend message reaches users anywhere: `CmsAsync`,
  `SearchResults`/`SearchCommand`, `NewsletterCTA`, `ContactForm` and `ErrorBoundary` now
  show localized generic copy with retry preserved. `ErrorBoundary` still logs details to
  the console for developers.
- Added `errors.routeFallbackDescription` (was a missing key rendering empty),
  `errors.section*`, `errors.emptySection*`.

### Interaction & accessibility
- Mobile drawer: Escape closes it, focus returns to the toggle, `aria-controls`/`id`
  wired, toggle label localized.
- `RouteErrorFallback` SEO now uses the active locale (was hardcoded "en").
- Search command shortcut is platform-correct (Ctrl K / ⌘K).
- RTL popover geometry corrected with logical properties (`dropdown-menu.tsx`,
  `select.tsx` items/indicators, error-state margin).
- `AnnouncementBar` custom colours now render via inline style — the runtime-composed
  `bg-[${…}]` Tailwind class could not compile and produced an invisible background for
  non-"brand" colours.
- `DialogFooter` uses a logical `gap` instead of `space-x`.

### ERP & scope safety
- No ERP/Odoo/hanRP work; `ERP_ENABLED=false`, `ERP_PROVIDER=null`, no credentials, no
  ERP network calls; Phase 9A/9B foundation untouched (re-verified at runtime).
- No new npm or pip dependencies; no migrations; no new architecture.

### Verification
Frontend `typecheck` ✅ · `lint` ✅ · `test` **154 passed (29 files)** ✅ · `build` ✅ ·
`build-storybook` ✅. Backend `check` ✅ · `makemigrations --check` ✅ no changes ·
`migrate` ✅ · `bootstrap` ✅ idempotent · `pytest` **274 passed** ✅. API smoke: all
public endpoints 200; ERP health + admin dashboard 401 anonymous. Production bundle clean
of dev artifacts; i18n parity enforced. Visual QA: `docs/screenshots/phase-09E/`.

---

## [Phase 9D] — 2026-08-16 — Production UX, Content & Website Excellence

### Audit-first
Full frontend + backend audit (routing, navigation, pages, i18n, seeders, SEO, forms,
states) running through Phase 9C reports. Improvements were prioritised by real user
impact; no feature bloat. Full detail: `docs/reports/phase-09D-report.md`.

### Navigation & information architecture
- Mobile drawer now mirrors desktop: search entry, theme toggle, and the correct
  authenticated view (Dashboard + Logout) instead of an unconditional "Login" link.
- Footer internal links are react-router `Link`s (no full-page reloads); external/socials
  use `rel="noopener noreferrer"`; the previously-no-op footer newsletter button is a real
  guarded form.
- Visible `Home › Section › Item` breadcrumbs added to `/projects/:slug` and
  `/articles/:slug` (JSON-LD breadcrumbs already existed).
- `PlaceholderPage` dead code removed; dev-only routes corrected.

### Content quality (EN / FA / AR)
- Removed dead scaffold keys (`app.reactFoundationReady`, `common.underConstruction`).
- Unified brand spelling: EN "About Hanahoush"; AR app title now `هاناهوش`.
- Correct Arabic plurals for search result counts (`_zero/_one/_two/_few/_many/_other`).
- Arabic copy polish (hero, insights eyebrow, client voices, milestones, CTA).
- Softened unverifiable claims: hero/drop "companies trust"; contact/seed copy drops
  "responds within one business day" for "every inquiry is reviewed by our engineering
  team".
- Neutralised dev-only sample claims in `MarketingPreview.tsx` (real-sounding
  testimonial names, a real company name, fabricated stats/timeline, fake contacts).
- Backend page-builder seed copy refreshed across EN/FA/AR and now **synced idempotently
  on `bootstrap`** via a canonical `_sync_section` (`update_or_create`).

### SEO (single existing system)
- 404 now emits `noindex,follow` + title (previously stale head, no robots).
- Auth + utility pages (`/login`, `/forgot-password`, `/reset-password`,
  `/unauthorized`, `/session-expired`, `/dashboard`) → `noindex,follow` + localised titles.
- Article/project metadata now uses active-locale (FA/AR) titles/descriptions.
- Static `index.html` head hardened (description, theme-color `#932990`, OG, Twitter card).

### Accessibility
- Global `MotionConfig reducedMotion="user"` (honours `prefers-reduced-motion`).
- Auth pages now render a single `h1`.
- Newsletter CTA → real `<form>` with duplicate-submit guard + `aria-live`; article
  search input labelled; TOC toggle `aria-controls`; RTL timeline uses logical props.

### Error / loading / empty states
- No raw exception messages on any data page (localised generic copy + retry).
- Detail "not found" states are no longer dead ends (retry + Home/listing navigation).
- Removed skeleton→content padding jump on the four page shells.

### Development artifacts & performance
- `/design` and `/dev/*` modules are now tree-shaken from the **production bundle**
  (verified in `dist/` — zero dev-page code ships).
- No new dependencies; route splitting, lazy images and React Query caching preserved.

### Brand & ERP safety
- Brand anchors preserved (`#932990`, `#272161`, `#FDFBFC`); all UI uses existing tokens.
- `ERP_ENABLED=false`, `ERP_PROVIDER=null`; no Odoo/ERP code, credentials or assumptions;
  Phase 9A/9B foundation untouched. ERP health + admin dashboard remain non-public (401
  anonymous).

### Verification
Frontend `typecheck` ✅ · `lint` ✅ · `test` 147 ✅ · `build` ✅ · `build-storybook` ✅.
Backend `check` ✅ · `makemigrations --check` ✅ no changes · `migrate` ✅ · `bootstrap` ✅
· `pytest` 274 ✅ (`USE_SQLITE=true` CI fallback). API smoke: all public endpoints 200,
newsletter 201, ERP/admin 401 anonymous. Production bundle clean of dev artifacts.

---

## [Phase 9C] — 2026-08-11 — Brand Identity Integration + Visual System Refinement (frontend-only)

### Brand palette (measured from the brand mark)
- Analyzed the organization's brand image (`IMG_2854.PNG`) **programmatically**
  (Pillow k-means + median-cut on the real pixels; this model cannot render
  images directly). The image stays the source of truth.
- New identity: **violet-magenta primary `#932990` + deep-indigo ink `#272161`
  on near-white `#FDFBFC`** — replacing the stock Tailwind-indigo palette that
  previously stood in for the brand.
- Brand scale 50..950 now rotates magenta → deep indigo (50 `#FDF6FB` … 950
  `#272161`), mirroring the mark's intrinsic gradient.

### Tokens (extended, no new system — Part 12 honoured)
- `src/design/colors/index.ts` — new brand scale + role tokens
  (`brand.primary/.primaryHover/.primaryActive/.secondary/.secondaryHover/
  .accent/.accentSoft/.onPrimary/.onSecondary`) + theme maps (light/dark) +
  `--success/--warning/--error/--info`; semantic roles `surface/
  surfaceElevated/surfaceMuted/text/textMuted/textSubtle/focus` added as
  aliases into the existing CSS-variable pipeline.
- `src/styles/globals.css` — `:root`/`.dark` token blocks updated (semantics,
  brand scale triplets, hover/selection/scrollbar, glass tints, gradients,
  cursor → magenta) so runtime CSS drives the new identity.
- `src/design/gradients/index.ts` — brand/hero/cta/mesh gradients moved to the
  magenta → deep-indigo identity gradient.
- `tailwind.config.ts` — added `success`/`warning`/`error`/`info` semantic
  color mappings (brand roles flow through the existing `brand:` map).
- `src/design/tests/tokens.test.ts` — updated for the expanded brand object.

### WCAG accessibility (Part 8, verified numerically)
White on `#932990` **7.09:1**; white on hover `#7A2477` **8.95:1**; deep ink on
white/grey surfaces **14–16:1**; muted text **5.6–5.8:1**; dark-mode primary
button (magenta `#C75BC3` + ink `#171039` text) **4.88:1**; focus ring ≥6.8:1
both themes; status text on white `≥4.8:1` (darker UI-safe variants chosen for
light; original vivid steps kept as decorative).

### Brand application (Parts 4/6/7 — focused, not a recolor)
- Navbar logo mark → brand gradient (`ه` on `brand-600→brand-950`).
- Footer → brand-gradient signature hairline.
- CTA + article RelatedContent identity panels → `brand-600→brand-900`.
- GlowBorder → brand-magenta halo. All remaining surfaces consume the token
  pipeline (entire page-builder, cards, badges, forms, hero, cursor).

### Storybook + Design Playground (Parts 10/11)
- New `src/design/stories/brand.stories.tsx` — Brand/Identity showcase (mark,
  scale, role tokens, semantics, gradients, typography, controls; Light/Dark/
  RTL stories via existing theme/locale globals).
- `design-tokens.stories.tsx` — branded header + roles + status added.
- Design Playground (`/design`, dev-only) — brand identity panel + role tokens
  + forms/status section; existing token sections now render the real brand.

### Visual QA (Part 13)
- `docs/screenshots/phase-09C/{brand-palette,semantic-tokens,visual-system}.svg`
  — token-accurate renders generated from the actual token values (SVG
  convention consistent with prior phases; not browser captures).

### Verification
Frontend `typecheck` ✅ · `lint` ✅ · `test` 147 ✅ · `build` ✅ ·
`build-storybook` ✅. No new npm dependencies. ERP untouched (Part 15):
`ERP_ENABLED=false`, `ERP_PROVIDER=null`, `NullProvider` active, no ERP models/
credentials/sync/Odoo assumptions. Backend re-verified: `check` ✅ ·
`makemigrations --check` ✅ no changes · `migrate` ✅ no-op · `bootstrap` ✅ ·
`pytest` 274 ✅.

---

## [Phase 9B] — 2026-08-11 — ERP Connector Foundation (provider port + NullProvider + HTTP base + config)

### Added
- **Environment discovery (Part A/B/C)** — `docs/reports/phase-09B-discovery.md`: no hanRP/Odoo
  endpoint, credential, version, module list or API doc exists in the project or environment.
  **REAL ERP ACCESS: NOT AVAILABLE**; full prerequisite checklist for the operator included.
- **`apps/integration` app** (Clean Architecture, mirrors `apps/common`):
  - `ERPProvider` port (`domain/interfaces/erp_provider.py`) — plain ABC, no Django/HTTP/Odoo
    imports; `health_check`, `get_capabilities`, `get_resource`, `create_resource`,
    `update_resource`, `send_event` (ADR-0006).
  - ERP error taxonomy (`domain/exceptions/erp_errors.py`) — connection/timeout/transient/
    rate-limited/auth/validation/not-supported/provider-unavailable/parse errors (ADR-0011).
  - `ProviderHealth` / `ProviderCapabilities` value objects.
  - `NullProvider` — safe default; behaves exactly as before when `ERP_ENABLED=false`.
  - `BaseHTTPProvider` — provider-agnostic stdlib `http.client` transport with connect/read/
    overall timeouts, bounded exponential-backoff retries + jitter, `X-Request-ID` propagation,
    HTTP-status→taxonomy error normalization, `Retry-After` handling, secret redaction and
    structured safe logging (no new dependency; `requests` unused).
  - `OdooHanRPProvider` — **only** `health_check()` (bounded read-only probe) + `get_capabilities()`
    (`verified=False`); every resource/event operation raises `ERPOperationNotSupportedError`
    until the real hanRP mapping is verified (Phase 9C+).
  - Provider registry — config-driven `ERP_PROVIDER` selection with validation and safe fallback.
  - `ErpStatusService` — status payload computation with 15 s health snapshot cache.
  - Staff-only `GET /api/v1/integration/erp/health/` (standard envelope, `Cache-Control:
    no-store`, `integration.view`/staff/admin gate, secrets redacted, `probe` opt-in only when
    enabled). OpenAPI documented; schema validates.
- **Configuration** — `ERP_ENABLED`, `ERP_PROVIDER`, `ERP_AUTH_TYPE`, `ERP_BASE_URL`,
  `ERP_TIMEOUT`, `ERP_CONNECT_TIMEOUT`, `ERP_READ_TIMEOUT`, `ERP_RETRY_COUNT`,
  `ERP_RETRY_BACKOFF`, `ERP_RETRY_BACKOFF_CAP`, `ERP_API_KEY`, `ERP_WEBHOOK_SECRET` in
  `config/settings/base.py` + `.env.example` (values only, never secrets; `.env` untouched).
- **RBAC** — `integration.view` permission added to the seeder catalog; granted to
  SUPER_ADMIN/COMPANY_ADMIN; `apps.integration.presentation.api.permissions.IsIntegrationOperator`.
- **Observability** — `apps.integration` / `apps.integration.errors` loggers.
- **Tests** — 62 offline integration tests (fake transport; no ERP server): redaction,
  NullProvider, HTTP retry/backoff/timeout/auth/non-retryable/request-ID/idempotency of error
  taxonomy, OdooHanRPProvider, registry selection/validation, status service caching,
  health-endpoint authorization.

### Changed
- `config/settings/base.py` — ERP settings block + `apps.integration` in `INSTALLED_APPS` +
  loggers.
- `config/api/v1.py` — mounts `integration/` namespace.
- `apps/accounts/seeders.py` — additive `integration.view` permission row.
- `backend/.env.example` — ERP configuration template block.
- `docs/architecture/erp-integration.md`, `docs/architecture/erp-security.md` — 9B
  implementation-status notes.
- `NEXT_PHASE.md`, `docs/reports/next-phase.md`, `docs/reports/phase-09B-report.md`,
  `CHANGELOG.md` — Phase 9B tracking.

### Verification
`manage.py check` ✅ · `makemigrations --check` ✅ no changes · `migrate` ✅ no-op ·
backend pytest **274 passed** (212 baseline + 62 new) ✅ · ruff-clean on new code ✅ ·
OpenAPI schema valid ✅ · `npm run typecheck` ✅ · `npm run lint` ✅ · `npm run test`
(147) ✅ · `npm run build` ✅ · `npm run build-storybook` ✅ · no real ERP contact ✅ ·
`ERP_ENABLED=false` behaves exactly as before ✅.

### Deferred (by phase directive)
Customer/lead/contact/invoice/project/product/employee/CRM synchronization, ERP webhooks,
background queues, outbox persistence, scheduled reconciliation, AI, customer portal —
Phase 9C+ after the operator discovery package (see `docs/reports/phase-09B-discovery.md`).

---

## [Phase 9A] — 2026-08-11 — ERP / hanRP Integration Architecture (design only)

### Added
- **ERP integration architecture** — `docs/architecture/erp-integration.md`: the website ⇄
  integration-layer ⇄ hanRP/Odoo boundary; provider/adapter architecture
  (`ERPProvider` port + `OdooHanRPProvider` / `FutureProvider` / `NullProvider`) consistent with
  the existing `apps/common` Clean Architecture; reuse inventory (envelope, RBAC, request-ID,
  logging, analytics, caching, base models, dashboard); proposed staff-only operations surface.
- **Data ownership matrix** — `docs/architecture/erp-data-ownership.md`: five-system model
  (public website / CMS / internal admin / hanRP / Odoo); per-entity ownership, source of truth,
  sync direction/frequency, real-time vs eventual consistency; Website↔ERP allowed flows; never
  duplicated data; owner-wins conflict policy.
- **Synchronization strategy** — `docs/architecture/erp-sync-strategy.md`: REST vs webhooks vs
  scheduled vs event/outbox comparison; hybrid recommendation (same-transaction outbox +
  dispatcher for Website→ERP; signed webhooks + scheduled reconciliation for ERP→Website;
  REST for lookups; scheduled for bulk). No broker dependency introduced.
- **ERP security** — `docs/architecture/erp-security.md`: config-driven authentication contract
  (OAuth2 client-credentials preferred, scoped API key / service account fallback); `ERP_*`
  configuration contract; error/retry/idempotency design (timeouts, exponential backoff, circuit
  breaker, idempotency keys, outbox-as-dead-letter); webhook security (HMAC, timestamp, replay,
  idempotency, payload/size limits); RBAC integration via future `integration.*` codenames;
  PII/data-minimization/logging restrictions.
- **ERP observability** — `docs/architecture/erp-observability.md`: request/correlation/
  integration/sync IDs layered on `X-Request-ID`; structured-log extensions; metrics derived
  from existing aggregates surfaced via the staff dashboard (no second analytics platform).
- **hanRP/Odoo compatibility strategy** — `docs/architecture/hanrp-odoo-compatibility.md`:
  discovery-before-build (version, modules, capability, auth, schema, endpoints), compatibility
  matrix template, and the exact Phase 9B information checklist for the operator.
- **Architecture Decision Records** — `docs/adr/README.md` + ADR-0006 (provider abstraction),
  ADR-0007 (data ownership), ADR-0008 (sync strategy), ADR-0009 (authentication), ADR-0010
  (webhooks), ADR-0011 (error/retry/idempotency), continuing the series from
  `frontend/docs/adr/ADR-0001..0005`.
- **Phase report** — `docs/reports/phase-09A-report.md` (23 required sections).

### Changed
- `NEXT_PHASE.md` and `docs/reports/next-phase.md` — rewritten as Phase 9B preparation.

### Scope
Documentation only. No application code (backend or frontend) was modified; no migrations; no
secrets; no ERP/Odoo server contacted; integration is gated behind `ERP_ENABLED=false`
(NullProvider) until the connector is implemented.

### Verification
`manage.py check` ✅ · `makemigrations --check` ✅ no changes · pytest ✅ ·
`npm run typecheck` ✅ · `npm run lint` ✅ · `npm run test` ✅ · `npm run build` ✅ · no
placeholders (TODO/TBD/lorem) ✅ · no duplicate architecture systems ✅ · no migrations ✅ ·
no secrets ✅.

---

## [Phase 8H] — 2026-08-10 — Production Readiness · Search · Dashboard · Analytics Foundation

### Added
- **Global search** — `GET /api/v1/search/` (public, throttled) over published Articles,
  Projects, Services and Pages; relevance-ranked, locale-aware (fa/en/ar), category/type
  filters, ordering, pagination with the standard envelope; new `apps/search` app.
  - Frontend `features/search/`: `/search` page + ⌘K command palette, debounced (350 ms),
    grouped results, count, loading/empty/error states, keyboard navigation, RTL-safe,
    localized; search analytics (`search_view/submit/result_click/empty/filter`).
- **Admin intelligence dashboard** — staff-only `GET /api/v1/admin/dashboard/` (content ·
  editorial · engagement · operations · system), aggregated + cached 60 s, never exposes
  secrets; existing Django admin dashboard untouched.
- **Persistent analytics** — `AnalyticsEvent` model + throttled `POST /api/v1/analytics/events/`
  (batch ≤ 50, 202, allowlist option); frontend `trackEvent` now batches and persists via
  `fetch(keepalive)` without blocking or changing existing behaviour; credential-like metadata
  scrubbed on the client.
- **SEO infrastructure** — `/sitemap.xml` + `/robots.txt` generated from published content
  (cached, signal-invalidated); `useSeoMeta` extended with hreflang alternates (+ `x-default`).
- **Performance** — route-level code splitting for the whole SPA (`<Suspense>` around the
  outlet); bounded search queries; sitemap/dashboard caching.
- **Security hardening** — `SecurityHeadersMiddleware` (nosniff/referrer/permissions-policy;
  `Cache-Control: no-store` on auth + admin API); write access on Article/Project/Service
  restricted to staff; `search` + `analytics` throttle scopes; `ENVIRONMENT`/`APP_VERSION`/
  `SITE_URL`/`CACHES` settings; staff-only migration check on health.
- **Error UX** — `RouteErrorFallback` as the router error element (polished 404/500 fallback).
- **Admin quality** — `date_hierarchy` on PageView + AnalyticsEvent changelists; AnalyticsEvent
  registered in admin + ordered in the admin index.

### Changed
- Publishable content API writes now require staff privileges (anonymous → 401). Tests updated.
- `/api/health/` returns environment/version/timestamp/request_id (+ staff-only migrations).
- Editorial publish/archive/reopen/rollback mutations invalidate the CMS + page-builder caches.

### Tests
- Backend pytest **167 → 212**; `manage.py test` **124 → 160**.
- Frontend Vitest **122 → 147**.
- Live HTTP smoke **23/23 passed**.

### Docs
- `docs/reports/phase-08H-report.md`; `docs/architecture/{search,analytics,performance,seo,
  security}.md`; `NEXT_PHASE.md` + `docs/reports/next-phase.md` updated.

---

## [Phase 8G] — 2026-08-10 — Production CMS · Company · Media · Contact · Newsletter

### Added
- **`/about`** — Company/About experience composed by the Page Builder
  (`usePage("about")` + `<PageRenderer />`, no hardcoded layout), seeded `about` Page with
  12 sections: hero · company_story · about (mission/vision) · values · team · timeline ·
  partners · testimonials · faq · offices · social_links · cta.
- **`/contact`** — Contact/inquiry experience composed by the Page Builder (hero ·
  contact_form · offices · social_links · cta) with a production inquiry form.
- **Contact form** (`src/features/contact/`): react-hook-form + zod, localized
  validation (FA/EN/AR), honeypot, duplicate-submission guard, loading/success/error
  states, accessible labels + `aria-live`, analytics (contact_form_view/start/submit/
  success/error).
- **Media management**:
  - Backend: metadata editing (PATCH), `reference_count` in the API, soft-delete on API
    and admin, working type/uploader/date filters, JSON parser.
  - Frontend: reusable `MediaPicker` (drag & drop, progress, preview, search, selection,
    localized metadata, loading/error/empty) + `/dev/media` console.
- **Newsletter operations**: staff-only `/api/v1/admin/newsletter/` (search/filter/
  activate/deactivate/CSV export, tokens never exposed), per-IP subscribe throttle.
- **Analytics**: typed event helpers in `src/features/analytics/domains.ts`
  (about_view · team_member_click · timeline_interaction · partner_click ·
  contact_* · media_* · newsletter_*), wired into sections/components.
- **SEO**: robots + Twitter cards in `useSeoMeta`, `JsonLd` component, `Organization` +
  `FAQPage` structured data on `/about`, robots forwarded on all audited routes.
- **OpenAPI fixes**: schema now documents every endpoint (contact, newsletter,
  page-builder, site-settings) and validates cleanly (drf-spectacular);
  `POST /auth/refresh/` request schema fixed.

### Changed
- Contact admin PATCH returns the full record and records the handler; contact filters
  (status/source/locale) now actually filter.
- Media admin/API deletion is soft; media list reports usage/reference counts.
- NewsletterCTA uses the unified `newsletter_*` events and i18n strings.

### Tests
- Backend: 167 passed (+18: contact lifecycle/envelope, newsletter admin privacy, media
  metadata/soft-delete/reference counts, OpenAPI paths). Django runner: 124 OK.
- Frontend: 122 passed (+20: analytics domains, contact form, media picker, about page).

### Docs
- `docs/reports/phase-08G-report.md` · `docs/reports/next-phase.md` · `NEXT_PHASE.md`.

## [Phase 8F] — 2026-08-08 — Knowledge Hub / Engineering Magazine

### Added
- **`/articles`** — premium Knowledge Hub composed by the Page Builder (seeded `articles` Page):
  articles hero (editorial heading + live search) · featured article (dominant editorial block) ·
  latest articles (3/2/1 editorial grid) · article discovery (server-side search/category/topic/sort/featured + pagination) ·
  category explorer · tag explorer · newsletter CTA · final CTA. No hardcoded layout.
- **`/articles/:slug`** — article reading experience assembled via `<PageRenderer />` from registered
  sections: article hero, safe content (TOC + reading progress + code blocks), related content, newsletter, CTA.
- **Backend**:
  - Deterministic `reading_time` on Article list/detail (`apps/articles/reading.py`: en=200 / fa=180 / ar=170 wpm).
  - `GET /articles/by-slug/{slug}/` — draft-protected full article + `related_articles` (category/tag),
    `related_projects` (tech/title overlap), `related_services` (topic overlap).
  - `GET /articles/categories/` and `/articles/tags/` — published-only taxonomy explorers (with counts).
  - `NewsletterSubscription` model + `POST /api/v1/newsletter/subscribe/` (201 / duplicate 409 / invalid 400),
    admin registered (single subscription system).
  - 11 new section types + seeded `articles` Page (8 sections) with localized copy + SEO.
- **Frontend `src/features/articles/`** (`types/api/hooks/queries/services/utils/mappers/components/pages/dev`):
  - `ArticleContent` (DOMPurify sanitize → heading ids → code-language transform), `CodeBlock`
    (lightweight regex highlighter, language label, copy, horizontal scroll), `ArticleTableOfContents`,
    `ReadingProgress`, `FeaturedArticle`, `ArticleFilterBar`, `CategoryExplorer`, `TagExplorer`,
    `ArticleShare` (copy + Web Share), `NewsletterCTA`, `RelatedArticles/Projects/Services`, `ArticleMeta`, `ArticleCTA`.
  - SEO: `useArticleSeo` (title/description/canonical/OG/twitter) + `BlogPosting` + `BreadcrumbList` JSON-LD (validated).
  - Analytics: article_view · article_search · article_filter · category_click · tag_click ·
    featured_article_click · article_share · copy_link · newsletter_submit · related_*_click ·
    article_cta_click · article_section_visible · scroll_depth.
  - `/dev/articles` console (payload · filters · cache · SEO · analytics).
  - Storybook stories (ArticleCard, ArticleContent, ArticleFilters, TOC, ReadingProgress, CodeBlock, NewsletterCTA, RelatedArticles).
- **Dependency**: `dompurify` + `@types/dompurify` (client-side content sanitization).
- Frontend tests (`articles.test.tsx` — sanitization, TOC, reading time, params, CodeBlock, content, detail + 404).
- Docs: `docs/pages/articles.md`, `docs/pages/article-detail.md`, `docs/ux/articles-experience.md`,
  `docs/architecture/article-content.md` (ADR) + diagrams `articles-flow.svg`, `article-reading-flow.svg`,
  `article-content-pipeline.svg` + 5 Visual QA SVGs.

### Modified
- `apps/articles/api/{serializers,viewsets}.py`, `apps/articles/reading.py` (new), `apps/articles/admin.py` (case study).
- `apps/page_builder/{models,admin,api/{serializers,views,urls},seed}.py` (newsletter + articles Page + section types).
- Routes (`/articles`, `/articles/:slug`, `/dev/articles`), page-builder registry/config (45 section types).
- CHANGELOG/NEXT_PHASE.

### Verification
Backend pytest **131 passed** ✅ · Frontend Vitest **102 passed** ✅ · TypeScript ✅ · ESLint ✅ · Vite build ✅ · Storybook build ✅ · ruff-clean (new code) ✅ · live `/articles`, `/articles/:slug`, `/dev/articles` ✅ · no regressions (landing/services/projects/case studies) ✅.

---

## [Phase 8E] — 2026-08-08 — Enterprise Projects & Case Study Experience

### Added
- **`/projects`** — premium portfolio listing composed by the Page Builder (seeded `projects` Page):
  hero · featured projects (editorial/asymmetric) · project discovery (server-side category/technology/year/search/featured filters) · technology explorer · portfolio timeline · CTA. No hardcoded layout.
- **`/projects/:slug`** — full Case Study assembled via `<PageRenderer />` from 12 registered case sections: hero, challenge, objectives, solution, architecture, technology, journey, gallery, results, related projects, related articles, CTA.
- **Backend**:
  - `Project.case_study` structured JSONField (challenge/objectives/solution_approach/architecture/implementation_stages/results, localized values).
  - `GET /projects/by-slug/{slug}/` — draft-protected full case study (case_study + related projects/articles).
  - `GET /projects/technologies/` and `/projects/categories/` — live taxonomy explorers (with published counts).
  - Project filters extended: `year`, `technologies` (slug/id), `category_slug`, `q`, `is_featured`; list includes `year`.
  - 7 backend tests (`test_case_study.py`).
- **Frontend `src/features/projects/`** (`types/api/hooks/queries/services/utils/mappers/components/pages/dev`):
  - Components: `FeaturedProjectCard`, `ProjectFilterBar`, `ArchitectureViewer`, `ProjectGallery`, `ProjectsTimeline`, `ProjectResults`, `CaseStudySection`.
  - 16 new page-builder section types (4 listing + 12 case) registered in the registry (lazy).
  - `useProjectBySlug` / `useProjectsFiltered` / `useProjectTechnologies` / `useProjectCategories` (React Query, existing infra).
  - Analytics: `project_view`, `project_filter`, `project_search`, `technology_filter`, `project_gallery_open`, `project_gallery_image_view`, `related_project_click`, `related_article_click`, `project_cta_click`, `case_study_section_visible`, `scroll_depth`.
  - SEO: `useProjectSeo` (title/description/canonical/OG) + BreadcrumbList + CreativeWork JSON-LD.
  - `/dev/projects` console (payload · filters · cache · analytics).
  - Storybook stories (ProjectHero, ProjectFilters, ArchitectureViewer, Gallery, Timeline, Results, RelatedProjects).
- Frontend tests (`projects.test.tsx` — filter→params, case-study render, 404, gallery lightbox, architecture fallback).
- Docs: `docs/pages/projects.md`, `docs/pages/project-case-study.md`, `docs/ux/projects-experience.md`, `docs/architecture/project-case-study.md` (ADR) + diagrams `projects-flow.svg`, `case-study-flow.svg`, `project-architecture.svg` + 5 Visual QA SVGs.
- `manage.py publish_scheduled` unchanged; demo projects backfilled with honest, generic `case_study` content.

### Modified
- `apps/projects/models.py`, `api/{filters,serializers,viewsets}.py`, `api/urls.py`, `apps/page_builder/{models,seed}.py`, `apps/common/seed.py`.
- Routes: `/projects`, `/projects/:slug`, `/dev/projects`. Page-builder registry/config extended (34 section types).
- CHANGELOG/NEXT_PHASE.

### Verification
Backend pytest **120 passed** ✅ · Frontend Vitest **93 passed** ✅ · TypeScript ✅ · ESLint ✅ · Vite build ✅ · Storybook build ✅ · ruff-clean (new code) ✅ · live `/projects`, `/projects/demo-erp-system`, `/dev/projects` ✅.

---

## [Phase 8D] — 2026-08-06 — Enterprise Services Experience

### Added
- **`/services` route** — the Enterprise Services Experience, fully composed by the Page Builder:
  `ServicesPage` loads `usePage("services")` and renders `<PageRenderer />` — **no hardcoded layout**.
- **Backend** — new page-builder section types (`journey`, `comparison`, `stack`, `process`), `SECTION_META`
  entries, and a seeded `services` `Page` with 10 ordered sections (hero, journey, core services,
  comparison, stack, process, faq, projects, articles, cta), localized copy (fa/en/ar) and per-page SEO.
- **Frontend sections** — 4 new lazy registry sections:
  - `JourneySection` — Problem → Solution → Technology → Result animated storytelling (reveal on scroll).
  - `ComparisonSection` — Traditional vs Hanahoush comparison table.
  - `StackSection` — animated technology stack.
  - `ProcessSection` — Discovery → … → Support steps.
  - `ServicesSection` extended to render **curated core services** from `config.items` (icon, animation,
    technology tags, CTA) and falls back to CMS services otherwise — one component, two modes.
- **Analytics** (`src/features/analytics/`) — `trackEvent`, `useAnalyticsEvents`, `useSectionVisibility`
  (IntersectionObserver), `useScrollDepth` (25/50/75/100%); wired into the page-builder renderer
  (`section_visible`) and the CTA/FAQ sections (`cta_click`, `accordion_open`).
- **`/dev/services`** console — CMS payload, rendered sections, analytics + render stream.
- Marketing extensions (backward-compatible optional props): `CTA`/`GradientCTA`
  `onPrimaryClick`/`onSecondaryClick`; `FAQAccordion` `onValueChange`.
- **Storybook** — `PageBuilder/Sections/Services` stories (Journey, Comparison, Stack, Process,
  curated Core Services).
- **Tests** — frontend `features/analytics` (3) + `services-page.test.tsx` (2); backend services-page
  composition test (1). Added an IntersectionObserver/matchMedia jsdom stub to the test setup.
- **Docs** — `docs/pages/services.md`, `docs/ux/services-story.md`, diagrams `services-flow.svg`,
  `services-page.svg`.

### Modified
- `src/app/routes/pages/ServicesPage.tsx` (new) + route `/services` replaces the placeholder.
- Page-builder registry/config extended with the four new section types (backend + frontend).
- `backend/apps/page_builder/seed.py` — services Page seed; `models.py` — new `SECTION_TYPES`.
- `CHANGELOG.md`, `NEXT_PHASE.md`.

### Verification
Backend pytest **113 passed** ✅ · Frontend Vitest **85 passed** ✅ · TypeScript ✅ · ESLint ✅ · Vite build ✅ ·
Storybook build ✅ · ruff-clean ✅ · `/services` + `/dev/services` live ✅ · services page payload (10 sections,
7 core services, 12 stack technologies) ✅.

---

## [Phase 8C] — 2026-08-06 — Enterprise Editorial Workflow

### Added
- **Backend `apps/editorial/`** — content-agnostic editorial workflow:
  - Models: `WorkflowStage` (state machine: draft → in_review → seo_review → approved → scheduled → published → archived), `ContentWorkflow` (generic FK to any content object, version, soft-publish flag), `ContentRevision` (JSON snapshots, rollback, diff), `ReviewComment` (threaded, resolved, mentions), `Approval` (approval chain with reviewer assignment), `PublicationSchedule`, `AuditEvent` (who/when/old/new/IP), `ContentLock` (owner + auto-unlock timeout).
  - `services.py` — `WorkflowService`, `ApprovalService`, `RevisionService` (snapshot/rollback/diff), `ScheduleService`, `LockService`, `CommentService`, `AuditService`.
  - **Permissions** — new ACL codenames (`editorial.view/manage/approve/review/schedule`) wired into roles.
  - **APIs** (`/api/v1/editorial/`) — `workflows/` (+ transition, submit-review, publish soft/hard, archive, reopen), `revisions/` (+ rollback), `diff/`, `approvals/` (+ decide), `comments/` (+ resolve), `schedule/`, `audit/`, `locks/` (acquire/release), `schedules/`. Auth + ACL gated; standard envelope.
  - **Admin** — workflow board (stage filter, pending approvals), inline revision history + audit timeline, approval/rollback/publish/archive actions, compare-revisions view (`difflib.HtmlDiff`), singleton/read-only safeguards.
  - `manage.py publish_scheduled` command; stages seeded in bootstrap.
- **Frontend `src/features/editorial/`**:
  - `types/`, `api/`, `hooks/` (queries + mutations with cache invalidation), `components/` (`WorkflowBadge`, `ApprovalStatus`, `RevisionCard`, `DiffViewer`, `CommentThread`, `AuditTimeline`, `LockIndicator`, `PublishButton`), `pages/` (Revision History, Workflow Timeline, Approval Queue, Review Panel, Diff Viewer, Schedule Calendar), `/dev/editorial` console.
  - Storybook stories (`Editorial/Status`, `Editorial/Workspace`).
- **Tests** — backend `apps/editorial/test_editorial_api.py` (16); frontend `src/features/editorial/tests/` (9).
- **Docs** — `docs/editorial/workflow.md`, `versioning.md`, `review-process.md` + diagrams `workflow-state-machine.svg`, `revision-chain.svg`, `approval-flow.svg`.

### Modified
- `config/api/v1.py` — mounts `apps.editorial`.
- `apps/accounts/seeders.py` — editorial permissions + role wiring.
- `apps/common/management/commands/bootstrap.py` — step 8 seeds workflow stages.
- `CHANGELOG.md`, `NEXT_PHASE.md`.

### Verification
`manage.py check` ✅ · `makemigrations --check` ✅ · migrate ✅ · bootstrap ✅ · Backend pytest **112 passed** ✅ · TypeScript ✅ · ESLint ✅ · Vitest **80 passed** ✅ · Vite build ✅ · Storybook build ✅ · ruff-clean ✅ · Live editorial API smoke ✅

---

## [Phase 8B] — 2026-08-06 — Enterprise Dynamic Page Composition Engine

### Added
- **Backend `apps/page_builder/`** — pages are no longer hardcoded layouts:
  - Models: `Page` (slug, fa/en/ar titles, draft/published/archived, `version` + `version_at`, `is_home`, soft delete), `PageSection` (sortable, enable/disable, JSON `config` + `language_overrides`, unique per `(page, section_type)`), `SectionConfiguration` (DB registry), `NavigationMenu`/`NavigationItem`, `FooterConfiguration`, `AnnouncementBar`, `HeroConfiguration`, `SEOConfiguration`, `RedirectRule`.
  - Auto `Page.version` bump on republish; `version_at` timestamp.
  - **Admin**: drag-and-drop section/nav-item ordering (`adminsortable2`), inline editing, enable/disable, live preview URLs, validation, singleton protection (footer/announcement/hero), `is_home`/`is_default` singleton flags.
  - **APIs**: `GET /api/v1/pages/`, `/pages/{slug}/` (composed page: SEO + ordered enabled sections), `/page-builder/` (registry), `/navigation/`, `/footer/`, `/announcement/`, `/seo/?slug=…`, `/hero/`, `/redirects/` — all in the standard envelope, `Accept-Language` localized, draft-protected. Navigation/footer are now model-driven (same URLs/shapes, so Phase 8A hooks keep working).
  - `localization.resolve_section_config()` — flattens localized JSON config + per-locale overrides.
  - `seed.py` + bootstrap step 7 — seeds the section registry, main menu, footer, announcement, hero, SEO and the composed `home` page (12 sections).
- **Frontend `src/features/page-builder/`**:
  - `types/`, `api/`, `hooks/` (`usePage`, `usePageList`, `usePageBuilderRegistry`, `useAnnouncement`, `useSEO`, `useHeroConfig`, `pbKeys`, `invalidatePageBuilderCache`), `config/`, `registry/` (lazy section map, `registeredSections`, unknown detection), `renderer/` (`<PageRenderer />`, `SectionBoundary`, `SectionSkeleton`, `UnknownSectionFallback`, render analytics), `components/` (`AnnouncementBar`, `PageNavigation`).
  - 14 section components (Hero, Statistics, Services, ERP, Projects, Articles, About, Team, Timeline, Partners, Testimonials, FAQ, CTA, Footer) — all reuse Phase 8A CMS hooks + marketing components (no duplication).
  - **HomePage refactored** to compose from `GET /api/v1/pages/home/` via `<PageRenderer />` — the layout is no longer hardcoded.
  - `/dev/page-builder` console (page selector, section order, lazy/analytics).
  - Storybook stories: `PageBuilder/PageRenderer`, `SectionRegistry`, `AnnouncementBar`, `Navigation`, `Footer`.
- **Docs**: `docs/architecture/page-builder.md`, `docs/page-builder/usage.md`, `docs/page-builder/section-registry.md`, diagrams `page-builder-flow.svg`, `page-renderer.svg`, `section-registry.svg`.
- **Tests**: backend `apps/page_builder/test_page_builder_api.py` (12); frontend `src/features/page-builder/tests/` (registry, analytics, renderer, hooks).

### Modified
- `HomePage` — driven by `usePage("home")` + `PageRenderer`; per-page SEO via `useSeoMeta`.
- `AppLayout` — mounts the config-driven `AnnouncementBar`.
- `config/api/v1.py` — mounts `apps.page_builder`; company navigation/footer views removed (superseded).
- `backend/config/settings/base.py` — CORS + localhost:6006 (Storybook).
- `NEXT_PHASE.md`, `CHANGELOG.md`.

### Verification
`manage.py check` ✅ · `makemigrations --check` ✅ · migrate ✅ · bootstrap (auto-seeds page builder) ✅ · Backend pytest **96 passed** ✅ · TypeScript ✅ · ESLint ✅ · Vitest **71 passed** ✅ · Vite build ✅ · Storybook build ✅ · Live API sweep (20 endpoints) ✅ · Admin page-builder screens 200 ✅ · ruff-clean ✅

---

## [Phase 8A] — 2026-08-06 — CMS Integration Layer (Frontend ⇄ Django API)

### Added
- **`src/features/cms/`** — complete CMS integration layer:
  - `api/` — typed fetchers for every CMS endpoint, envelope unwrapping, `Accept-Language` localization, request-timing recording.
  - `types/` — API payload types (Article, Project, Service, About, TeamMember, Partner, Testimonial, FAQ, Timeline, SocialLink, Office, SiteSettings, Navigation, Footer, ...).
  - `mappers/` — API → view-model mappers consumed by the marketing components.
  - `queries/keys.ts` — locale-scoped query-key factory.
  - `hooks/` — `useArticles`, `useFeaturedArticles`, `useArticle`, `useProjects`, `useFeaturedProjects`, `useProject`, `useServices`, `useServiceSections`, `useService`, `useAbout`, `useTeam`, `useTimeline`, `usePartners`, `useTestimonials`, `useFAQs`, `useSocialLinks`, `useOffices`, `useSiteSettings`, `useNavigation`, `useFooter`.
  - `services/` — `prefetchHomeContent()`, `useSiteStats()` (statistics derived from real API counts).
  - `cache/` — global cache strategy (site/content/listings stale tiers, retry/backoff, invalidation helpers).
  - `components/` — `CmsAsync` (consistent loading/error/empty boundary), `CmsSectionSkeleton`, `ResponsiveImage` (lazy + SVG fallback).
  - `seo/` — `useSeoMeta()` (title, description, canonical, OpenGraph).
  - `dev/` — `/dev/api` console (endpoint registry, request timing, cache + query state).
- **Backend public APIs** (no schema changes, no duplicate endpoints):
  - `apps/services/api/` — `GET /api/v1/services/`, `/services/{id}/`, `/service-sections/`.
  - `apps/company/api/` — `GET /api/v1/about/`, `/team/`, `/partners/`, `/testimonials/`, `/faqs/`, `/timeline/`, `/social-links/`, `/offices/`, `/site-settings/`, `/navigation/`, `/footer/`.
  - Localized computed fields via `Accept-Language` on every company/service serializer.
- **HomePage rewritten** — all 13 sections query-driven (no mock data): hero eyebrow from site settings, live statistics, services/projects/articles/about/team/timeline/testimonials/partners/FAQ from the API, footer from the app layout.
- **Navbar & Footer** driven by `/navigation/` + `/footer/` (localized, CMS-served).
- **Bootstrap** now auto-seeds demo content (articles/projects/services/company incl. timeline + social links) when missing.
- `docs/integration/api-mapping.md`; Storybook stories (`CMS/CmsAsync`, `CMS/ResponsiveImage`).
- Backend tests: `apps/services/test_services_api.py` (8), `apps/company/test_company_api.py` (14).
- Frontend tests: `src/features/cms/tests/` (mappers, cache strategy, hooks incl. dedup + locale isolation).

### Modified
- `src/app/routes/pages/HomePage.tsx` — mock arrays removed; every content section backed by React Query.
- `src/app/layouts/Navbar.tsx`, `src/app/layouts/Footer.tsx` — CMS-driven navigation/footer.
- `src/components/marketing/{articles,projects,testimonials,partners}` — lazy images + fallback; partner marquee renders text fallback instead of broken images.
- `src/app/routes/index.tsx` — added `/dev/api` (DEV only).
- `src/i18n/locales/{en,fa,ar}/translation.json` — marketing copy under `home.*` (hero, stats, sections, CTA).
- `backend/apps/common/management/commands/bootstrap.py` — seeds demo content automatically.
- `backend/apps/common/seed.py` — seeds Timeline + SocialLink demo records.
- `backend/config/api/v1.py` — mounts services + company routers.
- `frontend/tests/setup/test-utils.tsx` — includes `LanguageProvider`.

### Verification
TypeScript ✅ · ESLint ✅ · Vitest 56 passed ✅ · Vite build ✅ · Storybook build ✅ · Backend pytest 86 passed ✅ · Bootstrap + demo data ✅ · Swagger/Redoc ✅ · Admin login ✅ · Live API smoke (17 endpoints) ✅

---

## [Phase 7D] — 2025-08-04 — Cinematic Landing Page

### Added
- **`src/app/routes/pages/HomePage.tsx`** — complete 13-section cinematic landing page replacing the temporary Phase 5 homepage:
  1. Hero (animated headline, grid bg, living cursor, dual CTAs)
  2. Statistics (4 animated counters, trend indicators)
  3. Services (6 service cards, magnetic-style hover, 3-column grid)
  4. ERP hanRP (6 feature cards, 8 module status chips)
  5. Projects (3 featured cards, technology chips, client labels)
  6. Articles (3 latest article cards, categories, reading times)
  7. Technology Stack (infinite logo marquee)
  8. Timeline (6 milestones, vertical timeline 2017→2025)
  9. Testimonials (3 client quotes, star ratings)
  10. Partners (infinite logo marquee)
  11. FAQ (6 accordion items)
  12. Final CTA (gradient band, dual CTA)
  13. Footer (multi-column, company/services/resources/newsletter)
- `SiteBackground` (grid + particles) mounted on the landing page.
- `docs/design/landing-implementation.md`
- `docs/screenshots/phase-07D/` — 6 SVG section mockups (home-top, hero, services, erp, projects, footer)
- `docs/diagrams/landing-flow.svg`, `docs/diagrams/animation-flow.svg`

### Modified
- `src/app/routes/pages/HomePage.tsx` — replaced temporary demo with full landing.

### Verification
TypeScript ✅ · ESLint ✅ · Vitest 37 passed ✅ · Vite build ✅ · Storybook build ✅

---

## [Phase 7C] — 2025-08-04 — Marketing Component Library

### Added — `src/components/marketing/`
- **14 categories, 43 components** built on Phase 7B design tokens and effects.
- `common/` (7): SectionHeader, RevealContainer, GlassPanel, SpotlightContainer, AnimatedDivider, GlowBorder, FloatingBadge.
- `hero/` (1): Hero (animated headline, subtitle, CTAs, background effects).
- `statistics/` (2): StatCard (glass, trend), StatGrid.
- `services/` (3): ServiceCard (icon, features, hover), ServiceGrid, ServiceIcon.
- `projects/` (4): ProjectCard, ProjectGrid, TechnologyChip, GalleryPreview.
- `articles/` (4): ArticleCard, ArticleGrid, CategoryBadge, ReadingTime.
- `erp/` (4): ERPFeatureCard, ERPModules, ERPTimeline, ERPArchitecturePlaceholder.
- `timeline/` (3): Milestone, VerticalTimeline, HorizontalTimeline.
- `testimonials/` (2): TestimonialCard (rating, avatar), TestimonialGrid.
- `partners/` (2): LogoCloud, InfiniteLogoSlider.
- `faq/` (3): FAQAccordion, FAQSearch, FAQCategoryFilter.
- `cta/` (4): CTA, LargeCTA, SplitCTA, GradientCTA.
- `contact/` (3): ContactCard, OfficeCard, MapPlaceholder.
- `footer/` (1): EnterpriseFooter (columns, newsletter, socials).
- Dev preview: `/dev/marketing`. CSS: `animate-marquee`. Docs: `marketing-library.md`, 2 SVG diagrams.

### Verification
TypeScript ✅ · ESLint ✅ · Vitest 37 passed ✅ · Vite build ✅ · Storybook build ✅

---

## [Phase 7B] — 2025-08-04 — Design System Implementation

### Added — src/design/
- `colors/` — brand scale, semantic tokens, hover/focus/selection/scrollbar states, light/dark theme maps, `applyThemeVariables`.
- `typography/` — display/heading/body/caption/overline scales, fa/ar/en script pairing.
- `spacing/` — 4px grid, containers, sections, cards, responsive helpers.
- `radius/` — scale + per-context radii.
- `shadows/` — elevation shadows + dark variants.
- `gradients/` — brand/hero/cta/hover/mesh gradients + `renderableGradients`.
- `motion/` — fast/medium/slow/elastic/smooth/premium presets + easing.
- `glass/` — glass levels + allowed/forbidden rules.
- `elevation/` — shadow levels, glass levels, blur levels.
- `icons/` — lucide strategy + RTL mirror list.
- `illustrations/` — illustration style guide.
- `cursor/` — living-cursor tokens + **`HanahoushCursor`** (glow orb + trailing ring, rAF lerp, theme-aware, touch/low-perf/reduced-motion gates).
- `background/` — **AnimatedGrid, NoiseLayer, GradientMesh, Particles, SiteBackground** (<60fps, GPU friendly).
- `effects/` — **Glow, GlassCard, BorderGlow, MagneticHover, FloatingCard, SoftTilt, Spotlight, Reveal**.
- `index.ts` — master barrel; `tokens/` kept as backward-compatible shims.

### Theme Engine
- Improved `ThemeProvider`: **animated theme switching** (`.theme-transition` window), persistence, system listener.

### Storybook
- New token/effects/cursor/background story pages (`src/design/stories/`).
- Removed the legacy `tokens.stories.tsx` (duplicate id).

### Design Playground
- Dev-only `/design` page showing every token, spacing, shadow, radius, gradient, motion preset, glass level and effect (production build omits the route).

### CSS
- Extended `globals.css`: state/glass/shadow/gradient/cursor variables, selection + scrollbar + focus styling, glass/border-glow/grid/noise/mesh/float utilities, animated theme transitions, reduced-motion + forced-colors handling.

### Tests & Docs
- `src/design/tests/tokens.test.ts` (10 assertions).
- `docs/design/design-system.md`.
- Diagrams: `docs/diagrams/{design-system,theme-engine,motion-engine,cursor-engine}.svg`.

---

## [Phase 7A] — 2025-08-04 — Product Design & UX Architecture (documentation)

### Added — docs/design/
- `product-vision.md` — mission, vision, brand personality, personas, journey, pain points, values.
- `ux-specification.md` — full page spec (17 pages): purpose, user, CTAs, states, SEO, animations, API deps.
- `information-architecture.md` — sitemap, URL hierarchy, internal linking, breadcrumbs, search.
- `navigation-system.md` — desktop/tablet/mobile, mega menu, sticky header, footer, scroll behavior.
- `motion-system.md` — animation philosophy, mouse glow, cursor orb, parallax, hero/card/page/loading motion, scroll reveal, reduced motion, durations/easing.
- `design-language.md` — color/spacing/radius/elevation/typography/glassmorphism/shadow/icon/illustration/photography rules.
- `brand-guidelines.md` — light/dark palettes, brand indigo scale, semantic status colors, gradient rules.
- `landing-page-specification.md` — Home page section-by-section (13 sections).
- `component-map.md` — ~64 components, categories, complexity, reuse.
- `responsive-strategy.md` — ultra-wide → mobile strategy + performance guardrails.
- `multilingual-strategy.md` — fa/ar/en, RTL/LTR, fonts, content expansion, icon mirroring.
- `implementation-roadmap.md` — Phases 7B/7C/7D/8/9 with deliverables, deps, files, complexity.
- `docs/reports/phase-07A-report.md` — phase report.

### Scope
Documentation and UX architecture only — no React, CSS, or backend changes.

---

## [Phase 6.5] — 2025-08-04 — Enterprise Quality Audit + Integration + Bootstrap

### Added
- **Full `python manage.py bootstrap`** command (now applies migrations, seeds
  default permissions, default roles, demo users, and ensures a superuser).
- **`apps/accounts/seeders.py`** — permission catalog (21 permissions, 6 modules),
  role definitions (SUPER_ADMIN, COMPANY_ADMIN, CONTENT_MANAGER, PROJECT_MANAGER,
  EDITOR, VIEWER), and 6 demo users with assigned roles.
- **`apps/common/seed.py`** — demo-content seeder (articles, projects, services,
  about, FAQ, partners, team, testimonials) + `clear_demo_data()` helper.
- **Reports:** `docs/reports/phase-06.5-report.md`, `docs/reports/quality-audit.md`,
  `docs/reports/next-phase.md`.

### Demo users
`superadmin` / `companyadmin` / `contentmanager` / `projectmanager` / `editor` / `viewer`
(all logins verified → 200).

### Verified
- Backend: `check`, `makemigrations --check`, `migrate`, `bootstrap`, 64 tests,
  admin (200), Swagger (200), ReDoc (200), schema (20 paths).
- Frontend: `tsc`, ESLint, 27 tests, `vite build`, `storybook build`.

### Deferred (pending, per phase directive)
- `seed_data` / `reset_demo` management commands (seeder module is ready).
- Frontend role-based navigation, `/health` page, dashboard stat cards.

---

## [Phase 6] — 2025-08-04 — Enterprise Authentication & Authorization

### Added

#### Backend — JWT Authentication (Django REST Framework SimpleJWT)
- `rest_framework_simplejwt.token_blacklist` enabled; refresh-token blacklist + rotation (`ROTATE_REFRESH_TOKENS` + `BLACKLIST_AFTER_ROTATION`)
- Endpoints under `/api/v1/auth/`:
  - `POST /login/` — credentials → access + refresh + user payload; `remember_me` shortens refresh lifetime
  - `POST /logout/` — blacklists the refresh token + revokes the session (authenticated)
  - `POST /refresh/` — rotates tokens (blacklists the old refresh)
  - `GET /me/` — current user with role + permissions
  - `GET/PATCH /profile/` — read/update own profile
  - `POST /change-password/` — validates old password, applies Django password validators, invalidates other sessions
  - `POST /password-reset/` + `POST /password-reset/confirm/` — Django token-generator based reset, enumeration-safe
  - `GET /roles/`, `GET /permissions/` — reference lists (authenticated)

#### Backend — Security
- **Account lockout structure**: `LoginAttempt` model + `is_account_locked` service (configurable `AUTH_MAX_FAILED_ATTEMPTS`, `AUTH_LOCKOUT_MINUTES`) → 429 responses
- **Audit log**: `LoginAudit` model records login / login-failed / logout / refresh / password change / password reset
- **Session tracking**: `UserSession` model keyed by refresh-token JTI (created on login, revoked on logout/password change, `last_seen` on refresh)
- **Rate limiting hooks**: DRF scoped throttles (`login`, `refresh`, `password_reset`, `user`)
- **CSRF preparation**: SimpleJWT cookie config present; `CsrfViewMiddleware` active; `JWT_AUTH_COOKIE` flags in settings
- **Permission classes** (`apps/accounts/api/permissions.py`): `IsAdminUser`, `HasRole`, `HasPermission`, `IsOwnerOrReadOnly` (object permissions)
- Token rotation + blacklist already configured; password reset invalidates sessions

#### Backend — API documentation
- All 12 auth endpoints documented in OpenAPI via `@extend_schema` (login, logout, refresh, me, profile, change-password, password-reset, confirm, roles, permissions)

#### Frontend — `features/auth/`
- Feature slice: `api/`, `components/`, `hooks/`, `pages/`, `schemas/`, `services/`, `types/`, `utils/`
- **Pages**: Login, Forgot Password, Reset Password, Unauthorized, Session Expired
- **Components**: `LoginForm` (React Hook Form + Zod), `PasswordInput`, `RememberMe`, `ProfileMenu` (Radix dropdown), `UserAvatar`, `ProtectedRoute`, `GuestRoute`, `AuthShell`
- **Hooks**: `useAuth`, `useLogin`, `useLogout`, `useUser`, `useChangePassword`, `useRoles`, `usePermissions`
- **Schemas** (Zod): login, forgot/reset password, change password, profile
- **`AuthProvider`**: user state + session status (`loading | authenticated | guest | session-expired`); restores session on mount; subscribes to refresh-failure events

#### Frontend — Axios integration
- Automatic `Authorization: Bearer` injection
- Automatic token refresh with **retry once** (queues concurrent 401s)
- **Logout on refresh failure** (clears tokens + emits auth-failure → session-expired)
- Login/refresh/password-reset endpoints excluded from the refresh flow

#### Frontend — Routing
- `/login`, `/forgot-password`, `/reset-password` wrapped in `GuestRoute`
- `/dashboard` wrapped in `ProtectedRoute`
- `/unauthorized`, `/session-expired` added
- `Navbar` shows `ProfileMenu` when authenticated, Login link otherwise

#### Tests
- **Backend**: 20 auth tests (login, lockout, refresh, logout+blacklist, me, profile, change password, reset, roles/permissions) — total suite 64
- **Frontend**: 12 auth tests (schemas, utils, axios refresh interceptor, route guards) — total suite 27

#### Packages Added
- Backend: none (SimpleJWT + token_blacklist already available)
- Frontend: `react-hook-form`, `zod`, `@hookform/resolvers`, `@radix-ui/react-dropdown-menu`

#### Environment Variables (backend)
- `AUTH_MAX_FAILED_ATTEMPTS`, `AUTH_LOCKOUT_MINUTES`, `AUTH_SHORT_SESSION_DAYS`, `FRONTEND_URL`, `THROTTLE_LOGIN`, `THROTTLE_REFRESH`, `THROTTLE_PASSWORD_RESET`, `THROTTLE_USER`

#### Documentation
- `AUTH_FLOW.md` — full authentication flow walkthrough + endpoint reference

---

## [Phase 5] — 2025-08-04 — React Foundation & Design System

### Added

#### Application Providers (`src/app/providers/`)
- **ErrorBoundary** — class-based boundary with retry fallback
- **ThemeProvider** — light / dark / system (`data-theme` + `dark` class, system listener, localStorage)
- **LanguageProvider** — fa / en / ar with **dynamic RTL/LTR** (`document.dir`)
- **QueryProvider** — @tanstack/react-query
- **AxiosProvider** — shared client + global loading/error state
- **ToastProvider** — Framer Motion toasts (`useToast`)
- **AppProviders** — ordered composition root (see `docs/adr/ADR-0003`)

#### Theme System
- Light / Dark / System with `data-theme` attribute, system-preference listener, localStorage persistence
- Font swap: **Vazirmatn Variable** (Persian) + **Inter Variable** (Latin)

#### RTL / LTR
- Persian (RTL), English (LTR), Arabic (RTL, structure only)
- `document.dir` + `lang` switch automatically; logical CSS utilities used throughout

#### Design Tokens (`src/design/tokens/`)
- `colors.ts` (brand indigo scale + semantic), `typography.ts`, `spacing.ts`, `radius.ts`, `shadow.ts`, `animation.ts`
- CSS variables in `globals.css`; Tailwind maps to them

#### Reusable Layouts
- `AppLayout` (Navbar + main + Footer), `Container`, `Section`, `PageWrapper`, `Navbar` (responsive), `Footer`

#### UI Components (`src/components/ui/`) — 25 components
- Form: `Button`, `Input`, `Textarea`, `Label`, `Select`, `Checkbox`, `RadioGroup`, `Switch`
- Feedback: `Alert`, `Toast`, `Spinner`, `Loading`, `Skeleton`, `EmptyState`, `ErrorState`
- Display: `Badge`, `Avatar`, `Card`, `Breadcrumb`, `Pagination`, `Tabs`, `Accordion`
- Overlays: `Dialog`, `Modal`
- Page: `SectionTitle`, `HeroContainer`, `Grid`, `ThemeToggle`, `LanguageToggle`

#### Hooks (`src/shared/hooks/`)
- `useTheme`, `useLanguage`, `useAxios`, `useApi`, `useDebounce`, `useLocalStorage`, `useWindowSize`

#### Axios Foundation (`src/shared/api/`)
- Interceptors (bearer token, transparent refresh **structure only**)
- Error normalization (`ApiError` envelope), loading event bus
- `tokenStorage` (access/refresh persistence — auth structure only, no login)
- `apiRequest` typed against the backend envelope

#### Routing
- Empty routes: `/`, `/services`, `/projects`, `/articles`, `/about`, `/login`, `/dashboard`, `*` (404)
- Temporary homepage: Hanahoush / Enterprise Platform / React Foundation Ready + theme switch, language switch, sample buttons, cards, typography

#### Storybook 8
- `.storybook/main.ts` + `.storybook/preview.tsx` (providers + theme/locale toolbar globals)
- Stories for Button, Input, Card, Badge, Alert, Form Controls, Data Display, Design Tokens
- `npm run storybook`, `npm run build-storybook`

#### Documentation (`docs/`)
- `architecture/`, `frontend/`, `components/`, `adr/` (ADR-0001 … ADR-0005)

#### Packages Added
- `@fontsource-variable/inter`, `@fontsource-variable/vazirmatn`
- `class-variance-authority`, `lucide-react`
- Radix primitives: `@radix-ui/react-slot|dialog|select|checkbox|radio-group|switch|tabs|accordion|avatar|label`
- Dev: `storybook`, `@storybook/react-vite`, `@storybook/react`, `@storybook/addon-essentials`

### Changed
- `AppProviders` now composes all providers; `main.tsx` imports fonts
- `tailwind.config.ts` — full token mapping + keyframes (spacing extension intentionally omitted — ADR-0002)
- `vite.config.ts` — vendor `manualChunks` splitting
- `globals.css` — full design-token variable set + RTL font handling
- `eslint.config.mjs` — ignore `storybook-static`

---

## [Phase 4] — 2025-08-04 — Backend API Foundation

### Added

#### API Versioning
- `/api/v1/` namespace for versioned endpoints
- Architecture ready for future `/api/v2/` (one module per version)

#### Reusable API Infrastructure (`config.api.base`)
- **`pagination.py`** → `DefaultPagination` (page-number, configurable page size) + `CursorPagination`
- **`serializers.py`** → `HanahoushModelSerializer`, `TranslatableFieldsMixin`, `PublishableSerializerMixin`, `NestedMediaFileSerializer`
- **`filters.py`** → `BaseFilterSet`, `PublishableFilterSet`, `HierarchicalFilterSet`, `MediaFilterSet`
- **`ordering.py`** → `DefaultOrderingFilter` (safe whitelist ordering), `MultiFieldSearchFilter` (`q` param)
- **`viewsets.py`** → `BaseViewSet` (CRUD + soft-delete/restore + standard responses), `PublishableViewSet`
- **`responses.py`** → standard response builder + `hanahoush_exception_handler`
- Standard response envelope: `{success, message, data, errors}` (+ `request_id`, `pagination`)

#### Health Endpoints
- `GET /api/health/` — DB + cache checks
- `GET /api/version/` — API/app/Django version + environment
- `GET /api/ping/` — liveness probe

#### CRUD APIs (Article + Project only)
- **Article**: `/api/v1/articles/` (list/create), `/api/v1/articles/{id}/` (retrieve/update/partial/delete), `/api/v1/articles/{id}/soft-delete/`, `/api/v1/articles/{id}/restore/`
- **Project**: same shape under `/api/v1/projects/`
- Filtering (status, category, tags/technologies, featured, dates), searching (`q`), ordering (`ordering`), pagination (`page`, `page_size`)

#### Permissions
- `DEFAULT_PERMISSION_CLASSES = AllowAny` (authentication deferred to next phase)
- Viewsets declare `permission_classes = [AllowAny]`

#### OpenAPI / Swagger / ReDoc
- `/api/schema/` — OpenAPI 3 schema (8 paths)
- `/api/docs/` — Swagger UI
- `/api/redoc/` — ReDoc
- drf-spectacular configured with enum overrides and path prefix `/api/v[0-9]+`

#### Logging & Request ID
- `APILoggingMiddleware` logs API requests (path, method, status, duration, request_id, user)
- Request ID correlation (`X-Request-ID` header) already provided by `RequestIDMiddleware`

#### Testing
- 44 API tests covering CRUD, pagination, filtering, searching, ordering, validation, health endpoints
- Test packages: `apps/articles/tests/`, `apps/projects/tests/`, `config/api/tests/`

#### Files Created (Phase 4)
| Path | Purpose |
|------|---------|
| `config/api/urls.py` | API root URL wiring (health + v1) |
| `config/api/v1.py` | Version-1 endpoint includes |
| `config/api/swagger.py` | Swagger/OpenAPI URL wiring |
| `config/api/health.py` | Health/version/ping endpoints |
| `config/api/base/*.py` | Reusable API components |
| `config/middleware/api_logging.py` | API request logging |
| `apps/articles/api/*.py` | Article serializer/filter/viewset/urls |
| `apps/projects/api/*.py` | Project serializer/filter/viewset/urls |
| `apps/articles/tests/`, `apps/projects/tests/`, `config/api/tests/` | API test suites |

#### Settings Changes
- `DEFAULT_PERMISSION_CLASSES` → `AllowAny`
- `DEFAULT_PAGINATION_CLASS` → `config.api.base.pagination.DefaultPagination`
- `EXCEPTION_HANDLER` → `config.api.base.responses.hanahoush_exception_handler`
- `SCHEMA_PATH_PREFIX`/`ENUM_NAME_OVERRIDES` in `SPECTACULAR_SETTINGS`
- `APILoggingMiddleware` added to `MIDDLEWARE`
- `api.request` logger added

---

## [Phase 3] — 2025-08-04 — Enterprise Django Admin

### Added

#### Bootstrap & Superuser
- **Automatic first-run superuser creation** (`apps.accounts.bootstrap.ensure_superuser`)
  - Creates superuser only when none exists (idempotent)
  - Credentials configurable via `BOOTSTRAP_ADMIN_*` environment variables
  - Default: `admin` / `admin@hanahoush.local` / `Admin@123456`
  - Safe during migrations: catches `DatabaseError` in `AppConfig.ready()`
  - Management command `manage.py bootstrap` for manual invocation

#### Core Admin Infrastructure (`apps.core.admin`)
- **Custom `HanahoushAdminSite`** — branded header, ordered sidebar, model descriptions
- **`ImportExportAdminMixin`** — auto-generated resources with CSV/XLSX/JSON support
- **`ActiveBulkActionsMixin`** — Activate / Deactivate bulk actions
- **`PublishableBulkActionsMixin`** — Publish / Archive / Feature / Unfeature / Activate / Deactivate
- **`SingletonAdminMixin`** — enforces single row (`AboutPage`, `SiteSettings`)
- **`PublishableModelForm`** — validates required Persian content (`title_fa`, `description_fa`)
- **CKEditor 5 rich text** on all `TextField` of publishable entities
- **Help texts** injected without modifying models
- **`image_preview_html()`** — thumbnail rendering for `MediaFile` FKs

#### Per-App Admin Customizations
| App | Models | Key Features |
|-----|--------|--------------|
| `accounts` | User, Role, Permission | User import disabled, password excluded from export |
| `media_library` | MediaFile | Image preview in list & detail, CSV/JSON/XLSX export |
| `articles` | Category, Tag, Article | CKEditor on content, auto slug from `title_en`, SEO & Publishing fieldsets |
| `projects` | ProjectCategory, Technology, Project, ProjectImage | **Drag-and-drop `ProjectImage` inline**, image previews, sortable gallery |
| `services` | ServiceSection, Service | Rich text, SEO/Publishing fieldsets |
| `company` | 9 models | **Singleton `AboutPage` & `SiteSettings`**, structured fieldsets |
| `analytics` | Visitor, PageView, ContactRequest, Newsletter | Read-only fact tables, `has_add_permission=False`, optimized list pages |

#### Bulk Actions (Publishable entities)
- **Publish** — set status to `published`
- **Archive** — set status to `archived`
- **Feature / Unfeature** — toggle `is_featured`
- **Activate / Deactivate** — toggle `is_active`

#### Import / Export
- **Formats:** CSV, Excel (XLSX via `openpyxl`), JSON
- **Automatic resource generation** with audit fields excluded
- **Security:** User import disabled, `password` never exported
- **All 26 models** support export; publishable models support import

#### Validation
- **Publishable content** (Article, Project, Service, AboutPage, etc.):
  - `title_fa` required
  - `description_fa` required
- **Singletons** (`AboutPage`, `SiteSettings`): max 1 row, delete forbidden

#### Performance Optimizations
- **`list_select_related`** on all FKs (`created_by`, `updated_by`, FKs in models)
- **`prefetch_related`** on M2M and reverse FKs (`tags`, `images`, `technologies`)
- **`list_editable`** for quick status toggles without form load
- **`list_per_page = 50`** (configurable via `ADMIN_LIST_PER_PAGE`)

#### Admin Usability
- **CKEditor 5** rich text on all publishable content fields
- **SEO fieldset** (collapsed): `meta_title`, `meta_description`, `meta_keywords`, `canonical_url`, `og_image`
- **Publishing fieldset**: `status`, `is_featured`, `is_public`, `published_at`, `sort_order`
- **Audit fieldset** (collapsed): `created_by`, `updated_by`, `created_at`, `updated_at`
- **Auto slug** from `title_en` via `prepopulated_fields`
- **Drag-and-drop** `ProjectImage` inline (`adminsortable2`)
- **Image previews** in `MediaFile`, `ProjectImage`, `Project` list/display
- **Autocomplete** on all FKs (`autocomplete_fields`)
- **Help texts** on every field via `HelpTextAdminMixin`

#### Packages Added
- `django-import-export>=4.3` — CSV/Excel/JSON import-export
- `django-ckeditor-5>=0.2.10` — Rich text editor
- `django-admin-sortable2>=2.1` — Drag-and-drop ordering
- `openpyxl>=3.1` — Excel export support

#### Settings Added
- `default_site = "apps.core.admin_site.HanahoushAdminSite"` — custom admin site
- `ADMIN_LIST_PER_PAGE = 50` — pagination
- `IMPORT_EXPORT_FORMATS = [CSV, JSON, XLSX]`
- `CKEDITOR_5_CONFIGS["default"]` — toolbar config
- `BOOTSTRAP_ADMIN_ENABLED/USERNAME/EMAIL/PASSWORD` — bootstrap config

---

## [Phase 2] — 2025-08-03 — Domain Models & Database

### Added
- 8 Django apps: `core`, `accounts`, `media_library`, `articles`, `projects`, `services`, `company`, `analytics`
- 26 concrete models with multilingual support (fa/en/ar)
- Abstract bases: `BaseModel`, `SluggedNamedModel`, `PublishableModel` (in `apps.core`)
- Custom user model `accounts.User` (extends `AbstractUser`)
- Role-based permissions (`Role`, `Permission`)
- Centralized `MediaFile` for all assets
- Hierarchical taxonomies with self-referencing FKs
- Normalized galleries (`ProjectImage`), M2M taxonomies, singletons
- 7 migration files applied cleanly
- All models registered in Django Admin (basic)

---

## [Phase 1] — 2025-08-03 — Architecture Scaffold

### Added
- **Backend** (`backend/`): Django 5 + DRF + PostgreSQL
  - Clean Architecture: `domain` → `application` → `infrastructure` → `presentation`
  - Environment-based settings: `base` / `local` / `production` / `ci`
  - JWT ready (SimpleJWT), Swagger/OpenAPI (drf-spectacular)
  - i18n ready (en/fa), Docker ready
- **Frontend** (`frontend/`): React 18 + Vite + TypeScript + Tailwind
  - shadcn/ui, Framer Motion, GSAP, TanStack Query, Axios, i18next
  - Feature-based structure, theme provider, i18n (en/fa)
- **Dev tooling**: ESLint 9 (flat), Prettier, TypeScript strict, Vitest
- **No Docker, No Next.js, No Node backend** — strict separation

---

## Future Phases (Postponed)

- **Phase 7**: Remaining CRUD APIs (services, company, analytics, media library) + throttling on content endpoints
- **Phase 8**: Frontend business pages & components (UI implementation per feature slice)
- **Phase 9**: ERP integration (`hanRP`) — async workers, webhooks, outbox pattern
- **Phase 10**: Observability (Sentry, structured logging, APM)
- **Phase 11**: Custom admin theme (Tailwind-based, dark mode)
- **Later**: MFA / TOTP, email verification, password-less login, role management UI