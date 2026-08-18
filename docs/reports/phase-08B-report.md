# Hanahoush — Phase 8B Report — Dynamic Page Composition Engine

**Date:** 2026-08-06
**Scope:** Infrastructure that assembles every public page dynamically from configurable sections — no hardcoded page layouts.

---

## Executive Summary

Phase 8B replaces hardcoded page layouts with an **Enterprise Dynamic Page
Composition Engine**. A new backend app (`apps/page_builder/`) owns 10 models
(Page, PageSection, SectionConfiguration, NavigationMenu, NavigationItem,
FooterConfiguration, AnnouncementBar, HeroConfiguration, SEOConfiguration,
RedirectRule), a premium drag-and-drop admin, and a full public API. On the
frontend, `src/features/page-builder/` provides a **lazy section registry**
(14 section components), a `<PageRenderer />` that composes a page from its
backend configuration, per-section error boundaries, unknown-section
fallbacks, render analytics and a `/dev/page-builder` console.

The landing page is now a single `Page` record (`/api/v1/pages/home/`) with 12
ordered sections — **no layout is hardcoded on the frontend**. All 20 public
endpoints, the admin screens, and the full toolchain were verified.

**Gates:** `manage.py check` ✅ · `makemigrations --check` ✅ · migrate ✅ ·
bootstrap ✅ · Backend pytest **96** ✅ · TypeScript ✅ · ESLint ✅ · Vitest **71**
✅ · Vite build ✅ · Storybook build ✅.

---

## Architecture

```
Django Admin (sortable inlines, live preview)
        │ save
        ▼
apps/page_builder/  ──GET /api/v1/*──▶  src/features/page-builder/
Page · PageSection · SectionConfiguration ·        │ registry (lazy)
NavigationMenu/Item · Footer · Announcement ·      │ renderer (PageRenderer)
Hero · SEO · RedirectRule · version stamp          │ hooks (usePage…)
        ▲                                          │ components (AnnouncementBar)
        └────────────  composed page JSON  ◀───────┘
```

- Backend composes the page: SEO + ordered, **enabled** sections with
  language-resolved config.
- Frontend renders it dynamically: `PageRenderer` → registry → lazy sections.

Full detail: `docs/architecture/page-builder.md` (+ diagrams
`docs/diagrams/page-builder-flow.svg`, `page-renderer.svg`,
`section-registry.svg`).

---

## Models (`apps/page_builder/models.py`)

| Model | Capabilities |
|---|---|
| `Page` | slug, fa/en/ar titles, draft/published/archived, `version` + `version_at`, `is_home`, `template`, `sort_order`, soft delete. `version` auto-increments on republish. |
| `PageSection` | `section_type`, `sort_order`, `is_enabled`, JSON `config`, `language_overrides`; **unique per `(page, section_type)`** (no duplicates). |
| `SectionConfiguration` | DB registry: type, name, description, icon, `default_config`, `available_locales`. |
| `NavigationMenu` / `NavigationItem` | ordered, sortable menu + items (parent dropdowns, enable, CTA highlight). |
| `FooterConfiguration` | singleton; localized copyright, social/newsletter toggles, JSON columns. |
| `AnnouncementBar` | singleton, time-boxed, dismissible. |
| `HeroConfiguration` | singleton default hero copy + visuals. |
| `SEOConfiguration` | per-page (OneToOne) or site-wide default; localized title/description, keywords, canonical, robots, OG image. |
| `RedirectRule` | ordered 301/302 rules. |

All inherit `BaseModel` (created_by/updated_by, `is_active`, soft-delete).

---

## Admin

- **Drag-and-drop ordering** — `adminsortable2.SortableInlineAdminMixin` on
  PageSection and NavigationItem inlines (verified: Page and NavigationMenu
  change forms render, `manage.py check` passes the SortableAdminBase
  assertion).
- **Inline editing** — sections/nav items edited directly on the parent form.
- **Enable/disable** — `is_enabled` toggle per section/item (list-editable on
  items).
- **Live preview URLs** — `preview_link` column opens `/pages/{slug}/` for
  published pages.
- **Validation** — `PageForm` requires the English title; `SectionInlineForm`
  rejects unknown `section_type`.
