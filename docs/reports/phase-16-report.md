# Phase 16 Report — SEO + Publication Timeline + Content Governance

Date: 2026-09-13
Scope: SEO health/preview/canonical integration in Article/Project/Service studios; Publication Timeline (`/dashboard/timeline`); schedule cancel/reschedule with bucket filters; dashboard publication operations; role verification; full test/build/E2E verification. ERP remains parked. No migrations.

> No credentials, secrets, password hashes, or tokens appear in this report.

---

## 1. Executive summary

Phase 16 closes the two largest remaining CMS gaps: **manageable SEO** and **an operational publication timeline**. Both reuse existing infrastructure — no new models, no new permissions, no new migrations, no new dependencies.

- SEO: existing `meta_title/meta_description/meta_keywords/canonical_url/og_image` fields are now editable with canonical inputs, actionable health (via existing `ContentHealthPanel`), and search/social previews in all three studios.
- Timeline: existing `PublicationSchedule` + workflow state machine gained cancel/reschedule operations, bucket filters (`upcoming/today/overdue`), an enriched list payload (content label, type, stage, actor), and a lightweight `/dashboard/timeline` UI (list + day-group views, no calendar dependency).
- Dashboard: new publication-operations section (upcoming/today/overdue counts + actionable schedule list) driven by the existing operational-dashboard payload.
- Verification: backend **357 passed**, frontend **276 passed / 53 files**, typecheck clean, ESLint clean, Vite build clean, Storybook build clean, Playwright **155 passed** across all suites incl. new 4-test timeline spec. E2E drafts cleaned (30 articles + 1 service hard-deleted); live DB holds 4 demo services, 13 articles, 5 projects.

## 2. Initial architecture audit

Inspected before any code change:

- **Article/Project/Service models** (`apps/articles|projects|services/models.py`): all extend `PublishableModel` (`apps/core/models.py`) — trilingual title/short_description/description, `status` (draft/review/published/archived), `is_featured/is_public/published_at/sort_order`, plus SEO fields `meta_title (70), meta_description (160), meta_keywords, canonical_url, og_image (FK→MediaFile)`. No new fields needed.
- **Editorial workflow** (`apps/editorial/models.py + services.py + seed.py`): generic-FK `ContentWorkflow` with 7 stages (draft→in_review→seo_review→approved→scheduled→published→archived), approval chain, revisions/rollback/diff, comments, locks, `PublicationSchedule` (scheduled/publishing/published/cancelled), immutable `AuditEvent`, `publish_due()` + `publish_scheduled` management command. Scheduling reuses this — no parallel engine.
- **SEO infra**: `apps/seo/views.py` (sitemap from published pages/articles/projects/services only; robots disallowing /admin /api /dashboard /search /login etc.), `apps/seo/signals.py` (cache invalidation), `SEOConfiguration` per-page + site default (`apps/page_builder`), frontend `useSeoMeta` + `JsonLd` + per-type hooks (`useArticleSeo`, `useProjectSeo`), Playwright `seo.spec.ts`.
- **Roles**: 6 roles, 27 permissions (`apps/accounts/seeders.py`); editorial uses `editorial.view/manage/approve/review/schedule`; frontend capabilities mirror them (`role-config/capabilities.ts`). No new permission needed — timeline maps to existing editorial perms.
- **Dashboard**: `apps/core/services/dashboard.py` + `GET /api/v1/admin/dashboard/` (staff-only, 60s cache) with content/editorial/engagement/operations/system sections.
- **Public routes**: `/, /services, /projects, /projects/:slug, /articles, /articles/:slug, /about, /contact, /search` (SPA, locale client-side, no locale-prefixed URLs — hreflang intentionally omitted).
- **Caching**: sitemap 300s, dashboard 60s; editorial mutations did not clear dashboard cache (fixed this phase).
- **Tests**: backend editorial/seo/dashboard suites green; frontend 271/51 baseline.

Decision: smallest production-safe implementation = **zero migrations, zero new permissions, reuse workflow/scheduling/SEO/health/audit/dashboard**, add only: schedule cancel/reschedule ops, bucket filters, enriched payload, timeline UI, SEO health/preview/canonical inputs, dashboard ops section.

## 3. Existing functionality reused

