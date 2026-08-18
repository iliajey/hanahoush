# Phase 8H — Production Readiness, Global Search, Dashboard, Analytics Foundation & Admin Intelligence

**Status:** ✅ COMPLETE
**Date:** 2026-08-10
**Scope:** Global search · Admin intelligence dashboard · Persistent analytics foundation ·
Performance · SEO infrastructure (sitemap/robots) · HTTP/cache strategy · Security hardening ·
Health/observability · Error UX · Admin quality · Database indexes · Testing · Live verification · Docs

---

## 1. Executive summary

Phase 8H turns the Hanahoush website/CMS into a **production-grade platform** without restarting
the architecture: no Next.js, no Node backend, no second CMS, no second page builder, no second
analytics/SEO system, no duplicate API clients or models.

Delivered, on top of the existing Phase 8A–8G stack:

- **Unified site-wide search** — `GET /api/v1/search/` over published Articles/Projects/Services/
  Pages, relevance-ranked, locale-aware, paginated with the standard envelope and a new frontend
  `/search` experience (page + ⌘K command palette).
- **Persistent analytics foundation** — new `AnalyticsEvent` model + throttled ingestion
  `POST /api/v1/analytics/events/`; the existing in-memory `trackEvent` system now batches and
  persists events without changing its public behaviour.
- **Admin intelligence dashboard** — staff-only `GET /api/v1/admin/dashboard/` with content /
  editorial / engagement / operations / system sections, aggregated + cached.
- **SEO infrastructure** — real `/sitemap.xml` and `/robots.txt` generated from published content
  (with cache invalidation), `useSeoMeta` extended with hreflang alternates.
- **Performance** — route-level code splitting for the whole SPA, bounded search queries,
  prefetch/select_related auditing, sitemap caching.
- **Cache strategy** — explicit `CACHES`, `Cache-Control: no-store` on auth/admin API paths,
  CMS/page-builder cache invalidation wired into editorial publish/unpublish/archive/reopen/rollback.
- **Security hardening** — security headers middleware, write access on publishable content
  restricted to staff (was anonymous), event-metadata credential scrubbing, throttle for search,
  security findings documented by severity.
- **Health/observability** — `/api/health/` extended with version/timestamp/request_id and a
  staff-only migration check; structured logging reviewed.
- **Error UX** — polished route error fallback (404/500), existing 403/network/API/empty/loading
  states confirmed.

Backend test count: **167 → 212** pytest (45 new) and **124 → 160** `manage.py test`. Frontend
test count: **122 → 147** Vitest (25 new). Live HTTP smoke: **23/23 passed**.

## 2. Backend changes

- **New app `apps/search`** — unified global search API (service + serializer + view + URLs).
- **New app `apps/seo`** — `sitemap.xml` + `robots.txt` views, signal-based sitemap cache
  invalidation.
- **`apps/analytics`** — new `AnalyticsEvent` model (migration `0003_analyticsevent`), ingestion
  view, admin registration; `ContactAdmin` unchanged.
- **`apps/core`** — new `services/dashboard.py` (aggregations, caching) and `api/views.py`
  (`AdminDashboardView`); `admin_site.py` model order now includes `AnalyticsEvent`.
- **`config`** — health endpoint extended; `SecurityHeadersMiddleware`; settings additions
  (`ENVIRONMENT`, `APP_VERSION`, `SITE_URL`, `CACHES`, `SEARCH_MIN_QUERY_LENGTH`,
  `ANALYTICS_EVENT_ALLOWLIST`, throttle scopes `search`/`analytics`); `IsStaffOrReadOnly` and
  `IsStaffOrAdmin` permissions; publishable viewsets restricted to staff for writes; services
  viewset made explicitly read-only (`http_method_names`).
- **Admin quality** — `date_hierarchy` on `PageView`/`AnalyticsEvent` changelists (largest fact
  tables). Article/Project admins already had search/filters/select_related/autocomplete.