- **Singleton protection** — `SingletonAdminMixin` on FooterConfiguration,
  AnnouncementBar, HeroConfiguration; `is_home` / `is_default` enforced
  singleton in `save_model`.

---

## APIs

All reuse the standard envelope and honor `Accept-Language`; only
`status=published` pages are exposed (draft protection).

| Endpoint | Notes |
|---|---|
| `GET /api/v1/pages/` | published index (filter `is_home`/`template`, search, ordering, pagination) |
| `GET /api/v1/pages/{slug}/` | composed page: `seo` + ordered enabled sections + `version`/`version_at` |
| `GET /api/v1/page-builder/` | section registry + page index |
| `GET /api/v1/navigation/` | model-driven menu (shape-compatible with Phase 8A) |
| `GET /api/v1/footer/` | model-driven footer (shape-compatible) |
| `GET /api/v1/announcement/` | announcement bar |
| `GET /api/v1/seo/?slug=…` | per-page SEO or site default |
| `GET /api/v1/hero/` | default hero config |
| `GET /api/v1/redirects/` | redirect rules |

Localized section `config`: values may be `{"fa": …, "en": …, "ar": …}` and are
flattened by `resolve_section_config()`; `language_overrides` layer on top.

---

## Frontend Renderer (`src/features/page-builder/renderer`)

- **`<PageRenderer page={page} />`** — filters disabled sections, deduplicates
  types, orders by `sort_order`, then renders each section.
- **Lazy loading** — every section is `React.lazy`; `Suspense` shows
  `SectionSkeleton` while the chunk loads. Only rendered sections fetch code.
- **Per-section error boundary** — `SectionBoundary` contains crashes locally.
- **Unknown-section fallback** — `UnknownSectionFallback` (never crashes).
- **Analytics** — `recordSectionRender()` captures type, status
  (`loaded|error|fallback`) and timing; observable via
  `useSectionRenderRecords()`.

---

## Registry (`src/features/page-builder/registry`)

14 registered sections, all reusing Phase 8A hooks + marketing components:

| type | Component | | type | Component |
|---|---|---|---|---|
| hero | HeroSection | | timeline | TimelineSection |
| statistics | StatisticsSection | | partners | PartnersSection |
| services | ServicesSection | | testimonials | TestimonialsSection |
| erp | ERPSection | | faq | FAQSection |
| projects | ProjectsSection | | cta | CTASection |
| articles | ArticlesSection | | footer | FooterSection |
| about | AboutSection | | team | TeamSection |

`getSectionComponent(type)`, `isRegisteredSection(type)`,
`registeredSections()` power the renderer and the dev console. See
`docs/page-builder/section-registry.md`.

---

## Performance

- **Lazy code-splitting** per section (chunk only fetched when the section
  renders) — the production bundle stays lean.
- Live localhost request times (from `/dev/api`): typical CMS GET **28–61 ms**;
  composed page sweep returned all 20 endpoints at 200.
- React Query caching (tiered stale times from Phase 8A) + page-builder
  invalidation; `version`/`version_at` on pages enables future ETag/version
  cache-busting.
- Sections use `select_related`/prefetch patterns server-side.

---

## Accessibility

- Consistent loading (skeletons with `aria-busy`), empty and error states via
  `CmsAsync` / `SectionBoundary` (`role="alert"`).
- Unknown-section fallback uses `role="note"`; announcement bar is a
  `role="region"` with `aria-label` and a dismiss button (`aria-label`).
- Responsive layouts throughout (existing grid components collapse cleanly on
  small screens).
- Images lazy + alt text + SVG fallback (Phase 8A `ResponsiveImage`).

---

## Visual QA

> Headless DOM-level review (jsdom render tests) + live-server checks; a real
> browser is not available in this environment. Mockup:
> `docs/screenshots/phase-08B/page-builder-console.svg`.

**Automated checks** (`src/features/page-builder/tests/` + homepage visual):
- **Every section renders** — PageRenderer composes sections and the live
  `/pages/home/` returns 12/12 enabled sections in order (verified via API).
- **No duplicated sections** — renderer collapses duplicate `services` (test)
  and the DB enforces `(page, section_type)` uniqueness.
