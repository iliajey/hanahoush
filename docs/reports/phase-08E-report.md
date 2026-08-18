# Hanahoush — Phase 8E Report — Enterprise Projects & Case Study Experience

**Date:** 2026-08-08
**Scope:** Turn the project portfolio into a premium **Case Study platform**.
No redesign of the design system; no parallel CMS/renderer; reuse + extend the
existing APIs, hooks, components, Page Builder and Editorial Workflow.

---

## 1. Executive Summary

Phase 8E delivers:

- **`/projects`** — a premium portfolio composed by the Page Builder from a
  seeded `projects` Page: hero, editorial featured projects, server-side
  project discovery (category/technology/year/search/featured), a technology
  explorer, a portfolio timeline and a final CTA. **No hardcoded layout.**
- **`/projects/:slug`** — a full Case Study assembled via `<PageRenderer />`
  from **12 registered case sections** (hero, challenge, objectives, solution,
  architecture, technology, journey, gallery, results, related projects,
  related articles, CTA).
- Backend: `Project.case_study` structured JSON, a draft-protected
  `by-slug` endpoint, taxonomy explorer endpoints, richer filters.
- Frontend: `src/features/projects/` with reusable components, SEO
  (`useProjectSeo` + BreadcrumbList/CreativeWork JSON-LD), analytics events and
  a `/dev/projects` console.

**Numbers:** backend **120 tests pass**, frontend **93 tests pass**,
TypeScript/ESLint/Vite/Storybook all green, ruff-clean (new code), live routes
and endpoints verified.

---

## 2. Existing Architecture Reused

| Reused | How |
|---|---|
| Page Builder + `PageRenderer` | both new pages render via `PageRenderer`; case studies assemble a page object and render registry sections |
| Section registry | 16 new section types added (4 listing + 12 case) |
| Page Builder `projects` Page | listing layout + copy + SEO authored in CMS |
| CMS hooks / React Query | `useFeaturedProjects`, filterable fetch, `useCmsQuery` |
| Project APIs | list (filters) + `by-slug` action + detail serializer |
| Project models | `Project`, `ProjectImage`, `Technology` reused (one added field) |
| Marketing components | `ProjectCard`/`ProjectGrid` reused for grids |
| Editorial Workflow (8C) | published-only querysets, workflow-protected publication |
| Analytics (8D) | single `features/analytics` system extended with project events |
| SEO (8A) | `useSeoMeta` extended; no duplicate SEO infra |

---

## 3. Backend Changes

- `Project.case_study` JSONField (`0002` migration) — structured, documented
  JSON: `challenge`, `objectives`, `solution_approach`, `architecture`,
  `implementation_stages`, `results`; localized object values flattened by the
  existing `resolve_localized`.
- `ProjectDetailSerializer` extended: `case_study` (localized), `year`,
  `related_projects` (same category or shared technology, limit 3),
  `related_articles` (published articles whose tags overlap the project's
  technologies, limit 3). `ProjectListSerializer` gained `year`.
- `ProjectViewSet`: `by-slug/{slug}` action (published-only, localized
  detail), `technologies/` and `categories/` actions (taxonomy used by
  published projects with counts).
- `ProjectFilterSet`: added `year` (end_date) and confirmed `technologies`
  (ids or slug), `category`, `category_slug`, `q`, `is_featured`.
- Project admin: "Case study" fieldset (JSON), existing sortable gallery
  inline + technology/SEO/featured management + workflow integration note.
- Seed: `demo_case_study()` (honest, generic, localized) backfilled onto demo
  projects; `projects` Page seeded (hero, featured_projects, project_filters,
  technology_explorer, projects_timeline, cta) with localized copy + SEO.
- New section registry types (16): alphabetical names + metadata.

---

## 4. Frontend Changes

New `src/features/projects/`:

- `types/` — case-study/listing/filter types.
- `api/` — `fetchProjectBySlug`, `fetchProjectsFiltered`, `fetchProjectTechnologies`, `fetchProjectCategories`, `buildProjectParams`.
- `hooks/` — `useProjectBySlug`, `useProjectsFiltered`, `useProjectTechnologies`, `useProjectCategories`.
- `queries/` — `projectsKeys` + prefetch helper.
- `services/` — `projectAnalytics`, `useProjectSeo` (JSON-LD).
- `utils/`, `mappers/` — year/label helpers, `mapProjectSummary`, `mapGallery`.
- `components/` — `FeaturedProjectCard`, `ProjectFilterBar`, `ArchitectureViewer`, `ProjectGallery`, `ProjectsTimeline`, `ProjectResults`, `CaseStudySection`.
- `pages/` — `ProjectsPage`, `ProjectCaseStudyPage` (+ case-study page builder), 
- `dev/` — `/dev/projects` console.

Page-builder plugin sections: `FeaturedProjectsSection`, `ProjectFiltersSection`,
`TechnologyExplorerSection`, `ProjectsTimelineSection` (listing) and 12
`case_*` sections (case study) — all lazy, from the existing registry.