## 3. Search system

- **Backend**: `GET /api/v1/search/` (public, throttled `search` scope, default 60/min).
  Parameters `q` (min length 2), `type`, `locale`, `category` (slug), `ordering`
  (relevance | published_at | -published_at), `page`, `page_size`. Standard envelope + pagination.
- **Scope**: published + public Articles, Projects, Services, and Pages only — drafts, archived,
  scheduled and private content are never searched.
- **Relevance**: deterministic scoring — exact title > title prefix > substring > token-in-title >
  slug/prefix > excerpt token > body token, tie-broken by recency.
- **Locale awareness**: `locale` param or `Accept-Language`; localized `title`/`excerpt`
  resolved per request with `_en` fallback.
- **Portability decision**: PostgreSQL full-text/trigram was considered but rejected because the
  CI suite runs on SQLite (a Postgres-only backend would be untestable here) and trigram adds
  migrations + extensions for modest gain at current volumes. The ORM approach is token/prefix
  tolerant, locale aware and parameterized.
- **Performance**: bounded queries (test asserts ≤ 10 queries for a full 4-type search), no N+1
  on cover images/categories via `select_related`.
- **Frontend**: new `features/search/` (types, api, hooks with 350 ms debounce, components,
  page). `/search` route; `SearchCommand` ⌘K/`Ctrl+K` dialog with arrow-key navigation;
  grouped results; count; loading/empty/error states; RTL-safe; localized (fa/en/ar);
  `noindex,follow` on the search page. Search analytics events wired into the existing system:
  `search_view`, `search_submit`, `search_result_click`, `search_empty`, `search_filter`.

## 4. Dashboard

- New staff-only `GET /api/v1/admin/dashboard/` (permission `IsStaffOrAdmin`, throttled `user`
  scope). Sections:
  - **content**: published/draft articles, awaiting review, scheduled, published/draft projects,
    published services.
  - **editorial**: pending/rejected approvals, scheduled publications, active locks, recent
    revisions (30 d).
  - **engagement**: page views (total + 30 d), article/project views, new contact requests,
    active newsletter subscriptions, search activity.
  - **operations**: recent contact requests, editorial activity, media uploads, admin `LogEntry`s.
  - **system**: DB connectivity, cache status, pending migrations (staff only), environment,
    version, DEBUG. **Never exposes secrets** (verified by test).
- Aggregation queries only; full payload cached 60 s (`dashboard:admin:v1`) so heavy counts never
  run per request.
- The existing Django admin dashboard (`HanahoushAdminSite.dashboard_stats`) was **not replaced**;
  it is unchanged and still feeds the admin index template.

## 5. Analytics

- New persistent `AnalyticsEvent` model (append-only): `event_name`, `timestamp`, `session_key`,
  `client_id` (anonymous visitor), optional `user`, `visitor`, `locale`, `path`, `referrer`,
  `metadata`, `request_id`, `user_agent`, `ip_address`. Indexes `(event_name, timestamp)` and
  `timestamp`.
- `POST /api/v1/analytics/events/` — public, throttled (`analytics` scope, default 120/min),
  batch ≤ 50, `bulk_create`, returns `202` with accepted/dropped counts, 400 for invalid payloads.
  Optional `ANALYTICS_EVENT_ALLOWLIST` env restriction.
- **Privacy**: no credential columns; client-side metadata scrubbing drops keys like
  `password`/`token`/`secret`/`authorization`/`cookie`; retention strategy documented below.
- **Non-blocking**: frontend batches events (5 s / 25 max) and ships via `fetch(..., keepalive)`
  — the shared axios client (and its loading indicator) is never used, so page requests and UI
  are unaffected. Existing `trackEvent()` behaviour is unchanged (still records in memory,
  capped at 200 events, same return).
- In `test` mode persistence is disabled so all existing analytics tests keep their pure
  in-memory behaviour.

