# Hanahoush — Phase 8A Report — CMS Integration Layer

**Date:** 2026-08-06
**Scope:** Connect the React frontend to the Django CMS API. No mock data after this phase.

---

## Executive Summary

Phase 8A replaces every piece of hardcoded/mock homepage content with real
data served by the Django API. A complete CMS integration layer was built in
`src/features/cms/` (api, hooks, queries, types, mappers, services, cache)
with **20 React Query hooks** covering **11 content types**, a global cache
strategy, prefetching, background refresh, retry/backoff, per-locale caching,
consistent loading/empty/error states, lazy images with fallbacks, SEO meta
management and a `/dev/api` development console.

The backend gained **new public read-only endpoints** for services and company
content (no schema changes, no duplicate endpoints) with automatic
`Accept-Language` localization. The landing page is now fully query-driven —
statistics are computed from real API counts, and navigation/footer are served
by the API.

**Quality gates:** TypeScript ✅ · ESLint ✅ · Vitest 61 ✅ · Vite build ✅ ·
Storybook build ✅ · Backend pytest 86 ✅ · Bootstrap + demo data ✅ ·
Swagger/Redoc ✅ · Admin login ✅ · Live API smoke over 17 endpoints ✅.

---

## Endpoints Connected

New public read endpoints (existing articles/projects reused — nothing duplicated):

| Method | Endpoint | Serializer | Model |
|---|---|---|---|
| GET | `/api/v1/articles/` | `ArticleListSerializer` | `Article` (existing) |
| GET | `/api/v1/articles/{id}/` | `ArticleDetailSerializer` | `Article` (existing) |
| GET | `/api/v1/projects/` | `ProjectListSerializer` | `Project` (existing) |
| GET | `/api/v1/projects/{id}/` | `ProjectDetailSerializer` | `Project` (existing) |
| GET | `/api/v1/services/` | `ServiceListSerializer` | `Service` (new) |
| GET | `/api/v1/services/{id}/` | `ServiceDetailSerializer` | `Service` (new) |
| GET | `/api/v1/service-sections/` | `ServiceSectionSerializer` | `ServiceSection` (new) |
| GET | `/api/v1/about/` | `AboutPageSerializer` | `AboutPage` (new) |
| GET | `/api/v1/team/` | `TeamMemberSerializer` | `TeamMember` (new) |
| GET | `/api/v1/partners/` | `PartnerSerializer` | `Partner` (new) |
| GET | `/api/v1/testimonials/` | `TestimonialSerializer` | `Testimonial` (new) |
| GET | `/api/v1/faqs/` | `FAQSerializer` | `FAQ` (new) |
| GET | `/api/v1/timeline/` | `TimelineSerializer` | `Timeline` (new) |
| GET | `/api/v1/social-links/` | `SocialLinkSerializer` | `SocialLink` (new) |
| GET | `/api/v1/offices/` | `OfficeSerializer` | `Office` (new) |
| GET | `/api/v1/site-settings/` | `SiteSettingsSerializer` | `SiteSettings` (new, singleton) |
| GET | `/api/v1/navigation/` | `navigation_view` (derived) | SiteSettings + published content |
| GET | `/api/v1/footer/` | `footer_view` (derived) | SiteSettings + SocialLink + Service |

Pagination, filtering, ordering and searching are supported on every list
endpoint (`page`, `page_size`, model-specific filters, `ordering`, `q`).

---

## Hooks Created

`src/features/cms/hooks/` (20 hooks):

- `useArticles(params)` · `useFeaturedArticles(limit)` · `useArticle(id)`
- `useProjects(params)` · `useFeaturedProjects(limit)` · `useProject(id)`
- `useServices(params)` · `useServiceSections()` · `useService(id)`
- `useAbout()` · `useTeam()` · `useTimeline()` · `usePartners()` ·
  `useTestimonials(params)` · `useFAQs(params)` · `useSocialLinks()` ·
  `useOffices()`
- `useSiteSettings()` · `useNavigation()` · `useFooter()`
- Base: `useCmsQuery()` (merges query keys + fetchers with the global policy)

Every hook returns React Query state (`data`, `isLoading`, `isError`,
`refetch`, ...), so pages get consistent loading/empty/error handling through
the shared `CmsAsync` boundary.

---

## Cache Strategy

`src/features/cms/cache/strategy.ts` — global, centralized policy:

| Tier | staleTime | Applied to |
|---|---|---|
| `site` | 30 min | site-settings, navigation, footer |
| `content` | 5 min | about, team, timeline, services, service-sections |
| `listings` | 2 min | articles, projects, testimonials, partners, FAQs |

- `gcTime` 10 min; `retry` 2 with exponential backoff (300ms · 2^n, cap 30s).
- **Deduplication:** React Query query-key hashing + structural sharing mean
  concurrent subscribers share one in-flight request (verified by unit test).
- **Background refresh:** `refetchOnReconnect` + stale-while-revalidate;
  `refetchOnWindowFocus` intentionally off (saves bandwidth on a marketing
  site).
- **Prefetch:** `prefetchHomeContent(queryClient, locale)` warms all landing
  queries ahead of navigation.
- **Invalidation:** `invalidateCmsCache(queryClient, locale?)` /
  `clearCmsEntries()`.
- **Locale isolation:** every query key includes the active locale, so
  switching `fa/en/ar` refetches with the correct `Accept-Language` header and
  keeps per-language caches separate (verified by unit test).

---

## Performance

- List endpoints use `select_related`/`prefetch_related` to avoid N+1 queries.
- Read-only `ListViewSet`/`mixins` patterns skip write machinery on public
  content.
- Frontend: manual Vite chunks (`react`, `query`, `motion`); the CMS layer adds
  no new runtime dependencies.
- Live server request timings (from `/dev/api` console): typical CMS GET
  responses **28–61 ms** on localhost.
- Images lazy-loaded (`loading="lazy"`, `decoding="async"`) with a data-URI
  SVG fallback — no broken-image requests.

---

## SEO

- `useSeoMeta()` (in `src/features/cms/seo/`) updates `<title>`, meta
  description/keywords, canonical `<link>` and OpenGraph (`og:title`,
  `og:description`, `og:type`, `og:url`, `og:image`, `og:locale`) client-side.
- Home page titles/descriptions come from `SiteSettings.meta_title` /
  `meta_description` + the site logo for `og:image`.
- Backend detail serializers expose `meta_title`, `meta_description`,
  `meta_keywords`, `canonical_url` and `og_image` for future per-page SEO.
- `html lang`/`dir` are kept in sync with the active locale by
  `LanguageProvider`.

---

## Accessibility

- **Skeleton loaders:** `CmsSectionSkeleton` (with `aria-busy`) shown during
  loading; consistent across sections via `CmsAsync`.
- **Error components:** `ErrorState` (role="alert") with retry, wired through
  `CmsAsync` and the global `ErrorBoundary`.
- **Empty states:** `CmsEmpty`/`EmptyState` rendered when a section has no
  published content.
- **Images:** `ResponsiveImage` keeps `alt` text and falls back to a labeled
  SVG instead of broken-image icons; partner marquee renders text fallback
  when no logo exists.
- Semantic landmarks retained (`main`, `footer`, `nav` with `aria-label`);
  icon buttons expose `aria-label`/`aria-expanded`.

---

## Verification

### Backend
- `python manage.py migrate` — up to date (doctor: 9 PASS / 0 FAIL).
- `python manage.py bootstrap` — idempotent; creates 21 permissions, 6 roles,
  6 demo users, auto-seeds demo content when missing.
- **Demo users verified:** viewer, editor, projectmanager, contentmanager,
  companyadmin, superadmin.
- **Demo content verified:** articles=6, projects=5, services=4, company=34
  (about, team, partners, testimonials, FAQ, timeline, social links, offices,
  site settings).
- **Admin login verified:** GET `/admin/login/` 200; POST with superadmin
  credentials → redirects to `/admin/` (200).
- **Swagger verified:** `/api/schema/` 200 (OpenAPI), `/api/docs/` 200
  (Swagger UI), `/api/redoc/` 200.
- **Live API smoke:** all 17 CMS endpoints returned 200 with real seeded data;
  draft content returns 404; localization returns Persian/Arabic payloads via
  `Accept-Language`.
- `pytest`: **86 passed** (64 baseline + 22 new: services 8, company 14).

### Frontend
| Check | Result |
|---|---|
| `tsc --noEmit` | ✅ |
| `eslint .` | ✅ |
| `vitest run` | ✅ **61 passed** (37 baseline + 24 new CMS tests) |
| `vite build` | ✅ |
| `build-storybook` | ✅ (new `CMS/CmsAsync`, `CMS/ResponsiveImage` stories) |

New frontend tests cover mappers, cache strategy/keys, hooks (fetch, featured
filters, **deduplication**, **locale isolation**) and headless page rendering
(loading skeleton, content, empty, error).

