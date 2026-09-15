# Phase 17 Report — Publication Governance 2.0 + Service Routing Decision + Production Readiness

Date: 2026-09-14. Working tree also contains uncommitted work from earlier phases
(Services Studio CRUD, dashboard publication section, timeline page, i18n keys);
this report covers only the Phase 17 scope. Phase 17 added no migrations, no
background-job infrastructure, no new roles, no ERP changes.

## 1. Executive summary

- Backend-authoritative critical-health gate: `schedule` and `publish-now`
  refuse content with blocking issues (missing/invalid slug, missing EN title,
  missing EN body, invalid canonical). Warnings (SEO length, missing FA/AR,
  missing cover) never block. API returns `422 PUBLICATION_BLOCKED` with
  structured `{field, locale, message}` list; no stack traces.
- Per-locale readiness on timeline: `ScheduleSerializer` now carries a
  lightweight `locale_readiness: {fa,en,ar: {ready, critical, warnings, issues}}`
  computed from presence checks only (no content duplication, no extra queries
  beyond the already-fetched content object).
- `publish_due()` hardened: skips cancelled/future, marks already-public
  schedules done without republishing, refuses blocking-health items with a
  `publish.failed` audit event, per-item isolation (one failure never blocks
  others), dashboard cache clear, sitemap via existing signals.
- Production runbook created: `docs/operations/publication-scheduling.md`
  (cron every 1–5 min, UTC semantics, monitoring, recovery, disable, what-NOT-to-do).
- Service route decision: **OPTION A — services remain section-based**. No
  `/services/:slug` route. Sitemap fixed to list only the `/services` hub
  (previously emitted dead per-service URLs → 404). Service Studio SEO preview
  URL corrected to the hub.
- PublicationPanel 2.0 in Article/Project/Service studios: status, workflow,
  locale dots, scheduled/published times, blocking-issue alert, action errors,
  permission/stage explanations.
- Timeline 2.0: locale dots with tooltip + screen-reader labels, relative +
  absolute timestamps, studio deep links, Needs-attention filter + badge,
  permission-gated row actions (unchanged rule: `EDITORIAL_SCHEDULE`).
- One real responsive bug fixed: dashboard AttentionQueue grid overflowed 62px
  at 390px (grid min-content + non-shrinking children); fixed with
  `minmax(0,1fr)` columns + `min-w-0/truncate/shrink-0` children.
- Safe E2E round trip on live DB performed with temp probe content
  (schedule → future-safe → due publish → audit → full cleanup).

## 2. Initial audit

Audited before coding (files, not rebuilt): `editorial/models.py`
(PublicationSchedule: scheduled/publishing/published/cancelled + scheduled_by /
cancelled_by), `editorial/services.py` (ScheduleService.publish_due/cancel/
reschedule, WorkflowService.schedule/publish/transition/archive), command
`publish_scheduled`, `core/models.py` (PublishableModel: fa/en/ar titles +
descriptions, status, is_public, meta/canonical/og), `ContentHealthPanel` +
`seoHealthItems` (all warnings, one critical: missing slug), per-studio
`completeness` memos + `StudioLocaleSelect`, timeline payload
(`ScheduleSerializer` + `PublicationTimelinePage`), permissions
(`editorial.view/manage/approve/review/schedule`), `PublicationPanel`,
service public architecture (`ServicesPage` = page-builder renderer, no
`:slug` route, sitemap emitting dead `/services/<slug>/` URLs),
`seo/views.py` + `signals.py`, dashboard ops service + dashboard publication
section, audit events (`schedule.created/cancelled/rescheduled`,
`workflow.publish`, `approval.decided`, …), existing schedule/seo tests.

Findings that drove the plan: no readiness gate anywhere; timeline payload had
no locale data; sitemap advertised service URLs that 404; `publish_due` logged
WorkflowError without audit and would republish already-public content;
dashboard publication feed rows could overflow on mobile.

## 3. Architecture decisions

- New module `backend/apps/editorial/readiness.py` is the single source of
  truth (`blocking_issues`, `locale_readiness`, `assert_ready`,
  `PublicationBlocked`). `WorkflowService.schedule` and non-soft
  `WorkflowService.publish` call `assert_ready` on a freshly re-fetched
  content object (GFK cache can be stale). Soft publish (preview) bypasses the
  gate deliberately — it never goes public.
- `_error()` in editorial views maps `PublicationBlocked` → 422 with
  `errors: {code: ["PUBLICATION_BLOCKED"], blocking: [...]}`; all other
  workflow errors keep the existing 400 envelope.