## 6. Performance

- **Frontend**: route-level code splitting implemented for the whole SPA (previously only
  page-builder sections were lazy). `Suspense` boundary added around `<Outlet/>` in `AppLayout`.
  Build output now contains per-route chunks (e.g. `HomePage`, `SearchPage`) — verified in the
  production build. Visual effects were not removed.
- **Backend**: search uses `select_related` and a query-count guard test; sitemap is cached;
  dashboard uses aggregation + cache; editorial/admin `get_queryset` already used
  `select_related`/`prefetch_related` (verified during audit — no changes needed).
- **Documented** in `docs/architecture/performance.md` (bundle/lazy/image/query decisions and
  deferred items).

## 7. SEO

- **`/sitemap.xml`** — generated from published Pages, Articles, Projects and public Services
  only (drafts/archived/scheduled/admin/dev excluded); `lastmod`, `changefreq`, `priority`;
  absolute URLs from `SITE_URL`; cached 5 min; invalidated by signals on any save/delete of the
  four source models.
- **`/robots.txt`** — disallows admin/api/dashboard/search/auth/dev routes; references the
  sitemap.
- **Locale alternates**: the frontend is a locale-less SPA (language stored client-side, no
  URL-prefixed routes), so per-language URLs are not served and hreflang is intentionally not
  emitted by the sitemap. `useSeoMeta` was **extended** (not duplicated) with an optional
  `alternates` map that emits `hreflang` links + `x-default` when callers provide them.
- Frontend `public/robots.txt` sitemap placeholder remains (served by the static host); the
  backend now serves the authoritative `/sitemap.xml` + `/robots.txt`.

## 8. Caching

- `CACHES` now explicitly configured (LocMemCache, 300 s) — previously Django's implicit default.
- `Cache-Control: no-store` added to `/api/v1/auth/*` and `/api/v1/admin/*` responses
  (security headers middleware).
- Sitemap cached + signal-invalidated; dashboard payload cached 60 s.
- Frontend React Query tiered cache (site 30 m / content 5 m / listings 2 m) retained, and
  **content-affecting editorial mutations** (publish, archive, reopen, rollback) now invalidate
  the CMS + page-builder caches so the site never serves stale CMS content after workflow changes.
- Never cached: login, refresh, contact submission, admin APIs, user-specific data.

## 9. Security

### Findings by severity

- **CRITICAL** — *none found.*
- **HIGH**
  1. Publishable content viewsets (`Article`, `Project`, `Service`) allowed **anonymous writes**
     (create/update/delete/soft-delete) on the public API. **FIXED**: write methods now require
     staff/superuser/admin (`IsStaffOrReadOnly`); ServiceViewSet is read-only via
     `http_method_names`. Anonymous write now returns 401 (tests updated).
  2. No security headers (`X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`) on
     responses, and auth/admin API responses could be cached by proxies. **FIXED** with
     `SecurityHeadersMiddleware` (+ `Cache-Control: no-store` on those paths).
- **MEDIUM**
  - Search endpoint had no rate limiting. **FIXED**: `search` throttle (60/min).
  - Analytics ingestion had no rate limiting or credential-scrub. **FIXED**: `analytics` throttle
    (120/min) + metadata scrub + batch cap.
- **LOW / INFO**
  - `ENVIRONMENT` was never set so health/version reported `"unknown"`. **FIXED**: `ENVIRONMENT`
    setting (default `local`; production should export `DJANGO_ENVIRONMENT=production`).
  - Health endpoint leaked internal migration state to anonymous callers. **FIXED**: migration
    check is staff-only.
  - `SECRET_KEY` has a documented insecure dev default; production settings already **require**
    the env var. No change (by design, documented).
  - `RedirectRule` middleware is still not implemented (only the read API) — INFO, deferred.

No secrets are exposed by any new endpoint (test-verified: dashboard serialized payload contains
no `secret_key`/`password`/`token`/`signing`). Credentials are never logged; the analytics event
metadata scrub is applied before any event leaves the browser.