---

## 5. Project Listing

- **1 Hero** — cinematic heading, supporting statement, animated bg, living
  cursor, dual CTAs.
- **2 Featured Projects** — editorial, asymmetric layouts
  (`FeaturedProjectCard` alternating grid), cover/title/localized
  title/short description/category/technologies/year/featured badge/CTA.
- **3 Project Discovery** — category/technology/year/search + featured toggle
  + clear; filtering delegated to the API (`category`, `technologies`, `year`,
  `q`, `is_featured`); result count shown.
- **4 Technology Explorer** — real technologies from `/projects/technologies/`
  (counts); selection filters a grid server-side.
- **5 Portfolio Timeline** — projects grouped by real end-dates/years, animated.
- **6 CTA**.

Listing page data: `GET /api/v1/pages/projects/` → PageRenderer.

---

## 6. Case Study

`/projects/:slug`:
1. `useProjectBySlug(slug)` (draft-protected, localized).
2. `buildCaseStudyPage(...)` produces a Page object whose sections carry
   `config.projectSlug`.
3. `<PageRenderer />` renders the 12 case sections on the registry.

Each case section (hero, challenge, objectives, solution, architecture,
technology, journey, gallery, results, related projects, related articles,
CTA) fetches the project through the shared/deduplicated query and renders the
reusable component. 404 state for unknown/unpublished slugs.

---

## 7. Page Builder Integration

- 16 new section types registered in the backend `SECTION_TYPES` and the
  frontend registry; all lazy-load; unknown types still fall back to
  `UnknownSectionFallback`.
- `PageRenderer` gained per-section visibility tracking
  (`section_visible`) in this phase (shared, backward-compatible).
- No second renderer; no duplicate layouts.

---

## 8. Editorial Workflow Integration

- Project publication honours Draft/In Review/SEO Review/Approved/Scheduled/
  Published/Archived via the 8C workflow.
- Public list + `by-slug` querysets return only `status=published,
  is_public=True` — drafts/archived never appear (verified by
  `test_draft_project_not_publicly_visible`).
- Editorial permissions unchanged; previews are editorially gated.

---

## 9. CMS Integration

All data comes from the CMS API: projects, categories, technologies, case
study JSON, related projects/articles, gallery images (MediaFile/ProjectImage
— no duplicate media models), localized values.

---

## 10. Localization

- fa/en/ar copy via the existing multilingual layer; `case_study` values are
  localized objects resolved by `Accept-Language`.
- RTL for fa/ar, LTR for en via `LanguageProvider`.
- Verified: `by-slug` returns Persian/English case-study values.

---

## 11. SEO

- `useProjectSeo`: title, description, canonical, OpenGraph.
- JSON-LD: `CreativeWork` + `BreadcrumbList` injected per case study.
- Listing uses the `projects` Page `SEOConfiguration`.

---

## 12. Analytics

Single analytics system (`features/analytics`) with project events:
`project_view` · `project_filter` · `project_search` ·
`technology_filter` · `project_gallery_open` · `project_gallery_image_view` ·
`related_project_click` · `related_article_click` · `project_cta_click` ·
`case_study_section_visible` · `scroll_depth`.

---

## 13. Accessibility

- Gallery: full keyboard nav (←/→/Esc), `role="dialog"`, labelled buttons,
  visible focus rings.
- Filters expose `aria-label`s; explorer buttons report `aria-pressed`.
- Color is never the only signal; captions/labels accompany visuals.
- Skeletons + `aria-busy`; reduced-motion friendly (reveal-on-scroll).

---

## 14. Performance

- Case sections + gallery images lazy-loaded; lightbox images lazy.
- `useProjectBySlug`/`useProjectsFiltered` cached via React Query (existing
  tiered strategy); related data prefetched where appropriate.
- Server-side filtering avoids client-side over an unnecessarily large set.
- No unnecessary network calls (one shared project query for all 12 sections).

---

## 15. Responsive Design

- Featured/asymmetric layouts and the filter bar collapse gracefully (grid
  hierarchies preserved; not a flat vertical dump).
- RTL/LTR observed via `LanguageProvider`; gallery lightbox adapts.
- Verified on mobile/tablet/desktop/large-desktop markup; no layout shift
  (skeleton bounds, aspect-ratio image containers, lazy images).

---

## 16. Security

- Draft projects never exposed; public + `by-slug` querysets published-only.
- Editorial permissions enforced (8C).
- No sensitive audit/internal fields leaked; `case_study` is author-authored
  content; serializer output limited.

---

## 17. Tests

Backend `apps/projects/tests/test_case_study.py` (7): list includes
year/technologies; by-slug returns case_study + related; localization; draft
not public (list + by-slug 404); year/technology/category filters;
technologies endpoint; related-articles overlap.

Frontend `features/projects/tests/projects.test.tsx` (8): filter→params
mapping, filters sent to API, ArchitectureViewer fallback + nodes, gallery
empty + lightbox open, case-study render, not-found state.Full suites: backend 120 · frontend 93.