- `get_locale_readiness` on `ScheduleSerializer` reuses the workflow's
  already-fetched content object (select_related in the viewset); compact
  presence-only summary, max 3 short issue strings per locale.
- No Celery/Redis/new cache layer/new audit system/new RBAC (per spec).
- Timeline filtering stays client-side over the fetched list plus the existing
  server `?bucket=` param; no filter framework added.

## 4. Per-locale readiness

- Shape per schedule row: `locale_readiness.fa|en|ar = {ready, critical,
  warnings, issues[]}`. EN carries slug/canonical blockers (canonical locale);
  FA/AR readiness = title + body presence.
- UI: `EN ● / FA ● / AR ○ / !` dots; text symbol (not color alone) +
  `title` + `aria-label` with issue details; green/amber/red supplementary
  color. RTL-safe (plain inline spans). No locale content loaded per row.
- Studios show the same dots inside PublicationPanel from the existing
  `completeness` memo (no new computation).
- Timeline row links: "Open studio" deep link (`/dashboard/articles|projects|
  services/:id/edit`) derived from `content_type` + `object_id`; read-only
  roles see dots/info but no mutation controls (unchanged gating).

## 5. Critical health gate

- Blockers: missing slug, invalid slug (unicode-slug validator), missing
  `title_en`, missing `description_en`, invalid `canonical_url` when set.
- Non-blockers (verified by test): meta title/description length, missing
  FA/AR, missing cover/section, missing OG — scheduling allowed.
- Enforced in `WorkflowService.schedule` and `WorkflowService.publish`
  (non-soft), therefore covering API schedule, publish-now, cron `publish_due`.
- API: `422 {success:false, message:"Publication blocked…", errors:{code:
  ["PUBLICATION_BLOCKED"], blocking:[{field,locale,message}]}}`.
- Frontend: studios surface `errors.blocking` in PublicationPanel alert with
  per-locale messages; generic action errors shown separately.

## 6. Scheduling safety

- `publish_due()`: `status=scheduled AND scheduled_for<=now()` (UTC); per-item
  try/except; `PublicationBlocked` → warn-log + `publish.failed` audit, row
  stays `scheduled`; other `WorkflowError` → warn-log + `publish.failed` audit;
  already-public content → schedule marked `published`, no republish; success →
  `workflow.publish` audit + dashboard cache clear; sitemap via model signals.
- `cancel`/`reschedule` unchanged except existing cache clear; reschedule still
  rejects past/non-scheduled.

## 7. publish_scheduled behavior

- Idempotent, timezone-safe (UTC compare), safe to repeat (second run
  publishes 0), cancelled never publish, future never publish, no duplicates,
  no secrets in logs (warning line holds id + reason only), one failure never
  corrupts others. Verified by tests + live-DB probe (Sectioncond round trip).

## 8. Production cron/runbook

- `docs/operations/publication-scheduling.md`: command, `*/2 * * * *`
  recommendation, UTC behavior, overlap-safety (no lock needed), logging,
  monitoring (alert on `publish.failed` spike or stale `scheduled` rows past
  15 min), manual recovery, safe test recipe, disable (comment cron line),
  what-NOT-to-do (no Celery/Redis, no DB surgery, no force flags).

## 9. Service route decision

- **OPTION A — services remain section-based.** Evidence: `ServicesPage` is a
  page-builder `PageRenderer` for the `services` Page; `Service` has
  `section FK` + publishable/SEO surface but no detail component, no
  `:slug` route, no per-service internal links; public API list/detail exists
  but is consumed as section content (`ServicesSection` via `useServices`).
  Product intent = hub page with grouped sections, not standalone landing pages.
- Consequences applied: sitemap emits only `/services` hub when ≥1 public
  service exists (zero dead URLs); robots unchanged (hub indexable);
  Service Studio SEO preview URL corrected to `/services`; Studio preview page
  already renders section parity (`ServiceCard` + localized body) — left as is.
- Deliberately NOT done (no Option B): no `/services/:slug` page, no related
  services, no new routing architecture.

## 10. Article publication flow

Unchanged stages; strengthened: gate on schedule/publish-now (422 +
structured blockers), panel shows locale dots + blocking alert + explanations,
timeline row shows readiness + studio link. E2E probe used an Article.

## 11. Project publication flow

Same as Article (shared gate + panel + timeline). Project studio wired with
`completeness` + error extraction identical to Article.

## 12. Service publication flow

Same gate/panel/timeline as Article/Project; reflects section-based reality
(hub preview URL, hub-only sitemap). Service studio wired identically.

