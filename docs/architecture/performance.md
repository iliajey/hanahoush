# Performance Architecture (Phase 8H)

## Frontend

### Route-level code splitting (new in 8H)

The SPA previously lazy-loaded only page-builder sections. Phase 8H extends code splitting to
every route (`src/app/routes/index.tsx`): pages are dynamically imported via `lazy()`, with a
`<Suspense>` boundary around `<Outlet/>` in `AppLayout` (non-jumping `Loading` fallback).

Verified in the production build — `dist/` now contains per-route chunks (e.g. `HomePage`,
`SearchPage`) alongside the existing vendor chunks:

- `react` (react/react-dom/router) ~207 kB / 68 kB gzip
- `motion` (framer-motion + gsap) ~114 kB / 38 kB gzip
- `query` (React Query) ~42 kB / 13 kB gzip
- app shell `index` ~331 kB / 111 kB gzip

### Images

- `ResponsiveImage` and shared media rendering use `loading="lazy" decoding="async"`.
- **Deferred**: true responsive `srcset`/`sizes` from server-side variants + CDN. Media is
  currently served as single files (`MediaFile.file`), so adding variants is a Phase 9 item.

### Motion / visual quality

Visual effects (framer-motion/GSAP, particles, cursor) are **not** removed. They are already
guarded by `prefers-reduced-motion`, coarse-pointer and hardware-concurrency checks in
`design/`. This stance is intentional — the premium experience is a product requirement.

### React Query

Tiered stale times retained: `site` 30 m, `content` 5 m, `listings` 2 m; `gcTime` 10 m; retry 2
with exponential backoff; `refetchOnWindowFocus` off. Search reuses the same policy. Prefetch
helpers (`prefetchHomeContent`, `prefetchArticle`, `prefetchProjectCaseStudy`) exist but are not
yet wired to route loaders (deferred — loaders would need server data expectations).

## Backend

- **Search**: `select_related` on cover image/category; a test guards the query count (≤ 10 for a
  4-type search). No N+1.
- **Dashboard**: aggregation queries only; full payload cached 60 s (LocMemCache).
- **Sitemap**: built once per 5 min and cached; invalidated by signals on Article/Project/Service/
  Page save/delete.
- **Admin/editorial querysets**: audited — already use `select_related`/`prefetch_related`
  (Article, Project, PageView, Visitor, ContactRequest, AnalyticsEvent, ProjectImage).
- **Pagination**: `DefaultPagination` (page_size ≤ 100) on all list endpoints.

## What we deliberately did NOT do

- No premature Redis/Celery. LocMem cache is fine for single-node; swapping the `CACHES` backend
  to Redis is a settings change when multi-worker is needed.
- No DB-side full-text search yet (see `search.md`).
- No removal of visual effects to chase scores.