- `PublishableModel` SEO fields (no schema change).
- Full editorial state machine, approval chain, revisions, comments, locks, audit.
- `PublicationSchedule` model + `publish_due()` + `publish_scheduled` command (no Celery/Redis).
- Sitemap/robots/signals, `useSeoMeta`/`JsonLd`, per-type SEO hooks.
- `ContentHealthPanel` (no second health system).
- `AuditEvent` trail (new actions: `schedule.cancelled`, `schedule.rescheduled`).
- Operational dashboard payload + staff gate.
- All 27 permissions + 6 roles + capability mapping + route guards.
- Existing studio shells, design tokens (`#932990 / #272161 / #FDFBFC`), UI primitives.

## 4. SEO implementation

- New shared helper `frontend/src/features/cms/seo/seoHealth.ts` (`seoHealthItems`): missing/long/weak title, missing/long description, missing canonical, missing OG image, missing per-locale titles, canonical↔slug mismatch. Severities critical (slug only) / warning; each item carries `target` element id + optional `locale` for click-to-focus + locale switch via existing `ContentHealthPanel.onNavigate`.
- New `SeoPreviewCard` (`seo/SeoPreview.tsx`): Google-style snippet (60/160 char counters), social card, canonical/robots summary, locale label. Lightweight, no rich rendering.
- Article/Project/Service studios: canonical URL state + hydration + payload persistence (`canonical_url` write serializers already existed; article staff payload type also gained `canonical_url/og_image`); canonical `<Input>` with field-error display; SEO items merged into existing `ContentHealthPanel`; `SeoPreviewCard` under health; persisted via existing staff PATCH.
- Article detail SEO extended to prefer stored `meta_title/meta_description/canonical_url` (locale-aware fallbacks preserved).

## 5. SEO technical audit

- Sitemap: published-only (pages/articles/projects/services), cached 300s, invalidated on save/delete. Verified via `seo.spec.ts` backend test (reachable, complete, drafts excluded).
- robots.txt: allows public, disallows `/admin/ /api/ /dashboard /search /login /forgot-password /reset-password /unauthorized /session-expired /design /dev/`, references sitemap. Staff/auth routes `noindex` client-side via `useSeoMeta`.
- Canonical: now editable per content item; mismatch flagged; public hooks emit canonical link.
- hreflang: intentionally absent (locale-less SPA, language client-side) — documented in `seo/views.py` and `useSeoMeta`.
- OG/Twitter: `og:title/description/type/url/locale/image/site_name` + `twitter:card/title/description/image` on all public content pages.
- JSON-LD: Organization+FAQ (about), BlogPosting+Breadcrumb (articles), CreativeWork+Breadcrumb (projects). No spam; only emitted with required data.
- 404/auth/search: `noindex`, own titles, friendly states (Playwright errors suite 10/10).
- Trailing slash: sitemap emits `/articles/:slug/` and `/projects/:slug/` consistently.
- Images: cover/OG resolved via `resolveMediaUrl`; gallery alt-text health exists for projects.

## 6. Publication Timeline implementation

- Route `/dashboard/timeline` (`PublicationTimelinePage`, lazy chunk ~5.3 kB / ~2.1 kB gzip), guarded by `editorial.view`, sidebar entry under Editorial section (CalendarClock icon).
- Views: lightweight **list** (default, sorted by `scheduled_for`) + **day-group** view; no calendar dependency. Filters: search (debounced via state), bucket (`all/upcoming/today/overdue/done`), view switch. Header badges: Overdue/Today/Total counts.
- Rows: content-type badge, workflow stage badge (`WorkflowBadge`), status badge, title, localized timestamp + scheduler, deep link to workflow detail, inline reschedule (`datetime-local` + button) + cancel — rendered only for `editorial.schedule` holders and `scheduled` rows.
- Pagination: dashboard brief caps at 8 per bucket; timeline list renders current result set (schedules table is small; no virtualization needed).
- i18n: `timeline.*` keys in EN/FA/AR; locale parity test passes.

## 7. Scheduling implementation

- `ScheduleService.cancel`: scheduled→cancelled, sets `cancelled_by`, audit `schedule.cancelled`, clears dashboard cache. Rejects non-scheduled.
- `ScheduleService.reschedule`: future-time validation, updates `scheduled_for`, audit `schedule.rescheduled`, clears cache. Rejects non-scheduled + past times.
- `WorkflowService.schedule` unchanged (approved/scheduled only); transitions + publish + archive now clear the dashboard cache so ops data never goes stale.
- Timezone: `DateTimeField` (TZ-aware, UTC storage); UI uses `datetime-local` → ISO; display via `toLocaleString()` (user locale).
- Publication scope is per content item (global across FA/EN/AR — matches existing single-status model); locale readiness surfaced via translation-gap tiles + SEO locale findings, not a new localization architecture.