- **Disabled sections skipped** — disabled `cta` not rendered (test).
- **Unknown section fallback** — `mystery` type renders the fallback (test).
- **Lazy loading** — analytics records per-section load timing; dev console
  lists `loaded/fallback/error` per section.
- **Language switching** — `/pages/home/` verified in `fa` and `ar` (localized
  title + hero headline).
- **Cache invalidation** — `invalidatePageBuilderCache` + locale-scoped keys.
- **No console errors** — render tests complete without thrown errors.
- **Responsive layouts** — section components reuse the responsive marketing
  grids.
- Home page visual test: composes from `/pages/home/`, shows skeleton during
  load, error state when the API fails, and asserts no legacy mock strings.

**Live verification:**
- 20-endpoint live sweep → all 200 (pages, page-builder, navigation, footer,
  announcement, seo, hero, redirects + CMS endpoints consumed by sections).
- Django admin: all 10 page-builder screens returned 200 after superadmin
  login (including Page change form with sortable inline).
- Vite dev server serves `/dev/page-builder` and all page-builder modules
  without transform errors.

---

## Verification

| Check | Result |
|---|---|
| `manage.py check` | ✅ 0 issues |
| `makemigrations --check` | ✅ no changes |
| `migrate` | ✅ page_builder.0001 applied |
| `bootstrap` | ✅ page-builder data seeded + idempotent |
| `pytest` | ✅ **96 passed** (84 baseline + 12 page-builder) |
| `ruff` (new code) | ✅ all checks passed |
| `tsc --noEmit` | ✅ |
| `eslint .` | ✅ |
| `vitest run` | ✅ **71 passed** (61 baseline + 12 page-builder − 2 superseded) |
| `vite build` | ✅ |
| `build-storybook` | ✅ (5 new PageBuilder stories) |

---

## Known Issues

1. **Redirect middleware** — `RedirectRule` rows are modeled and exposed via
   `/api/v1/redirects/`, but HTTP-level redirect handling is not yet wired
   (Phase 8C/9 candidate).
2. **Demo media** — home content is text-only; covers/logos fall back to SVG
   placeholders until real media is uploaded via the admin.
3. **Write path** — content is authored in the Django admin; no in-app page
   editor yet (recommended next).
4. **Storybook data** — PageRenderer/AnnouncementBar stories show error/empty
   states when the API is unreachable (no MSW mocks in SB); they render live
   data when the backend runs (CORS now allows :6006).
5. **Old company navigation tests** removed — the navigation/footer surfaces
   moved to `page_builder` (covered by the new page-builder tests).

---

## Recommendations

1. **Phase 8C:** build business pages as `Page` records (services, projects,
   articles, about, contact, search) — each route renders
   `<PageRenderer page={page} />` from `usePage(slug)`; add a catch-all
   page-driven route.
2. Wire `RedirectRule` into a small Django middleware (or edge) for 301/302s.
3. Add an in-app page editor that authors `PageSection.config` using the
   section registry metadata (no raw JSON).
4. Use `Page.version`/`version_at` for ETag/If-None-Match on `pages/{slug}/`.
5. Upload real media to exercise the responsive-image path.

---

## Suggested Git Commit

```
phase-08B: enterprise dynamic page composition engine

- Add apps/page_builder (10 models, premium admin, versioning, soft delete)
- Add page-builder APIs: pages, page-builder, navigation, footer,
  announcement, seo, hero, redirects (localized + draft-protected)
- Add src/features/page-builder (registry, PageRenderer, lazy sections,
  per-section error boundaries, analytics, dev console, stories)
- Compose the landing page from /api/v1/pages/home/ (no hardcoded layout)
- Bootstrap seeds section registry + home page; 12 backend + 12 frontend tests
- Docs: architecture/page-builder, usage, section-registry + 3 diagrams
```

The repository is not under version control in this environment and no `git`
binary is available, so no commit was created — the message above is the
intended commit.

---

## Phase 8B completion checklist

- ✔ Models created (10)
- ✔ APIs created (9 endpoints)
- ✔ Renderer completed (`<PageRenderer />` + boundary + fallback + analytics)
- ✔ Registry completed (14 sections, lazy)
- ✔ Verification (backend 96 · frontend 71 · builds · live sweep · admin)
- ✔ Report path: `docs/reports/phase-08B-report.md`
- ✔ Ready for Phase 8C