## 10. Health / observability

- `GET /api/health/` now returns `environment`, `version`, `timestamp`, `request_id`, and — for
  authenticated staff only — a `migrations` check (`ok`/`pending` + count). Anonymous responses
  stay lean and leak nothing. `GET /api/version/` and `GET /api/ping/` unchanged.
- Structured logging: the existing `APILoggingMiddleware` + `RequestIDMiddleware` were audited —
  request ID is attached on every request/response and errors carry it; no tokens/passwords are
  logged. No changes required (documented).

## 11. Error UX

- New `RouteErrorFallback` wired as the router `errorElement` — polished, localized 404/500
  fallback with home CTA.
- Confirmed existing surfaces: `NotFoundPage` (`*` catch-all), `UnauthorizedPage` (403),
  `SessionExpiredPage`, `ErrorBoundary`, `ErrorState`, `EmptyState`, `Loading`/`Skeleton`,
  per-section `SectionBoundary`, `CmsAsync`. All RTL/LTR, localized, reduced-motion aware.

## 12. Database / index changes

- Migration `analytics.0003_analyticsevent` (new `AnalyticsEvent` table + indexes
  `ae_event_ts_idx`, `timestamp`).
- No other schema changes. Existing publishable indexes (`article_pub_idx`,
  `project_pub_idx`, `service_pub_idx`) already cover the published-filter query shapes used by
  search/sitemap; no redundant indexes added.
- `python manage.py makemigrations --check` → no changes detected; migration applied to local DB.

## 13. Models created / modified

- **Created**: `apps.analytics.AnalyticsEvent`.
- **Modified**: none structurally; `apps.core.admin_site` ordering includes `AnalyticsEvent`.
- Search/SEO apps have **no models** (stateless services/views).

## 14. APIs created / modified

- **Created**: `GET /api/v1/search/`, `GET /api/v1/admin/dashboard/`,
  `POST /api/v1/analytics/events/`, `GET /sitemap.xml`, `GET /robots.txt`.
- **Modified**: `GET /api/health/` (extended payload + staff migration check). Publishable
  viewsets write-permission tightened (behavioral change, documented above).
- OpenAPI schema re-validated (`drf_spectacular.validation.validate_schema`) — 64 paths including
  the three new API endpoints.

## 15. Files created / modified

**Backend — created:** `apps/search/{__init__,apps,services}.py`, `apps/search/api/{__init__,
serializers,views,urls}.py`, `apps/search/tests/{__init__,test_search}.py`;
`apps/seo/{__init__,apps,signals,views}.py`, `apps/seo/tests/{__init__,test_seo}.py`;
`apps/analytics/migrations/0003_analyticsevent.py`, `apps/analytics/tests/test_analytics_events.py`;
`apps/core/api/{__init__,urls,views}.py`, `apps/core/services/dashboard.py`,
`apps/core/tests/{__init__,test_dashboard}.py`; `config/middleware/security_headers.py`;
`config/api/tests/test_security.py`.

**Backend — modified:** `apps/analytics/models.py`, `apps/analytics/api/{serializers,views,urls}.py`,
`apps/analytics/admin.py`; `apps/articles/api/viewsets.py`, `apps/projects/api/viewsets.py`,
`apps/services/api/viewsets.py`; `apps/accounts/api/permissions.py`;
`apps/articles/tests/test_article_api.py`, `apps/projects/tests/test_project_api.py`;
`apps/core/admin_site.py`; `config/api/{health,v1}.py`, `config/urls.py`,
`config/settings/base.py`, `config/api/tests/test_health.py`.

**Frontend — created:** `src/features/search/` (types, api, hooks, components, services, pages,
tests, index); `src/features/analytics/persistence.ts`; `src/app/routes/RouteErrorFallback.tsx`;
`src/app/routes/tests/route-error-fallback.test.tsx`; `src/features/cms/tests/seo-meta.test.tsx`;
`src/features/analytics/tests/persistence.test.ts`.