## 8. Automatic/manual publication mechanism

- Reused existing `ScheduleService.publish_due()` (idempotent: only `status=scheduled AND scheduled_for<=now`; marks schedule published; workflow→published; failures logged, never raised; second run publishes nothing).
- Existing command `python manage.py publish_scheduled` ("Published N scheduled item(s)") — deterministic manual mechanism for local/demo; production needs external cron/systemd timer (documented in report; no Celery/Redis introduced).
- New tests: due publish, idempotent re-run, cancelled schedules skipped.

## 9. Role and permission matrix

No new permissions. Mapping (backend authoritative):

| Capability | Backend perm | SUPER_ADMIN | COMPANY_ADMIN | CONTENT_MANAGER | PROJECT_MANAGER | EDITOR | VIEWER |
|---|---|---|---|---|---|---|---|
| View timeline | `editorial.view` | ✓ | ✓ | ✓ | ✓ | ✓ (read-only) | ✓ (read-only) |
| Create schedule | `editorial.schedule` or `editorial.manage` | ✓ | ✓ | ✓ | — | — | — |
| Edit/reschedule | `editorial.schedule` or `editorial.manage` | ✓ | ✓ | ✓ | — | — | — |
| Cancel | `editorial.schedule` or `editorial.manage` | ✓ | ✓ | ✓ | — | — | — |
| Publish now | `editorial.manage` (or schedule) | ✓ | ✓ | ✓ (manage) | — | — | — |
| Approve/review | `editorial.approve` / `editorial.review` / `editorial.manage` | ✓ approve | ✓ approve | ✓ review | ✓ review | ✓ review | — |
| Manage all | `editorial.manage` | ✓ | ✓ | ✓ | — | — | — |

Notes: PROJECT_MANAGER holds only `editorial.view+review` (no schedule/manage) → timeline read-only for them. EDITOR/VIEWER are non-staff → staff write APIs reject regardless of UI. COMPANY_ADMIN lacks `editorial.review` (has manage/approve/schedule). All schedule mutations return 401 anonymous / 403 unauthorized (tested).

## 10. Exact users/roles verified

Playwright six-role flow (all login→dashboard→nav→backend→logout): superadmin/SUPER_ADMIN, companyadmin/COMPANY_ADMIN, contentmanager/CONTENT_MANAGER, projectmanager/PROJECT_MANAGER, editor/EDITOR, viewer/VIEWER — 6/6 passed plus guest-401 and session-expiry tests (roles.spec 8/8). Timeline-specific: SUPER_ADMIN full view, VIEWER read-only (no Cancel/Reschedule buttons), unauthenticated API 401/403, 390px overflow-free.

## 11. Dashboard changes

`DashboardPage`: new **Publication operations** section (editorial-capability gated): upcoming/today/overdue `StatTile`s + up-to-6 actionable schedule rows (type, scheduler, localized time → workflow detail link) + empty state + "Open timeline" view-all link. Backend `_editorial_section` extended with `upcoming/overdue/today` counts + brief lists (≤8 each, single query each). Frontend types extended (`ScheduleBrief`). Existing services/attention/translation-gap sections untouched.

## 12. Article Studio changes

`ArticleEditPage`: canonical state/hydration/payload/snapshot; canonical input; SEO health merged into `ContentHealthPanel`; `SeoPreviewCard`; `PublicationPanel` (status/workflow/scheduled/published + submit/schedule/publish-now gated by `editorial.manage/schedule`). Removed dead `Send` import. Hydrate-once regression tests pass.

## 13. Project Studio changes

`ProjectEditPage`: same canonical + SEO + publication integration as articles (project-canonical input, project SEO targets, `/projects/:slug` preview URL). Removed dead `Send` import.

## 14. Services Studio changes

`ServiceEditPage`: workflow hooks (`services.service` content type), submit-for-review handler (was missing — services had no workflow entry point), canonical state/persist/UI, SEO health + preview, `PublicationPanel`. Note: service studio files arrived via uncommitted Phase 15.5 work in this tree (kept intact).

## 15. Public page changes

Article public SEO now prefers stored `meta_title/meta_description/canonical_url` with locale fallbacks. No route/layout changes. Services public page unchanged (page-builder composed; no per-service public route exists — parity gap documented §35).