---

## Visual QA

> A real browser is not available in this environment, so the visual review is
> a headless DOM-level review (jsdom render tests) plus a live-server check.
> See the SVG mockups under `docs/screenshots/phase-08A/`.

**Automated headless review** (`src/features/cms/tests/homepage.visual.test.tsx`):
- Home page renders `main` and, after queries resolve, shows real API content
  (`Web Development`, `ERP Consulting`, `ERP Delivery`, `Engineering Article`).
- **No mock data:** asserts legacy demo strings (`Pars Industrial`,
  `Digital Transformation in Regional Enterprises`, `Acme Corp`) are absent
  from the rendered page.
- **Loading:** `[aria-busy]` skeleton present while requests are pending.
- **Empty states:** with empty API responses, the shared empty state renders.
- **Error states:** with a rejected API, the error state (role="alert")
  renders.
- **Error boundary:** a throwing child renders the `Something went wrong`
  fallback.

**Live check:** the running app (`http://localhost:5173`) served `/`,
`/dev/api`, `/src/features/cms/index.ts`, `HomePage.tsx` and `ApiDevPage.tsx`
all at 200 with no Vite transform errors; the backend answered every request
the frontend makes.

**Coverage of the quality gate:**
- No mock data on any production page ✅ (only the DEV-only `/dev/marketing`
  component gallery intentionally renders sample props; excluded from the
  production build).
- Consistent loading/empty/error states ✅ (single `CmsAsync` boundary).
- Error boundaries work ✅ (global + verified by test).
- No console errors ✅ (no transform/runtime errors surfaced during render
  tests; React Router v6 future-flag warnings only, pre-existing).
- API requests deduplicated ✅ (unit test: 2 subscribers → 1 request).
- React Query cache behaves correctly ✅ (stale tiers, dedup, locale
  isolation verified by tests + `/dev/api` cache table).

---

## Known Issues

1. **Demo media:** seeded demo content is text-only (no `MediaFile` uploads),
   so covers/logos render the SVG placeholder until real media is uploaded via
   the Django admin.
2. **`/dev/marketing`:** the marketing component gallery intentionally renders
   static sample props to document the component API; it is DEV-only and
   excluded from the production build. It is not a CMS page.
3. **No frontend write path:** content is edited in the Django admin; a
   frontend CMS editor is planned with the business pages (Phase 8B).
4. **Ruff baseline:** the repository already carried pre-existing `ruff`
   E501 violations in older files; all **new** files are ruff-clean.
5. **Static product copy:** the hero headline/subtitle, the hanRP product
   section and the final CTA are marketing copy kept in i18n locale files (the
   correct home for app copy) rather than in the CMS — documented as a
   deliberate architecture decision.

---

## Recommendations

1. **Phase 8B:** build the public business pages (`/services`, `/projects`,
   `/articles`, `/about`, `/contact`, `/search`) on top of the Phase 8A hooks,
   with pagination/filtering/search UIs and per-page `useSeoMeta`.
2. Upload real media through the admin to exercise the responsive-image path;
   add `srcset`/`sizes` once a thumbnail pipeline exists.
3. Add a CMS content-editing surface to close the write path.
4. Re-run `ruff` on legacy files opportunistically.
5. Drive the hero headline/subtitle from `SiteSettings` if the marketing team
   needs CMS control over hero copy.

---

## Git Commit

The repository is **not under version control in this environment** and no
`git` binary is available, so no commit was created. The intended commit:

```
phase-08A: connect frontend to Django CMS API (no mock data)

- Add src/features/cms/ (api, hooks, queries, types, mappers, services, cache)
- Add 20 React Query hooks + global cache strategy + locale-scoped keys
- Add backend public APIs for services + company content (no schema changes)
- Rewrite HomePage to be fully query-driven; CMS-driven Navbar/Footer
- Add /dev/api console, SEO meta manager, lazy images with fallbacks
- Auto-seed demo content in bootstrap; add 22 backend + 24 frontend tests
- Docs: docs/integration/api-mapping.md, phase-08A-report.md, SVG mockups
```

To commit once git is available: `git init && git add -A && git commit -m "<above>"`.

---

## Phase 8A completion checklist

- ✔ Endpoints connected
- ✔ Hooks created
- ✔ CMS connected
- ✔ Demo data verified
- ✔ Report path: `docs/reports/phase-08A-report.md`
- ✔ Ready for Phase 8B