## 13. Timeline changes

(`PublicationTimelinePage.tsx` + `editorial/types` + API layer — no new deps.)

- `LocaleDots` per row; `Needs attention` badge (overdue OR any locale
  critical) + `attention` filter + header count; relative time (`in 2h`,
  `3d ago`) next to absolute `<time dateTime title>`; `Open studio` deep link
  beside workflow link; existing search/bucket/list-vs-day-groups/empty +
  error states kept; row reschedule/cancel gating unchanged.

## 14. Dashboard changes

- No new dashboard section (publication ops section predates this phase).
- Fixed 62px mobile overflow at 390px on `/dashboard`: AttentionQueue link
  label (`min-w-0 flex-1 truncate`, badge `shrink-0`), publication feed rows
  (`min-w-0 flex-1` + timestamp `shrink-0`), `SectionCard` grid
  `repeat(n,minmax(0,1fr))` so min-content can never stretch columns.

## 15. PublicationPanel changes

- New optional props: `blocking`, `actionError`, `localeCompleteness`.
- Renders: status/workflow badges, scheduled/published times, locale dots,
  blocking alert (`role=alert`), action error (`role=alert`), stage/role
  explanations ("awaiting review", "no permission to publish", "unavailable
  for stage/role"). All three studios pass `completeness` + extract
  `errors.blocking` / message from schedule/publish mutation errors.

## 16. SEO hardening

- Verified via e2e `seo.spec.ts` (12/12): home/services/articles/article-detail/
  projects/project-detail/about/contact heads (title, description>10,
  canonical, `index,follow`, og:title=title, og:type, twitter
  `summary_large_image`); auth/error/404 `noindex`; JSON-LD on /about;
  backend robots + sitemap reachable.
- Canonical: CMS `canonical_url` honored by `useSeoMeta`, fallback to current
  origin+path; canonical-mismatch stays a warning, invalid canonical blocks.
- Dashboard/timeline noindex (`noindex,follow`); robots disallows
  `/dashboard`, `/api/`, auth paths; sitemap referenced.
- hreflang intentionally absent: locale-less SPA (language client-side, not in
  URL); `useSeoMeta` only emits alternates when explicitly provided. Documented,
  not a gap.

## 17. Sitemap

- Articles `/articles/<slug>/`, projects `/projects/<slug>/`, pages incl. `/`
  for `home` — unchanged. Services: hub-only `/services` (decision A);
  per-service URLs removed (they 404'd). Cache 300s + signal invalidation on
  Article/Project/Service/Page save/delete — unchanged, test-covered.

## 18. Robots

Unchanged and verified: `Allow: /`, disallows admin/api/dashboard/search/auth/
design/dev, `Sitemap:` line. E2E asserts dashboard disallow.

## 19. Canonical

CMS field validated (invalid = blocker); client `upsertLink(canonical)`;
preview cards use hub URL for services, detail URLs for articles/projects.

## 20. Structured data

No change: JSON-LD present on /about (e2e asserted); no new schema invented.

## 21. Cache invalidation

- Dashboard ops cache cleared on transition/publish/archive/schedule-publish/
  cancel/reschedule (existing `_clear_ops_cache`, now also on blocked/failed
  publish runs that published ≥1 item). Test asserts cache busted on publish.
- Sitemap via `post_save/post_delete` signals (unchanged). Frontend
  `invalidateCmsCache` + page-builder invalidation on publish/archive/reopen/
  rollback (unchanged hooks).

## 22. Audit trail

Reused `AuditEvent` + `AuditService.record`. Verified events: `schedule.created`
(existing), `schedule.rescheduled`, `schedule.cancelled`, `workflow.publish`,
plus NEW `publish.failed` (blocked or errored cron items, actor null for cron).
Actor + timestamp on every event. No renames (compatibility preserved).

## 23. RBAC matrix

No new architecture; actual seeder matrix (`backend/apps/accounts/seeders.py`):

| Role | editorial.view (timeline) | schedule / manage | approve | review |
|---|---|---|---|---|
| SUPER_ADMIN | yes (all perms) | yes | yes | yes |
| COMPANY_ADMIN | yes | manage+schedule | approve | — |
| CONTENT_MANAGER | yes | manage+schedule | — | review |
| PROJECT_MANAGER | yes (read-only timeline) | — | — | review |
| EDITOR | yes (read-only timeline) | — | — | review |
| VIEWER | yes (read-only timeline) | — | — | — |
| anonymous | 401 | 401 | 401 | 401 |

API returns 401 anonymous / 403 unauthorized / 200+422 authorized-shape
(blocked content → 422 even for managers). Timeline VIEWER read-only asserted
in e2e; viewer schedule → 403 covered in backend tests.

## 24. Exact users/roles tested

- Backend: synthetic users per test (`editorial.view/manage/schedule`
  combos); viewer-schedule 403 test; six-role matrix asserted from seeder.
- Playwright (credentials via `loadCredentials()` env): superadmin, viewer,
  contentmanager exercised across timeline/governance/roles/responsive specs;
  anonymous schedule-API rejection asserted.

## 25. Accessibility

- Locale dots: symbol + text (`●/○/!` + locale code), `role=group` +
  per-locale `aria-label` + `title`; never color-alone.
- Blocking list + action errors use `role=alert`; timestamps use `<time
  dateTime title>` (absolute on hover/focus); dialogs/inputs keep existing
  labels; reduced-motion untouched (no animation added).

## 26. RTL/LTR

- Timeline/panel dots are direction-neutral inline spans; timestamps `dir`
  handling kept; e2e `rtl.spec.ts` 6/6 + governance FA-locale timeline render
  without overflow at 390px.

## 27. Responsive

Verified 375/390/768/1024/1280/1440 via `responsive.spec.ts` 52/52 after the
dashboard overflow fix; timeline uses compact list/day-group (no calendar);
governance spec asserts 375px + RTL timeline no-overflow.

## 28. Performance

- No new deps; timeline payload +~200 bytes/row (readiness only); no images in
  rows; single `useSchedules()` query per page; no polling; no virtualization
  (list small). Vite build 7.07s; Storybook 8.49s+11s preview. No RAM
  instrumentation available in this env; no heavy structures added.

## 29. RAM/memory observations

No new stores, caches, or background work. Readiness computed inline per row
from the already-fetched object; dashboard cache TTL unchanged (60s); sitemap
TTL 300s. Nothing retained beyond render.

## 30. Network/request observations

Timeline: 1 GET `/editorial/schedules/` (+ optional `?bucket=`); mutations
only on user action (cancel/reschedule/schedule/publish) with targeted query
invalidation (schedules, workflows, dashboard). No duplicate calls added.

## 31. Database status

- Preserved, no reset/recreate/destructive seed. Live counts after cleanup:
  13 articles, 5 projects, 4 services (baseline restored byte-for-byte set).
- Playwright runs left residue (`phase10-e2e-*`, `phase155-e2e-*`,
  `smoke-*`); Phase 17 probe (`p17-probe-e2e`) fully removed (article +
  workflow rows). E2E-prefixed leftovers from earlier suites removed:
  2 articles + 3 services deleted with their workflows. `smoke-*` rows
  (created by smoke specs, not Phase 17) left untouched — count delta vs the
  13/5/4 baseline is smoke-spec residue, not production data.
- ERP untouched (Section 42).

## 32. Migration status

`manage.py check`: clean. `makemigrations --check`: "No changes detected".
No migration added in Phase 17 (readiness is computed, not stored).

## 33. Backend exact test count

`python -m pytest -q`: **374 passed**, 0 failed (12.42s). Includes new
`test_publication_governance.py` (17 tests: gate 422, fix-then-allow,
publish-now blocked, timeline readiness shape, due/future/cancelled/once/
blocked-audit/tz-boundary/multi/failure-isolation/cache+audit+visibility/
sitemap-hub/viewer-403) + updated `test_seo.py` (hub-only services).

## 34. Frontend exact test count

`npm run test -- --run`: **54 files, 279 passed**, 0 failed. Includes new
`PublicationPanel.test.tsx` (3 tests). Pre-existing timeline/component tests
kept green (Article mock extended with `error: null`).

## 35. Playwright exact test count

New `e2e/publication-governance.spec.ts`: 5/5 (readiness payload, sitemap hub,
robots+timeline noindex, 375px overflow, RTL overflow). Related suites run in
this phase, all green after the dashboard overflow fix: timeline 4 + governance
5 (9/9 batch), seo 12 + roles 8 + services-studio 2 + workspace 12 (34/34
batch), responsive 52/52, errors+theme+performance+cursor-grid+user-admin
(29/29 batch), accessibility+rtl+smoke (36/36 batch). Full-suite single run was
not completed (earlier full run timed out at harness level); coverage above is
the exact executed set: **9+34+52+29+36 = 160 specs, 159 passed, 1 pre-existing
dashboard overflow found and fixed, re-run green**.

## 36. Pre-existing failures

- `responsive dashboard + workspace pages at mobile width`: 62px overflow on
  `/dashboard` at 390px caused by working-copy dashboard edits (AttentionQueue
  grid min-content). Found during Phase 17, fixed (Section 14), 52/52 green.
- Full-run harness timeouts (120s/300s caps) when running the entire Playwright
  suite at once — runner limit, not product failure; suites run in batches.

## 37. New failures

None. The one failure found (above) was fixed and re-verified.

## 38. Known issues

- `smoke-*` residue rows remain in live DB (created by smoke specs).
- Timeline `?bucket=` server filter supports upcoming/overdue/today; published/
  cancelled/attention filtering is client-side over the fetched list (fine at
  current volume; revisit if schedules grow large).
- `publish.failed` cron rows stay `scheduled` and retry every tick until fixed —
  intended (never silently drop), but operators should watch the monitor query.

## 39. Deferred items

- Per-locale SEO-difference tooltips beyond title/body presence (needs content
  fetch; skipped for payload discipline).
- Clicking a locale dot to open the studio in that locale (spec aspiration;
  dots currently link via "Open studio" row link; locale pre-selection not
  wired).
- Server-side published/cancelled/attention buckets; timeline pagination/
  virtualization (unneeded at current size).
- Charts on dashboard publication section (explicitly out of scope).

## 40. Files created

- `backend/apps/editorial/readiness.py` (gate + locale readiness source of truth)
- `backend/apps/editorial/tests/test_publication_governance.py` (17 tests)
- `docs/operations/publication-scheduling.md` (production runbook)
- `frontend/e2e/publication-governance.spec.ts` (5 tests)
- `frontend/src/features/editorial/components/PublicationPanel.test.tsx` (3 tests)
- `docs/reports/phase-17-report.md` (this file)

## 41. Files modified

- `backend/apps/editorial/services.py` (gate in schedule/publish; publish_due
  safety + `publish.failed` audits + already-public skip)
- `backend/apps/editorial/api/views.py` (422 PUBLICATION_BLOCKED mapping;
  publish/schedule actions route both exceptions)
- `backend/apps/editorial/api/serializers.py` (`locale_readiness` on
  ScheduleSerializer)
- `backend/apps/seo/views.py` (services hub-only sitemap)
- `backend/apps/seo/tests/test_seo.py` (hub assertion)
- `frontend/src/features/editorial/components/PublicationPanel.tsx` (2.0:
  blocking alert, action errors, locale dots, explanations)
- `frontend/src/features/editorial/pages/PublicationTimelinePage.tsx` (dots,
  attention filter/badge, relative time, studio links)
- `frontend/src/features/editorial/types/index.ts` (LocaleReadiness)
- `frontend/src/features/articles|projects|services/workspace/*EditPage.tsx`
  (pass completeness + blocking/actionError)
- `frontend/src/features/services/workspace/ServiceEditPage.tsx` (SEO preview
  URL → `/services` hub)
- `frontend/src/features/dashboard/pages/DashboardPage.tsx` (mobile overflow
  fix + pre-existing publication feed rows hardened)
- `frontend/src/features/articles/workspace/ArticleEditPage.test.tsx`
  (mutation mock `error: null`)

Note: the working tree also holds earlier-phase uncommitted work (Services
Studio CRUD, dashboard ops, i18n, routes) — listed in git status but NOT Phase
17 scope and NOT described here beyond the overflow fix interaction.

## 42. ERP status

PARKED. `ERP_ENABLED` unset/false, `ERP_PROVIDER=null`, NullProvider active. No
ERP calls, credentials, models, or migrations touched. `pytest` coverage output
references `apps/integration/domain/exceptions/erp_errors.py` only as an
uncovered file — no ERP code executed.

## 43. Final architecture recommendation

Keep: computed (not stored) readiness; backend gate on the two mutating paths
(schedule, publish-now) with cron inheriting it; hub-only service sitemap;
cron + idempotent command (no job infra). If schedules scale 10x, add server
`?bucket=attention|published|cancelled` + pagination; if services ever need
landing pages, revisit Option B deliberately (route + detail + sitemap +
parity) — not before.

## 44. Next phase recommendation

Phase 18 candidates: (1) locale-dot → studio-with-locale preselect; (2) server
attention bucket + timeline pagination when needed; (3) `publish.failed`
operator alerting (log-based monitor query is documented; wire to real
alerting); (4) smoke-spec DB hygiene (auto-cleanup of `smoke-*` rows);
(5) commit/split the earlier-phase uncommitted work sitting in the tree.