**Frontend — modified:** `src/features/analytics/index.ts`; `src/features/cms/seo/useSeoMeta.ts`;
`src/app/routes/index.tsx`, `src/app/layouts/{AppLayout,Navbar}.tsx`;
`src/features/editorial/hooks/index.ts`; `src/i18n/locales/{en,fa,ar}/translation.json`.

## 16. Migrations

- `analytics.0003_analyticsevent` — created and applied. No reset performed.

## 17. Bootstrap changes

- None required. `python manage.py bootstrap` re-run and verified idempotent with the new apps.

## 18. Tests added

**Backend (45 new, 167 → 212):**
- Search: min-length 400, published-only, type/category filters, localization, unified shape,
  relevance ordering, pagination envelope, bounded query count (10).
- Analytics ingestion: single/batch, invalid payload, batch-size cap, dropped items, allowlist,
  authenticated user link, request_id capture, no-credential-columns.
- Dashboard: anonymous 401, non-staff 403, staff/superuser 200, secrets never exposed, system
  section, cached payload.
- Sitemap/robots: XML content-type, published included, drafts excluded, home→root, SITE_URL,
  cache invalidation on delete/publish.
- Health: existing tests pass with extended payload; new security-headers tests
  (nosniff/referrer/permissions, no-store on auth + admin).
- Write-permission hardening: anonymous writes now 401 for articles/projects.

**Frontend (25 new, 122 → 147):**
- Search: grouping, debounce hook, enabled gating + fetch, input clear-button, results
  loading/error/empty/grouped states, command dialog open, page render.
- `useSeoMeta`: title/description/robots, canonical/OG/Twitter, hreflang alternates + x-default,
  stale-alternate removal, googlebot sync.
- Analytics persistence: disabled in tests, nothing sent while disabled, batching + POST body,
  metadata credential scrub.
- Route error fallback: 404 and generic rendering (with mocked `useRouteError`).

## 19. Verification

| Check | Result |
|---|---|
| `python manage.py check` | ✅ 0 issues |
| `python manage.py makemigrations --check --dry-run` | ✅ No changes detected |
| `python manage.py migrate` | ✅ analytics.0003_analyticsevent applied |
| `python manage.py bootstrap` | ✅ idempotent |
| `python -m pytest` (USE_SQLITE) | ✅ **212 passed** |
| `python manage.py test` (ci, USE_SQLITE) | ✅ **160 OK** |
| `npm run typecheck` | ✅ 0 errors |
| `npm run lint` | ✅ clean |
| `npm run test` | ✅ **147 passed** |
| `npm run build` | ✅ built (route-level chunks verified) |
| `npm run build-storybook` | ✅ built |
| OpenAPI `validate_schema` | ✅ valid, 64 paths |
| Live HTTP smoke (see below) | ✅ **23/23 passed** |

## 20. Live routes verified

Backend-served: `/`, `/about`, `/services`, `/projects`, `/projects/:slug`, `/articles`,
`/articles/:slug`, `/search`, `/contact` are SPA routes (built frontend); the backend public
routes that compose them were verified live: `/api/v1/pages/{home,about,services,projects,
articles,contact}/`. `/sitemap.xml` and `/robots.txt` verified live (200).

## 21. Live API endpoints verified (HTTP, 23/23)

