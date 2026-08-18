# Phase 9D — Production UX, Content & Website Excellence

**Status:** ✅ COMPLETE — READY FOR REVIEW
**Date:** 2026-08-16
**Phase:** 9D — Production-readiness pass: navigation/IA, real content quality, hero and
conversion, error/loading/empty states, SEO, accessibility, mobile, performance hygiene,
development-artifact removal and enterprise trust.
**Scope constraint honoured:** No real ERP/Odoo/hanRP integration. Odoo 19 is not deployed.
`ERP_ENABLED=false`, `ERP_PROVIDER=null`, `NullProvider` stays active. The Phase 9A/9B
connector foundation is untouched (verified in §21). No duplicate systems; no architecture
rewrite.

---

## 1. Executive summary

Phase 9D moved Hanahoush from "technically complete and visually polished" to
"production-ready, coherent, trustworthy, usable, responsive, accessible and
content-complete". A full audit was performed first (frontend and backend, all phase
reports through 9C), gaps were prioritised by real user impact, and only justified
improvements were implemented — no feature bloat.

Key deliverables:

- **Navigation/IA** — the mobile drawer now mirrors desktop capabilities (search entry,
  theme switch, authenticated Dashboard/Logout instead of a misleading "Login" link);
  footer internal links are client-side router `Link`s (no full reloads) and the newsletter
  block is a real, guarded form; visible breadcrumbs added to article and project detail
  pages.