## 16. Sitemap/robots/canonical/hreflang changes

No code changes (system already correct). Verified: sitemap published-only + cached + invalidated; robots disallows staff/auth + references sitemap; canonical now editable + mismatch-flagged; hreflang intentionally omitted (locale-less SPA).

## 17. Audit trail changes

New actions `schedule.cancelled` and `schedule.rescheduled` (actor, timestamp, schedule id, before/after). All schedule/publish/archive/transition paths now clear the dashboard cache so the ops surface reflects the trail. No secrets logged.

## 18. UI/UX improvements

Timeline cards, publication panels, SEO preview cards, dashboard ops section, canonical inputs, bucket/view/search controls, empty/loading/error states, breadcrumbs — all via existing design system + tokens. No second theme.

## 19. Accessibility

Playwright accessibility suite 13/13 (axe scans on 9 public pages, H1, landmarks, labels, alt text). Timeline: labeled inputs, button roles, aria-live loading, keyboard-operable selects/date inputs, focus-visible rings from tokens.

## 20. RTL/LTR

RTL suite 6/6 (FA/AR document direction, workspace direction, no backend leaks, locale parity). Timeline timestamps `dir=ltr` (tabular), titles `dir=auto`; mobile list layout avoids forced desktop calendar.

## 21. Responsive verification

Viewports covered by responsive suite + timeline 390px no-overflow test: 1440/1280/1024/768/390/375. Timeline collapses to compact list on mobile by design.

## 22. Performance observations

Performance suite 3/3 (no duplicate GETs, minimal layout shift, dashboard lazy chunk). Timeline: single `/schedules/` fetch, memoized filtering/grouping, ≤8 dashboard briefs per bucket, lazy route chunk, no image preload, no continuous animations.

## 23. Bundle/chunk impact

New lazy chunk `PublicationTimelinePage` ~5.3 kB (~2.1 kB gzip). SEO helper + preview + panel ride inside existing studio chunks (ArticleEdit ~17.4 kB, ServiceEdit ~16.7 kB, ProjectEdit ~31.3 kB — inline with pre-existing sizes). No new dependencies (`package.json` untouched).

## 24. RAM/memory observations

No new stores/caches/clients; timeline holds one query result; mutations invalidate existing keys only. Dynamic `import("../api")` in two hooks triggers a Vite chunking notice (module also statically imported) — cosmetic warning, no duplication.

## 25. Network/request observations

Timeline: 1 GET `/editorial/schedules/` (+ optional `?bucket=`); mutations POST cancel/reschedule then invalidate schedules/workflows/dashboard. Dashboard: 1 cached GET. No polling, no duplicate clients.

## 26. Database status

Live `backend/db.sqlite3` preserved. After E2E cleanup: **4 services** (demo-web-development, demo-mobile-development, demo-erp-consulting, demo-ux/ui-design — all published), **13 articles**, **5 projects**. E2E artifacts hard-deleted: 30 `phase10-e2e-draft-*` articles, 1 `phase155-e2e-service-*` service, 2 smoke users.

## 27. Migration status

**No migrations.** `makemigrations --check` → "No changes detected". `showmigrations --plan` → no unapplied (`[ ]` absent). `manage.py check` clean.

## 28. Security/RBAC verification

Backend authoritative: schedule create/cancel/reschedule gated by `editorial.schedule|manage`; viewer cancel → 403 (tested); anonymous list → 401 (tested); staff-only dashboard API; non-staff writes rejected. Frontend gates are UX-only. No secrets in logs/reports.

## 29. Backend exact test count

**357 passed** (`python -m pytest -q --no-cov`, ~10s), including 4 new `test_schedule_ops.py` (cancel/reschedule service, past-time rejection, idempotent publish, API cancel/reschedule/buckets + 403).

## 30. Frontend exact test count

**276 passed / 53 files** (`npm run test`), including 5 new (seoHealth 3, timeline page 2). Fixed 8 pre-existing expectation failures from the new timeline nav (auth + sidebar tests updated) and 2 article-test mock gaps (new hooks added to mock).

## 31. Playwright exact test count

**155 passed, 0 failed**: publication-timeline 4/4 (new), roles 8/8, seo 12/12, workspace 12/12, services-studio 2/2, smoke 16/16, user-admin 2/2, rtl 6/6, responsive (in 91-batch), accessibility 13/13, cursor-grid 7/7, theme 6/6, errors 10/10, performance 3/3. Batches: 24-run (timeline+roles+seo), 91-run (workspace+services+rtl+responsive+smoke+user-admin), 20-run (theme+errors+performance), 20-run (accessibility+cursor-grid).