`GET /api/health/`, `GET /api/version/`, `GET /api/ping/`, `GET /api/v1/search/?q=erp`,
`GET /api/v1/search/?q=a` (400), `GET /api/v1/articles/`, `GET /api/v1/projects/`,
`GET /api/v1/service-sections/`, `GET /api/v1/pages/home/`, `GET /api/v1/seo/?slug=home`,
`GET /sitemap.xml`, `GET /robots.txt`, `GET /api/schema/`,
`GET /api/v1/admin/dashboard/` (anon 401), `GET /api/v1/admin/newsletter/` (anon 401),
`POST /api/v1/articles/` (anon 401), `POST /api/v1/contact/` (201),
`POST /api/v1/analytics/events/` (202, anon + staff), staff `POST /api/v1/auth/login/` (200),
staff `GET /api/v1/admin/dashboard/` (200), staff `GET /api/v1/admin/newsletter/` (200),
staff `POST /api/v1/articles/` (201).

## 22. Security findings

See §9. CRITICAL: none. HIGH: (fixed) anonymous publishable writes, missing security headers.
MEDIUM: (fixed) search/analytics throttling, analytics credential scrub. LOW/INFO: ENVIRONMENT
set, health migration check staff-only, dev SECRET_KEY default (by design), redirect middleware
still API-only (deferred).

## 23. Performance findings

- Main SPA bundle now splits into per-route chunks (verified in `dist/`); motion/react/query
  vendor chunks retained.
- Search: ≤ 10 queries per request; dashboard: aggregated + cached; sitemap: cached + invalidated.
- Existing admin/editorial querysets already avoid N+1 (audited, no change needed).
- Deferred: responsive `srcset`/CDN variants for CMS media, prerender/SSR head, Redis cache
  backend, worker-backed async ingestion.

## 24. Known issues

- `import_export.admin failed to assign change_list_template` warning on every management
  command (pre-existing, harmless).
- Storybook build emits a >500 kB chunk warning (component library, pre-existing).
- Locale files contain a pre-existing encoding artifact (`�?`) in some strings from earlier
  phases; search strings are clean.
- Live smoke created a few `ContactRequest`/`AnalyticsEvent`/article rows in the local dev DB
  (smoke data, not production).

## 25. Deferred work

- PostgreSQL full-text/trigram search (documented; revisit when content volume grows and CI can
  run on PG).
- Async/worker-backed analytics + outbox, server-side HTML sanitizer (bleach/nh3), prerender/SSR
  head — already listed as Phase 9 candidates.
- `RedirectRule` enforcement middleware (still API-only).
- Media variants/thumbnails + `srcset`/CDN image delivery.
- Redis cache backend + distributed cache invalidation.
- Sentry/APM observability, admin theme restyle.

## 26. Architectural risks

- **Search in Python**: the relevance ranking happens in Python over full result sets. Bounded
  today (content volumes small, pagination caps at 100) but will need a DB-side ranking (PG
  FTS/trigram) at scale — documented in `docs/architecture/search.md`.
- **Locmem cache** is process-local: dashboard/sitemap caching is per-process. A multi-worker
  deployment should move to Redis (no code change needed — swap the `CACHES` backend).
- **Synchronous analytics writes** (bulk_create) run in the request path (throttled + capped);
  acceptable now, but heavy traffic should move ingestion to a queue (Phase 9).
- **Staff-gated API writes** change the public contract for write endpoints — any external
  clients using anonymous writes will now receive 401 (intentional hardening).
- Repo remains **not under version control** in this environment.

## 27. Documentation paths

- `docs/reports/phase-08H-report.md` (this report)
- `docs/architecture/search.md` · `docs/architecture/analytics.md` ·
  `docs/architecture/performance.md` · `docs/architecture/seo.md` ·
  `docs/architecture/security.md`
- `CHANGELOG.md` (updated) · `NEXT_PHASE.md` (updated) · `docs/reports/next-phase.md` (updated)

## 28. Explicit completion status

**PHASE 8H — COMPLETE**

All 14 parts executed: global search, dashboard, analytics foundation, performance, SEO
infrastructure, HTTP/cache strategy, security hardening, health/observability, error UX, admin
quality, database quality, testing, live verification, and documentation. Nothing is BLOCKED.
Deferred items are explicitly scoped to later phases (9+) and do not block production readiness.