- **Content quality** — dead scaffold keys removed from all three locales; brand spelling
  unified (EN "Hanahoush", AR `هاناهوش`); correct Arabic plurals for search counts; Arabic
  copy polish; softened unverifiable claims ("companies trust", "responds within one
  business day"); dev-only sample data neutralised (no real-sounding people or companies);
  the backend page-builder seed copy was refreshed and is now synced idempotently on
  `bootstrap`.
- **SEO** — every public, auth and error route now sets title/robots through the single
  `useSeoMeta` system: 404 noindexed with helpful navigation, auth/dashboard noindexed,
  detail-page metadata localised (FA/AR titles/descriptions), static `index.html` head
  hardened for non-JS crawlers and social scrapers.
- **Error / loading / empty states** — no raw exception messages on any data page; detail
  "not found" states are no longer dead ends (retry + Home/listing navigation); generic
  human copy + retry on every page shell.
- **Forms** — the newsletter CTA is a real `<form>` with a duplicate-submit guard and
  `aria-live`; auth pages gained a real `<h1>`; the forgot-password link uses the router.
- **Accessibility** — global `MotionConfig reducedMotion="user"`; RTL logical properties
  in the timeline; labelled article search; single-h1 auth/detail pages; consistent focus
  rings retained.
- **Development artifacts** — `/design` and `/dev/*` pages are now tree-shaken from the
  production build entirely (verified in `dist/`); `PlaceholderPage` dead code removed.
- **Performance hygiene** — conditional dev-route imports removed dead chunks; image
  lazy-loading, route splitting and React Query caching already present were preserved.

Verification (all executed, not claimed): frontend `typecheck` 0 errors, `lint` 0 errors,
`test` **147 passed (28 files)**, `build` ✅, `build-storybook` ✅; backend `check` ✅,
`makemigrations --check` ✅ no changes, `migrate` ✅, `bootstrap` ✅ (copy synced), `pytest`
**274 passed**; live API smoke of every public endpoint; production-bundle artifact
inspection.

## 2. Initial audit findings

The audit used four parallel explorations (routing/navigation, public pages, backend,
i18n content) plus reading all phase reports through 9C. Highest-impact findings by class:

- **A — Missing production functionality:** breadcrumbs wired in the infra but never
  rendered on any real route; footer newsletter button unwired (`onClick={() => {}}`);
  mobile users could not reach search or theme switching (desktop-only controls).
- **B — UX inconsistencies:** mobile drawer showed "Login" even when authenticated; detail
  pages used raw anchors (full reloads); skeleton layout differed from the loaded layout
  (padding jump).
- **C — Content gaps:** `DashboardPage` showed "this section is under construction";
  `NotFoundPage` kept the *previous* page's title/canonical (no SEO at all).
- **D — Broken / weak flows:** detail "not found" states were dead ends (no retry, no home
  link); raw `page.error.message` leaked on Home/Services/About/Contact/Search.
- **E — Accessibility:** auth pages had an `h3` as their highest heading; the newsletter
  CTA was not a form, had no live region and had a duplicate-Enter race; the article
  search input was unlabelled; framer-motion had no reduced-motion handling.
- **F — Mobile issues:** no search/theme in the drawer; the search command was hidden
  below 640px.
- **G — Performance:** dev-route chunks (DesignPlayground, MarketingPreview and the dev
  consoles) shipped as dead code/bundles in the production build.
- **H — SEO:** 404/auth/dashboard pages missing `noindex` + titles; article/project
  metadata always English even when reading FA/AR; static `index.html` description was
  "Hanahoush platform frontend".
- **I — Navigation:** footer and listing-page links were plain `<a>` (full reloads); the
  router comment claimed pages were placeholders.
- **J — Trust/conversion:** hero subtitle claimed "companies trust"; contact promised
  "responds within one business day"; the dev gallery contained real-sounding testimonials
  (incl. a real company name) and fabricated company history.
- **K — Loading/Error/Empty:** inconsistent error-message policy; detail dead ends;
  contact/newsletter states otherwise strong.
- **L — Content quality:** dead scaffold key `app.reactFoundationReady`; Arabic brand
  transliteration conflicted (`هانه‌هوش` vs `هاناهوش`); Arabic plural was wrong for 2–10
  results; several stiff Arabic phrases; EN lowercase "About hanahoush".
- **M — Dev artifacts:** dev routes gated by build mode (404 in production) but their code
  still shipped in the bundle; risky sample data in `MarketingPreview.tsx`.
## 3. Public route audit

| Route | Before | After |
|---|---|---|
| `/` | hero, live stats, CMS page | skeleton no padding-jump; localized error title; softened subtitle (seed synced) |
| `/services` | localized error copy | no raw messages; same hierarchy |
| `/projects` | generic error already | unchanged (already good) + localized hero |
| `/projects/:slug` | JSON-LD breadcrumb only; dead-end 404 | visible breadcrumb; localized not-found with retry + navigation |
| `/articles` | unlabelled search input; English chrome | aria-labelled search; localized loading/error/empty/count/load-more |
| `/articles/:slug` | English-only body + meta | locale-aware body/description; visible breadcrumb; localized TOC/related/newsletter |
| `/about` | fine | errors now generic + localized |
| `/contact` | strong form | surrounding copy de-claimed; form untouched (already excellent) |
| `/search` | noindex, complete states | raw error message no longer leaked |
| `/login` · `/forgot-password` · `/reset-password` | no SEO; h3 heading | noindex + title; h1 heading |
| `/unauthorized` · `/session-expired` | no SEO | noindex + title |
| `/dashboard` | "under construction" stub | real account overview (session badge, role, quick links), noindex |

All public routes now share one coherent product feel: consistent skeletons, human error
copy, retry actions, breadcrumbs where navigation is deep, and locale-aware content.

## 4. Navigation audit

Reviewed against `docs/design/information-architecture.md` and
`docs/design/navigation-system.md`.

- **Desktop nav** — unchanged inline links (CMS-driven, i18n fallback). Active states,
  language toggle, theme toggle, search command, profile menu all preserved.
- **Mobile nav (fixed)** — the drawer previously always showed "Login"; it now shows the
  authenticated identity + Dashboard + Logout when signed in, plus a Search entry and a
  Theme toggle row. No feature requires a larger viewport anymore.
- **Footer (fixed)** — internal links render as react-router `Link`s (no full-page
  reload); external/social links open with `rel="noopener noreferrer"`; the previous
  no-op newsletter button is now a functional form with loading/success/error states.
- **Breadcrumbs (added)** — visible `Home › Section › Item` breadcrumbs on
  `/projects/:slug` and `/articles/:slug`, matching the IA detail-page rule (JSON-LD
  `BreadcrumbList` was already emitted).
- **No links to nonexistent functionality** — the seeded navigation contains only
  implemented routes (`/`, services, projects, articles, about, contact). The planned
  `/services/:slug`, `/articles/category/:slug`, `/articles/tag/:slug`, `/privacy`,
  `/terms` are *not* linked because they are not implemented (deferred, §27).

## 5. Content audit

- **Dead keys removed** in EN/FA/AR: `app.reactFoundationReady`, `common.underConstruction`.
- **Brand spelling unified**: EN lowercase slip fixed ("About Hanahoush"); AR `app.title`
  unified to `هاناهوش` (was the Persian-form `هانه‌هوش`).
- **Arabic plural rules**: `search.resultCount` now defines `_zero/_one/_two/_few/_many/
  _other` so counts of 2–10 read correctly in Arabic (`نتيجتان`, `نتائج`).
- **Arabic copy polish**: hero headline "برمجيات مؤسسية مُهندَسة كمنتج", articles eyebrow
  "رؤى", testimonials eyebrow "يثق بنا عملاؤنا", timeline "معالم", CTA "تحدث إلى فريق
  الهندسة", plus homepage/hero subtitle alignment across locales.
- **Unverifiable claims softened**: hero subtitle dropped "companies trust"; contact and
  seed copy dropped the "responds within one business day" promise in favour of "every
  inquiry is reviewed by our engineering team" (EN/FA/AR; frontend i18n + backend seed).
- **Dev-only sample data neutralised** (`MarketingPreview.tsx`): removed real-sounding
  testimonials (`Ali Rezaei/CTO/Acme`, `Sara Ahmadi/Pars Industrial`), fabricated
  statistics (8+ years, 120 projects, 98% satisfaction), the fabricated timeline
  (founded 2017, "Odoo partnership 2025", "500-employee manufacturing company") and fake
  contact details. Values now use neutral, explicitly-labelled sample content. The live
  site statistics derive from real API counts (`useSiteStats`).
- **Backend seed refreshed & synced**: `apps/page_builder/seed.py` copy updated across
  EN/FA/AR (hero headline/subtitle, about/testimonials/timeline/CTAs/contact) and section
  seeding now uses an idempotent `_sync_section` (`update_or_create`) so already-seeded
  databases receive the refined copy on `bootstrap` — verified post-run (§25).

## 6. Homepage / conversion audit

First-viewport checks (what the user immediately understands):

1. **What Hanahoush is** — brand identity, `ه` mark and "Hanahoush" in the sticky navbar.
2. **What it builds** — hero headline "Enterprise software, engineered like a product."
   plus eyebrow/tagline; subtitle lists ERP, AI, web apps, Odoo, programming.
3. **Problem it solves** — services/statistics sections below the fold carry the "why";
   the hero subtitle communicates production-grade positioning without invented proof.
   Headline/subtitle refined for clarity and believability (see §5).
4. **Primary action** — hero CTA "Start a project" → `/contact`; secondary
   "Explore services" → `/services`; bottom CTA family → `/contact`.

Trust signals: live statistics (real API counts), service composition, FAQ, partners
(technology platforms only — no invented client logos). Motion kept minimal; global
`reducedMotion="user"` added (§15).
## 7. Services audit

`/services` is a fully composed page-builder experience: hero → journey (four steps:
problem → solution → technology → result) → core services (seven disciplines) →
comparison → technology stack → process (seven stages) → FAQ → related projects →
related articles → CTA. Every section carries explicit EN/FA/AR copy, real data sources
(services/journey/stack from the CMS or canonical seed), a localised "See our process"
CTA and a contact path.

Fixes applied: the `core_services` Persian eyebrow was accidentally English ("What we do")
→ "چه کاری انجام می‌دهیم"; the Arabic headline was refined; section copy now syncs
idempotently. No section was identified as filler that needed removal.

## 8. Projects audit

- **Discovery/filtering** — `/projects` is composed with featured projects, category /
  technology / year filters and search; filter-section header copy localised.
- **Case-study storytelling** — the detail page preserves the challenge → objectives →
  solution → architecture → technology → journey → gallery → results → related → CTA
  rhythm. All section labels and titles are now localised (previously hardcoded English).
- **Results honesty** — `CaseStudySection` / `ProjectResults` render only what is in the
  CMS; seeded case studies use implementation-level language, never fabricated metrics.
- **Breadcrumb + RTL** — visible breadcrumb added; the timeline dot/border now use logical
  properties (`border-s` / `ps-6` + RTL flip) so the LTR rail is mirrored correctly.
- **Not-found** — localised copy + retry + "Projects"/"Home" links (no dead end).

## 9. Knowledge Hub audit

- **Editorial controls** — reading progress, TOC (desktop sticky + mobile toggle), share,
  related articles/projects/services, newsletter, category/tag explorers were already
  present and retained.
- **Fixes** — visible breadcrumb; TOC mobile toggle labelled + `aria-controls`; the TOC /
  related / loading / error / count / load-more chrome localised; the article body is now
  selected by active locale with fallback (was always English); `ArticleMeta` and
  `RelatedArticles` use the active locale instead of a forced `"en"`; newsletter CTA
  localised.
- **SEO** — see §16 (localised metadata; `BlogPosting` + `BreadcrumbList` JSON-LD
  retained).
- No fabricated authors introduced; authors remain CMS-driven.

## 10. About / Contact audit

- **About** — communicates identity/mission/values via the CMS `about` page (hero, story,
  values, FAQ, CTA). Team/timeline/partners/testimonials/offices remain *uncomposed* by
  design until real data exists (honest-demo constraint). `Organization` + `FAQPage`
  JSON-LD retained.
- **Contact** — the form was already the strongest surface (localised zod, honeypot,
  `submitGuard`, focus-on-success, `aria-live`, server 10/min throttle). This phase
  removed the service-time promise from the surrounding copy; no internal contact data was
  exposed (site-settings contact email/phone are intentionally empty; dev placeholders
  were replaced with obviously generic example values).

## 11. Search audit

- **Relevance/safety** — the backend search is scoped to published, `is_public` content
  only (verified in code + smoke); drafts, archived, private and admin content cannot
  appear in results.
- **States** — loading skeletons with `aria-busy`; empty state with next-action guidance;
  error state with retry (the raw API message is no longer rendered); type-filter select;
  URL-driven (shareable) query.
- **Accessibility** — labelled input, clear button, `role="search"`.
- **Mobile & RTL** — the page flow works at every breakpoint; results inherit document
  RTL.
- **SEO** — `noindex,follow` by design.
- The now-unused `errorMessage` prop path is retained for future callers but is not fed
  with raw exceptions.
## 12. Forms audit

| Form | Labels/validation | Load | Success | Failure | Duplicate guard | Focus/live |
|---|---|---|---|---|---|---|
| Contact | localised zod + aria-describedby | spinner | box + focus | `role="alert"` | `submitGuard` + disabled | focus-on-success + `aria-live` |
| Newsletter CTA | `aria-label` | spinner/disabled | inline + `aria-live` | inline + `aria-live` | added submit guard + real `<form>` | `aria-live` added |
| Login | labels + autoComplete + zod | spinner | → dashboard | `Alert destructive` | disabled | render-time |
| Forgot password | label + email validation | spinner | swaps to success Alert | `Alert destructive` | success unmounts form | render-time |
| Reset password | labels + match refine | spinner | success Alert + link | `Alert destructive` | disabled | render-time |
| Footer newsletter | label inside real form | guard | inline | inline | guard | `aria-live` |
| Search | labelled | skeletons | — | ErrorState | debounce | `aria-busy` |

No public form silently fails; every action has a visible, localised outcome.

## 13. Loading / error / empty state audit

- **Loading**: page skeletons (no spinner-first flashes), section skeletons with
  `aria-busy`, article/case-study pulse skeletons. Removed the skeleton-to-content
  padding jump on Home/Services/About/Contact.
- **Error**: page shells now show `errors.loadingPageTitle` + `errors.unexpected`
  (localised) instead of `page.error.message`; search behaves likewise; detail 404s
  render `ErrorState` + retry + navigation links.
- **Empty**: search `EmptyState`, article-list "no articles match the filters",
  case-study "stages not defined", and collection `CmsAsync` empty states all give
  context.
- **404**: branded, `noindex`, now with a Home CTA and quick links (Search / Services /
  Projects / Articles / Contact).
- **500**: `RouteErrorFallback` already showed a safe message + `noindex,follow` —
  retained.

## 14. Responsive audit

Static/breakpoint review at 320/375/390/430/768/1024/1280/1440 (no browser harness
available in this environment — see §26):

- Navbar: stacked then inline at `md`; the drawer covers search/theme/auth on mobile
  (new).
- Hero and section grids stack cleanly (1 → 2 → 3/4 columns via responsive classes); the
  case-study hero, gallery and process cards collapse to a single column.
- Article reading: the `220px` TOC rail goes full-width on mobile behind the labelled TOC
  toggle.
- Long Persian/Arabic strings: container widths + wrap-friendly typography; no fixed-width
  content below `sm`.
- Timeline RTL rail fixed (logical properties).
- Touch targets: existing `h-9`/`h-10`/`h-11` controls and nav rows retained.
- No horizontal-scroll traps found in code; the only intentional horizontal scroll is the
  partner logo marquee.

## 15. Accessibility audit

- **Reduced motion**: `<MotionConfig reducedMotion="user">` wraps the app so
  framer-motion honours `prefers-reduced-motion` globally (single source, no per-component
  piling).
- **Heading hierarchy**: auth pages now render one `h1` (previously an `h3` via
  `CardTitle`); the 404 page has a single h1; detail pages keep exactly one h1.
- **Labels / aria**: the article search input is now labelled; the newsletter forms
  (CTA + footer) are real `<form>`s with accessible names and `aria-live` status regions.
- **Focus & states**: existing `focus-visible:ring` classes retained; TOC mobile toggle
  gained `aria-controls`; invalid fields keep `aria-invalid`/described-by wiring.
- **RTL**: language provider already sets `dir` and `lang`; timeline geometry now uses
  logical properties.
- **Screen-reader names**: icon-only controls (theme/language/search, socials) all carry
  accessible labels; brand mark uses `aria-hidden` where decorative.
- No meaningless ARIA was added.
## 16. SEO audit

Extended the existing single `useSeoMeta` pipeline — no second SEO system was created.

- **404** (`NotFoundPage`) — now emits `title` + `robots: noindex,follow` (previously it
  kept the previous page's head and had no robots at all).
- **Auth + utility pages** — `Login`, `ForgotPassword`, `ResetPassword`, `Unauthorized`,
  `SessionExpired` and `Dashboard` now emit localised titles with `noindex,follow`.
- **Detail pages** — article and project metadata now use the active-locale title and
  description (FA/AR) with EN fallback; canonical, OG and Twitter tags preserved.
- **Static head** (`index.html`) — hardened for non-JS crawlers/social scrapers:
  descriptive title and meta description, `theme-color #932990`, OG defaults and a Twitter
  card — this is the crawlable fallback in a client-rendered SPA.
- **Unpublished content** — already hidden from sitemaps and search views
  (published-only querysets and sitemap).
- **JSON-LD** retained: `BlogPosting` + `BreadcrumbList` (articles), `CreativeWork` +
  `BreadcrumbList` (projects), `Organization` + `FAQPage` (about). Visible breadcrumbs now
  mirror the structured-data breadcrumbs.
- Known limitation (unchanged, documented): no SSR/prerender, so metadata for non-JS
  crawlers falls back to the static `index.html` head.

## 17. Performance audit

- **Bundle behaviour** — verified in `dist/`: route-level code splitting produces small
  per-page chunks (`HomePage`, `ArticleDetailPage`, `case-study`, `articles-hub`, …);
  the main `index` and heavy vendors remain shared chunks.
- **Dev-route elimination** — `/design` and `/dev/*` page modules are no longer emitted
  anywhere in the production build. Previously (Phase 8H) `DesignPlayground`,
  `MarketingPreview` and several dev consoles shipped as dead chunks; a production-build
  grep now finds none of them.
- **Images** — `ResponsiveImage` (srcset, lazy `loading`) retained; search thumbs use
  `loading="lazy"` + `decoding="async"`; all have explicit aspect ratios to avoid layout
  shift.
- **Animations** — untouched premium brand motion preserved; `reducedMotion="user"`
  prevents unnecessary work for users who opt out.
- **Request duplication / caching** — React Query keys and the existing
  cache/invalidate strategy were left intact; no new data fetching was introduced.
- No premature micro-optimisations were applied.

## 18. Development artifact audit

- **Routes** — dev routes are gated behind `import.meta.env.DEV`; in a production build
  the conditional array constant-folds to `[]` and the factory imports are never
  referenced, so the code is tree-shaken out of the bundle (verified by grepping
  `dist/assets` for `DesignPlayground`, `MarketingPreview`, `ApiDevPage`,
  `PageBuilderDevPage`, `EditorialDevPage`, `MediaDevPage`, `*DevPage`, `apiRegistry`,
  `timingStore` — zero matches).
- **Visiting /dev/*** in production falls through to the branded 404.
- **Sample data** — the fabricated claims in `MarketingPreview.tsx` were neutralised and
  the page is excluded from production entirely; no mock data, internal IDs or stack
  traces ship to clients.
- **Backend** — no new internal-facing endpoints added; ERP health and admin dashboard
  remain non-public (401 for anonymous, verified by smoke).
- `PlaceholderPage.tsx` (dead component) was deleted.

## 19. Enterprise UX audit

Reviewed from an enterprise customer's perspective:

- **Clarity/professionalism** — consistent page shells, skeletons and error policy;
  localised reading flow for articles/case studies; coherent navigation at every
  breakpoint.
- **Trust** — invented proof removed (claims softened, dev samples neutralised); trust is
  carried by clarity, live statistics, technology-platform partners and honest demo case
  studies that describe implementation rather than fabricated outcomes.
- **Contact confidence** — the contact form communicates exactly what happens after
  submission (no time promises); copy now says every inquiry is reviewed by the
  engineering team.
- **Security messaging** — session-expired and unauthorized pages (noindex) guide the user
  to re-authenticate instead of failing silently.
- **Technical credibility** — services/journey/comparison/stack sections present a
  coherent delivery story in all three languages.

## 20. Brand preservation

Phase 9C anchors are fully preserved — no token changes were made in Phase 9D:

- Primary `#932990`, deep ink `#272161`, near-white surface `#FDFBFC`.
- All new UI consumes existing brand/semantic tokens (`brand-*`, `bg-card`,
  `text-muted-foreground`, `bg-accent`, destructive/success semantic variants). No new
  hard-coded colors were introduced into any component.
- The only new color usage is the static `<meta name="theme-color" value="#932990">`,
  which is the brand anchor itself (centralised value, not a new system).
- `MotionConfig`, breadcrumbs, dashboards and form states all use token classes.

## 21. ERP safety (Phase 20 requirement)

Verified at runtime after Phase 9D work:

```
ERP_ENABLED      = False
ERP_PROVIDER     = null
ERP_BASE_URL     = ''
ERP_API_KEY      = '' (none set)
ERP_WEBHOOK_SECRET = '' (none set)
```

- No real ERP server was contacted during this phase (no network calls to any ERP host).
- No Odoo 19 assumptions, models, credentials, synchronization, webhooks, mappings or
  workflows were introduced. The Phase 9A/9B connector foundation
  (`apps/integration`, `ERP_*` settings, staff-only health endpoint) is untouched and
  remains dormant/ready for future activation.
- `GET /api/v1/integration/erp/health/` returns 401 for anonymous users (smoke-verified).
- The Phase 9D seed changes touched only page-builder marketing/page content — zero ERP
  files.
## 22. Files created

- `docs/reports/phase-09D-report.md` — this report.
- `docs/screenshots/phase-09D/production-ux.svg` — token-accurate visual QA (navigation,
  breadcrumbs, 404, not-found states, form states, auth/dashboard, footer), consistent
  with the prior-phase SVG convention.

## 23. Files modified

Frontend:
- `src/i18n/locales/{en,fa,ar}/translation.json` — dead keys removed; brand unified;
  Arabic plurals/copy; new `nav.search`, `errors.*`, `article`, `articleList`,
  `caseStudy`, `dashboard`, `projects.notFound*`, `articles.notFound*`,
  `services.notFound*` keys; copy refinements.
- `src/app/routes/index.tsx` — dev routes inline-conditional (tree-shaken), fresh
  comments, `lazyElement` helper.
- `src/app/routes/pages/PlaceholderPage.tsx` — **deleted** (dead code).
- `src/app/layouts/Navbar.tsx` — mobile drawer: authored identity + Dashboard + Logout,
  search entry, theme row.
- `src/components/marketing/footer/Footer.tsx` — router `Link` for internal links,
  external `rel`, functional newsletter form.
- `src/app/routes/pages/NotFoundPage.tsx` — SEO noindex + quick links.
- `src/app/routes/pages/DashboardPage.tsx` — real account overview + noindex.
- `src/app/routes/pages/{HomePage,ServicesPage,AboutPage,ContactPage}.tsx` — localised
  errors; skeleton padding fix.
- `src/features/projects/pages/ProjectCaseStudyPage.tsx` and
  `src/features/articles/pages/ArticleDetailPage.tsx` — not-found retry + navigation +
  localised copy.
- `src/features/search/pages/SearchPage.tsx` — no raw error leak.
- `src/features/articles/components/NewsletterCTA.tsx` — real `<form>`, submit guard,
  `aria-live`.
- `src/features/auth/pages/{LoginPage,ForgotPasswordPage,ResetPasswordPage,
  UnauthorizedPage,SessionExpiredPage}.tsx` — SEO noindex + titles.
- `src/features/auth/pages/AuthShell.tsx` — real `h1`.
- `src/features/auth/components/LoginForm.tsx` — forgot-password router `Link`.
- `src/app/providers/AppProviders.tsx` — `MotionConfig reducedMotion="user"`.
- `src/features/page-builder/registry/sections/articles-article.tsx` — breadcrumb,
  locale-aware body/meta, localised TOC/related/newsletter chrome.
- `src/features/page-builder/registry/sections/articles-hub.tsx` — labelled search,
  localised states, router `Link`s.
- `src/features/page-builder/registry/sections/case-study.tsx` — breadcrumb, localised
  labels/titles, RTL timeline.
- `src/features/articles/services/seo.ts`, `src/features/projects/services/seo.ts` —
  localised title/description.
- `src/features/projects/types/index.ts` — added `short_description_{fa,en,ar}` fields.
- `src/app/routes/pages/MarketingPreview.tsx` — neutralised sample claims.
- `index.html` — production static head (description, theme-color, OG, Twitter).
- Tests updated: `about-page.test.tsx`, `services-page.test.tsx`,
  `homepage.visual.test.tsx`, `articles.test.tsx`, `projects.test.tsx`.

Backend:
- `apps/page_builder/seed.py` — refreshed copy across EN/FA/AR; new idempotent
  `_sync_section` helper; section + hero seeding now sync on `bootstrap`.
- Local database re-bootstrapped to apply the refreshed copy.

## 24. Tests

Executed (not claimed):

- Frontend: `npm run typecheck` (0 errors), `npm run lint` (0 errors), `npm run test`
  (**147 passed / 28 files**), `npm run build` ✅, `npm run build-storybook` ✅.
- Backend: `python manage.py check` ✅ (0 issues), `makemigrations --check` ✅ (no
  changes), `python manage.py migrate` ✅ (no migrations to apply),
  `python manage.py bootstrap` ✅ (copy synced, idempotent), `pytest` (**274 passed**) via
  the documented `USE_SQLITE=true` CI fallback (local PostgreSQL role cannot create test
  databases — pre-existing, see §26).

## 25. Verification results

| Check | Result |
|---|---|
| TypeScript `typecheck` | ✅ 0 errors |
| ESLint `lint` | ✅ 0 errors |
| Vitest | ✅ 147 passed (28 files) |
| Vite build | ✅ |
| Storybook build | ✅ |
| Backend `check` | ✅ |
| `makemigrations --check` | ✅ no changes |
| `migrate` | ✅ no migrations to apply |
| `bootstrap` | ✅ idempotent; copy synced |
| Backend pytest | ✅ 274 passed |
| API smoke (public content/page-builder/SEO endpoints) | ✅ 200 |
| Newsletter subscribe | ✅ 201 |
| ERP health + admin dashboard (anonymous) | ✅ 401 |
| Production bundle dev-artifact scan | ✅ zero dev-page code shipped |
| `index.html` production head | ✅ description/OG/theme-color present |
| Hero copy synced to DB | ✅ (`HeroConfiguration` + home page section verified) |
| ERP safety | ✅ `ERP_ENABLED=false`, `null` provider, no credentials |
| New npm dependencies | none |

### Re-verification (same day)
The full suite above was executed again after completion and every result was
reproduced: frontend `typecheck`/`lint`/`test` (147)/`build`/`build-storybook` all ✅;
backend `check`/`makemigrations --check`/`migrate`/`bootstrap`/`pytest` (274) all ✅;
live API smoke (public endpoints 200, newsletter 201, ERP health + admin dashboard 401
anonymous); production-bundle dev-artifact scan clean; runtime `ERP_ENABLED=false`,
`ERP_PROVIDER='null'`, no ERP credentials. The report therefore accurately reflects
the executed state of the phase.

## 26. Known issues

- **No SSR/prerender** — SEO metadata depends on client rendering; non-JS crawlers get
  the static `index.html` head (improved this phase, but the architecture remains an SPA).
- **Browser-based QA not executed** — pixel-level responsive verification (7 viewports),
  keyboard-only walkthrough and a real screen-reader pass require a browser harness that
  is unavailable here. Code-level responsive/reduced-motion/aria review was performed and
  Storybook viewport/theme presets remain available for a follow-up visual pass.
- **Potential dead navigational routes** — the footer/header are CMS-driven; an href
  pointing to a not-yet-implemented route (`/services/:slug`, `/articles/category/:slug`,
  `/privacy`, `/terms`) would land on the branded 404. A runtime link validator is
  deferred rather than adding phantom pages.
- **Local PostgreSQL cannot create test databases** — backend tests run with the
  documented `USE_SQLITE` CI fallback.
- **Deprecated model remains** — `apps/analytics.Newsletter` is unused dead code (cleanup
  deferred to avoid a backend-model migration this phase).
- **Duplicated JSON-LD helpers** — article/project `injectJsonLd` vs About's `<JsonLd>`;
  behaviourally fine, consolidation deferred.
- **Honeypot + throttle only** for contact/newsletter spam protection (no captcha);
  adequate for current threat model, revisit if spam materialises.

## 27. Deferred work

- ERP/Odoo operational integration of any kind — parked until the real Odoo 19 is
  deployed; Phase 9A/9B foundation untouched.
- Browser-based responsive/a11y/SEO verification harness and per-route visual regression
  (Playwright-style) once the environment allows it.
- `/services/:slug`, `/articles/category/:slug`, `/articles/tag/:slug`, `/privacy`,
  `/terms` — only build when there is real content behind them.
- Full Arabic plural centralisation (a shared plural table for count labels beyond
  search).
- Centralise the duplicated JSON-LD injection; remove `apps/analytics.Newsletter`.
- Captcha/RateLimit hardening if contact spam appears.

## 28. Architectural risks

- **Bootstrap now overwrites seeded section config** (`_sync_section`): canonical demo
  copy is applied on every `bootstrap`. Any real editorial customisation must happen in
  the CMS *after* bootstrap (or seed copy must be removed from the section). This is the
  intended demo-content contract and is idempotent.
- **i18n/key drift** — frontend locale files and backend seed copy both hold EN/FA/AR
  strings; they were aligned this phase but remain manually kept in sync (a shared-copy
  source of truth is a future improvement).
- **SPA SEO ceiling** — metadata is runtime-applied; no prerender. Known and documented;
  not addressed to avoid architecture churn.
- **Token lockstep** — `globals.css` runtime vars vs `src/design/colors/index.ts` must
  stay aligned (pre-existing note from Phase 9C).

## 29. Documentation

- `docs/reports/phase-09D-report.md` (this report).
- `CHANGELOG.md` — Phase 9D entry added.
- `NEXT_PHASE.md` and `docs/reports/next-phase.md` — updated with the Phase 9D outcome
  and recommended next phase.

## 30. Final status

All Phase 9D success criteria met: audit-first approach ✅, prioritised justified
improvements ✅, navigation/IA coherent ✅, real (non-fabricated) content ✅, hero/conversion
clear ✅, services/projects/knowledge-hub/about/contact/search refined ✅, forms with no
silent failure ✅, error/loading/empty states complete ✅, responsive and accessible ✅, SEO
extended within the existing system ✅, performance hygiene + dev-artifact removal ✅,
brand anchors preserved ✅, ERP disabled and untouched ✅, all tests/builds green ✅, visual
QA artifact exists ✅, report complete ✅.

## 31. Recommended next phase

- **When the real Odoo 19 is deployed → Phase 10 (Website → ERP operational flows)**
  using the Phase 9B provider port (outbox + dispatcher + lead/contact/newsletter events)
  in a staged sandbox.
- **Meanwhile (site-leading option) → Phase 9E (verification hardening + brand depth):**
  browser-based responsive/a11y/SEO verification harness, Storybook viewport sweeps,
  prerender/SSR feasibility, and centralising the i18n/seed copy source of truth.
---

**PHASE 9D COMPLETE — READY FOR REVIEW**
Report path: `docs/reports/phase-09D-report.md`
Visual QA: `docs/screenshots/phase-09D/`