## 32. Any pre-existing failures

Two known flakes from Phase 15.5 (cursor-grid visual threshold, `/dashboard/articles` mobile overflow) **did not reproduce** in this run — all suites green.

## 33. New failures, if any

None after fixes. During the phase: 8 frontend expectation failures from the added timeline nav (fixed by updating expected link lists) + 2 article mock failures (fixed by adding new hook mocks) + 1 timeline test assertion collision (breadcrumb vs H1 — fixed with role query) + 1 backend 403 in new test (fixed `Permission.objects` seeding with get_or_create).

## 34. Known issues

- Vite build warning: `editorial/api/index.ts` dynamically imported by hooks but also statically imported — chunking notice only, no behavior impact (could be cleaned by direct imports).
- No per-service public detail route (`/services/:slug` doesn't exist) — services render as page-builder sections; SEO detail hooks cover articles/projects only.
- `publish_scheduled` requires external cron for true automation (documented; by design, no Celery/Redis).

## 35. Deferred items

- Per-service public detail page + `useServiceSeo` (needs routing + product decision; public services currently section-based).
- Cron/systemd wiring for `publish_scheduled` in production (ops task, one line).
- Timeline pagination/virtualization (unneeded at current volumes).
- Direct-import cleanup for the Vite chunking notice.
- `og_image` picker in studios (currently reuses cover; backend field exists and persists).

## 36. Files created

- `backend/apps/editorial/tests/test_schedule_ops.py` (4 tests)
- `frontend/src/features/cms/seo/seoHealth.ts` (+ `seoHealth.test.ts`)
- `frontend/src/features/cms/seo/SeoPreview.tsx` (`SeoPreviewCard`)
- `frontend/src/features/editorial/components/PublicationPanel.tsx`
- `frontend/src/features/editorial/pages/PublicationTimelinePage.tsx` (+ test)
- `frontend/e2e/publication-timeline.spec.ts`
- `docs/reports/phase-16-report.md` (this file)
- (Pre-existing uncommitted Phase 15.5 files kept: services studio/API/hooks/tests, services-studio.spec, phase-15.5 report.)

## 37. Files modified

- `backend/apps/editorial/services.py` (cancel/reschedule/cache-clear)
- `backend/apps/editorial/api/serializers.py` (enriched schedule payload)
- `backend/apps/editorial/api/views.py` (bucket filters, cancel/reschedule actions)
- `backend/apps/core/services/dashboard.py` (schedule briefs + counts)
- `frontend/src/features/articles/api/staff.ts` (canonical/og payload types)
- `frontend/src/features/articles/workspace/ArticleEditPage(.test).tsx`
- `frontend/src/features/projects/workspace/ProjectEditPage.tsx`
- `frontend/src/features/services/workspace/ServiceEditPage.tsx`
- `frontend/src/features/editorial/{api,hooks,types,components}/`
- `frontend/src/features/dashboard/{pages,types}/`
- `frontend/src/features/cms/seo/index.ts`
- `frontend/src/app/{routes,workspace}/`
- `frontend/src/i18n/locales/{en,fa,ar}/translation.json`
- `frontend/src/features/auth/tests/authorize.test.ts`, `frontend/src/app/workspace/tests/navigation.test.tsx`
- (Pre-existing Phase 15.5 modifications kept: services API/viewset, dashboard services coverage, article preview, capabilities, routes/nav.)

## 38. ERP status

PARKED. `ERP_ENABLED=false`, `ERP_PROVIDER=null`, NullProvider active. No ERP calls, credentials, models, or migrations. No ERP files touched.

## 39. Final recommendation

**Ship Phase 16.** All suites green, DB clean, no migrations, no new deps, timeline + SEO integrated per role.

## 40. Exact next phase recommendation

**Phase 17 — Scheduled Media + Translation Readiness Gates.** (1) Surface per-locale translation completeness on timeline rows (FA/EN/AR dots from existing title/body presence, no new architecture). (2) Optional blocking gate: prevent scheduling when a *critical* health item exists (currently warnings never block). (3) Production cron wiring doc + runbook for `publish_scheduled`. (4) Per-service public route decision (only if product wants deep-linkable services).