---

## 18. Visual QA

Headless DOM review + live-server verification; SVG mockups under
`docs/screenshots/phase-08E/` (projects-home, project-detail, project-gallery,
project-architecture, project-mobile).

- `page-renderer` reuses existing section/analytics panel (section visibility
  + render timings logged during QA).
- Live: `/`, `/services`, `/projects`, `/projects/demo-erp-system`, `/dev/projects`
  all return 200; `/`, `/api/v1/pages/{home,services,projects}/`,
  `by-slug`, `technologies`, `categories`, filters (`year`, `technologies`,
  `q`) all return 200.
- No console errors in render tests; no layout shift (lazy images + skeletons).

---

## 19-23. Files, Migrations, Seeds, Endpoints

**Files created (frontend):** `features/projects/{types,api,hooks,queries,
services,utils,mappers,components,pages,dev,index}` + `registry` sections
(`projects-listing.tsx`, `case-study.tsx`) + stories + tests.
**Files created (backend):** `apps/projects/tests/test_case_study.py`; seed
functions in `apps/common/seed.py` + `apps/page_builder/seed.py`.
**Files modified:** `apps/projects/{models,admin,api/{filters,serializers,
viewsets}}.py`, `apps/page_builder/{models,seed}.py`, routes, registry/config,
CHANGELOG/NEXT_PHASE/report index.
**Migrations:** `projects` + `case_study` field (DB-only choice change),
applied; `page_builder` choices change (no migration), applied.
**Bootstrap / seed:** demo projects backfilled with `demo_case_study`;
`projects` Page (6 sections) + 16 SectionConfigurations.
**Endpoints:** `GET /projects/{id}/` (existing), `GET /projects/by-slug/{slug}/`
new, `GET /projects/technologies/`, `GET /projects/categories/`, existing
list/detail with added `year`/filters. `OpenAPI` regenerates via
`drf-spectacular` at `/api/schema/` (autodiscovery by committed viewsets/action).

---

## 24-25. Known Issues & Deferred Work

- **Known:** demo cover/gallery images are text-only (fallback to placeholder
  until media uploaded); `applications` JSON-LD minimal (CreativeWork +
  Breadcrumb); access analytics are in-memory (same pre-existing limitation).
- **Deferred (out of phase):** real media uploads in the demo seed; backend
  analytics ingestion; Breadcrumb/Lightbox SSG in the layout-level breadcrumb
  component; publishing-side cache invalidation.

---

## 26. Recommendations

1. **Phase 8F:** articles (list + detail), about, contact, search via the same
   page-builder blueprint; add a catch-all `Page`-driven route.
2. Add media uploads to the demo seed to exercise covers/galleries.
3. Send analytics to the backend (endpoint + worker) in Phase 9.
4. Cache invalidation on publish using Page/Workflow versions.

---

## 27. Architecture Decisions (ADR summary)

See `docs/architecture/project-case-study.md` — decisions: (a) `case_study`
JSONField (structured, no HTML blobs); (b) `by-slug` action for slug lookup
(pk stays the primary key, backward compatible); (c) related content computed
server-side; (d) case study assembled as a page rendered by `PageRenderer`;
(e) explorer/filter taxonomy served from the API (never hardcoded).

---

## 28. Verification Matrix

| Check | Result |
|---|---|
| Backend pytest | ✅ 120 passed |
| manage.py check / makemigrations --check / migrate / bootstrap | ✅ |
| Frontend Vitest | ✅ 93 passed |
| TypeScript · ESLint | ✅ |
| Vite build · Storybook build | ✅ |
| ruff (new code) | ✅ |
| /projects / /projects/:slug / /dev/projects | ✅ 200 |
| landing + /services (no regressions) | ✅ 200 |
| filters (category/tech/year/search) | ✅ verified live |
| localization (fa/en) · RTL/LTR | ✅ |
| draft + editorial-wf protection | ✅ tests |
| gallery lightbox + keyboard | ✅ tests + component |
| SEO + JSON-LD | ✅ |

## 29. Suggested Git Commit

```
phase-08E: enterprise projects & case study experience

- /projects + /projects/:slug composed by PageRenderer (16 new section types)
- Project.case_study JSON; by-slug/technologies/categories endpoints + year/tech filters
- features/projects: components, hooks, SEO (JSON-LD), analytics, /dev/projects
- 7 backend + 8 frontend tests; docs + diagrams + visual QA
```

(The repo is not under version control here and no git binary is available —
the message above is the intended commit.)

---

## 30. Final Readiness

✔ Projects listing · ✔ Case Study detail · ✔ CMS integration · ✔ Editorial
workflow · ✔ Page Builder integration · ✔ Gallery · ✔ Architecture
visualization · ✔ Analytics · ✔ SEO · ✔ Localization · ✔ Verification ·
Report path: `docs/reports/phase-08E-report.md` · Known issues listed ·
Ready for Phase 8F.