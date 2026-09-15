# Phase 18 Report — Publication Governance Hardening + Production Audit + Repository Hygiene

Date: 2026-09-14. Hardening phase: no new feature domain, no migrations, no new
infrastructure (no Celery/Redis/email), no new roles, ERP parked.

> No credentials, secrets, password hashes, or tokens appear in this report.

---

## 1. Executive summary

- Closed all four Phase 17 deferred items: locale-dot preselect, server
  attention bucket + pagination, `publish.failed` operator alerting, smoke DB
  hygiene (the earlier-phase uncommitted tree is classified in §12, not
  committed — committing other phases' work is out of scope for hardening).
- Found and fixed two real gaps the Phase 17 report missed: studio
  schedule/publish mutation errors never surfaced blocking issues (wrong error
  shape read), and global search emitted dead `/services/:slug/` URLs against
  the section-based decision.
- Found and fixed one real responsive bug: workspace tables overflowed 253px
  at 390px (`max-w-[24rem]` title cell); 52/52 green after fix.
- Full verification: backend **382 passed**, frontend **286 passed / 56 files**,
  typecheck clean, ESLint clean, Vite build clean, Storybook build clean,
  Playwright **166 passed** across 6 batches (1 real pre-existing bug found
  and fixed, 1 visual flake re-run green).
- DB: 7 articles (6 demo published + pre-existing `t1` draft), 5 projects,
  4 services, 2 workflows, 1 far-future schedule, 7 users, all roles intact.

## 2. Initial audit

Verified Phase 17 claims against code before coding: readiness gate
(`readiness.py`), `publish_due()` safety, 422 mapping, `locale_readiness`
payload, sitemap hub, PublicationPanel 2.0, timeline filters, dashboard ops,
RBAC seeder, cache invalidation, runbook — all accurate. Two gaps found:

1. `ArticleEditPage` / `ProjectEditPage` / `ServiceEditPage` read
   `(scheduleMut.error ?? publishMut.error).errors.blocking`, but axios
   rejects with `{ response: { data: <envelope> }, message }` — `errors` is
   undefined on the rejection. Blocking alerts **never rendered**; generic
   action errors also lost. Fixed with shared `scheduleActionError()`.
2. `apps/search/services.py` emitted `url: "/services/{slug}/"` for service
   hits — dead links (no such route). Fixed to `/services` hub.

Git before: 30 modified files (earlier-phase work: services studio CRUD,
dashboard ops, i18n, routes), `db.sqlite3` modified, 21 untracked Phase 15.5–17
files. Migration check clean, Django check clean.

## 3. Deferred-item closure

| Phase 17 deferred item | Status |
|---|---|
| Locale-dot → studio preselect | Done (§4) |
| Server attention bucket + pagination | Done (§5–6) |
| `publish.failed` alerting | Done (§8) |
| Smoke DB hygiene | Done (§10) |
| Earlier-phase uncommitted work | Classified, NOT committed (§12) |

## 4. Locale deep-link implementation

- Shared helper `frontend/src/shared/lib/studioLocale.ts`:
  `studioLocaleFromSearchParams()` (validates `fa/en/ar`, safe fallback) +
  `studioPathWithLocale()`. No new routing system.
- All three studios (`ArticleEditPage`, `ProjectEditPage`, `ServiceEditPage`)
  initialize `editingLocale` from `?locale=` with fallback to UI language.
  Refresh-safe (param stays in URL), RTL/LTR unchanged, permissions unchanged
  (route guards still authoritative).
- Timeline `LocaleDots` are now per-locale links:
  `/dashboard/articles|projects|services/:id/edit?locale=<clicked>`.
- Tests: `studioLocale.test.ts` (3), timeline test asserts FA dot href.

## 5. Timeline server-side filtering

- `ScheduleViewSet` buckets: `upcoming`, `today`, `overdue` (existing) +
  `attention`, `published`, `cancelled`, `done` (new). Unknown bucket →
  unfiltered (unchanged behavior).
- `attention` = overdue OR unresolved failed publication OR blocking health
  (same `blocking_issues()` gate as schedule/publish — server authoritative).
- Failure resolution: latest `publish.failed` per workflow clears on the next
  `workflow.publish` (grouped MAX queries, no per-row cost).
- Frontend keeps only client-side text search over the fetched page (no
  server text search exists for schedules); all bucket filtering is server-side.

## 6. Timeline pagination

- List uses project-default `DefaultPagination` (page/page_size, envelope
  `{data, pagination}` — no second pagination system).
- `GET /editorial/schedules/counts/` returns header badges
  (total/scheduled/upcoming/overdue/today/attention/published/cancelled/failed)
  without row payload.
- Frontend: `useSchedulePage({bucket, page, pageSize: 20})` + existing
  `Pagination` component; counts drive badges.
- Measured (5-row fixture): list 8 queries / ~3.4 KB; attention 10 queries /
  152 B (empty); counts 19 queries / 164 B; dashboard 46 queries / ~4.4 KB.
  No virtualization (unneeded at this volume).

## 7. Attention bucket

See §5. Dashboard AttentionQueue gains a `failedPublications` entry;
publication section gains a `Failed` tile + failed-rows card linking to the
timeline. Timeline rows show `Needs attention` + `Failed — fix & retry` badges
with the last-failure reason inline (`role=alert`).

## 8. Failed publication alerting

Lightweight, no new infrastructure:

1. Dashboard attention item + failed card (§7).
2. Timeline attention state + failure badge + reason (§7).
3. Retry/error state: `has_failed`, `last_failed_at`, `last_failed_details`
   on every schedule row (annotated in one query; direct fallback for nested
   serialization).
4. Structured logs unchanged (warn line with id + reason, no secrets).
5. Audit visibility unchanged (`publish.failed` via existing `AuditEvent`).
6. Toasts (existing `ToastProvider` — no second system) on timeline
   reschedule/cancel success/failure.

## 9. Retry behavior

Final semantics (also written into `docs/operations/publication-scheduling.md`):

- Failed rows stay `scheduled`, retry each tick by design. Safe: idempotent
  publish, per-item try/except, already-public skip, cancelled never re-run.
- `PUBLISH_DUE_BATCH_SIZE = 50` (oldest-due first): bounds per-tick DB work
  when broken schedules pile up; leftovers retry next tick. No job queue.
- Successful retry (cron or manual publish) clears the actionable failure
  state everywhere (dashboard, timeline, counts). Tested.

## 10. Smoke DB hygiene

Backup: `backend/backups/db-phase18-pre-hygiene.sqlite3` (taken before any
mutation). Findings:

- 6 `smoke-*` draft articles: accidental E2E residue (never published, no
  schedules, 5 workflow-less, 1 with an empty draft workflow). Hard-deleted
  with the one empty workflow.
- 29 orphan `ContentWorkflow` rows pointing at hard-deleted articles
  (ids 10–17, 19–29, 34–39, 41–43, 45) from earlier E2E runs, including stale
  Phase 17 probe schedules. Deleted (cascade removed 2 schedules + 27 audits).
- `t1` (id 7, draft, far-future schedule 2099): pre-existing live-DB content,
  NOT smoke residue — left untouched.
- All 6 demo users + `admin` intact, roles intact, demo content intact.
- E2E residue created during THIS phase (1 `phase10` article + 1 `phase155`
  service) cleaned immediately after the creating batch.
- After: 7 articles, 5 projects, 4 services, 2 workflows, 1 schedule
  (far-future), 21 audits, `manage.py check` clean, `publish_due()` dry run = 0.

## 11. Git/repository hygiene

- Inspected `git status` / `diff --stat` / untracked. Classification:
  1. intended project work (Phase 15.5–17 features + Phase 18 changes),
  2. no generated giant artifacts in tree (`dist/`, `storybook-static/` are
     build outputs; `node_modules/`, caches untracked-but-ignored),
  3. no secrets found in diff,
  4. `backend/db.sqlite3` modified (expected: hygiene + E2E churn),
  5. temp probe files kept OUT of repo (`C:\Users\USER~1.RD-…\Temp\opencode\`),
     one throwaway E2E probe spec removed after use.
- Did NOT commit: committing earlier phases' uncommitted work is explicitly
  out of scope and unsafe to bundle blindly. Nothing deleted irreversibly.

## 12. Publication state machine

Content status (`PublishableModel`): `draft → review → published → archived`
(4 values; no separate approved/scheduled/cancelled/rejected content states).

Workflow stages (7, `seed_workflow_stages`): draft → in_review → seo_review →
approved → scheduled → published → archived. `publishing` exists as a
schedule-status choice but is never written by code (dead choice value).

## 13. State transition matrix

| From → To | Actors (perm) | Gate | Audit | Side effects |
|---|---|---|---|---|
| draft → in_review | manage | — | workflow.transition + revision + approval row | cache clear, status→draft |
| in_review → seo_review | manage | pending approval must be decided | same as above | same |
| seo_review → approved | manage | pending approval must be decided | same | same |
| any → draft (back) | manage | always allowed | same | same |
| approved → scheduled | schedule/manage | **readiness gate (422)** | schedule.created + transition | schedule row, cache clear |
| scheduled → published (cron) | system | **readiness gate**; blocked → publish.failed | workflow.publish or publish.failed | status→published + public, cache + sitemap |
| scheduled/approved → published (now) | schedule/manage | **readiness gate (422)**; soft bypasses | workflow.publish | same as cron |
| published → archived | schedule/manage | published only | workflow.archive | status→archived, cache + sitemap |
| archived → draft | schedule/manage | archived only | workflow.transition | status→draft |
| scheduled → cancelled | schedule/manage | scheduled only | schedule.cancelled | cache clear; never retries |
| scheduled → rescheduled | schedule/manage | scheduled + future time | schedule.rescheduled | cache clear |

Invalid transitions tested: viewer schedule → 403, anonymous → 401,
cancelled reschedule → 400, past reschedule → 400, blocked schedule/publish
→ 422, publish from draft → 400, archive from non-published → 400,
double publish → idempotent (0 on re-run).

## 14. Content/public consistency

- Scheduled ≠ visible: public querysets filter `status=published +
  is_public` (+ `is_active`); schedule rows never affect public reads.
- Cancelled never publishes (`publish_due` filters `status=scheduled` only).
- Already-public content hit by cron marks schedule done without republish.
- Locale behavior unchanged (client-side locale over published content).
- Cache: dashboard cache cleared on transition/publish/archive/schedule/
  cancel/reschedule (+ blocked/failed runs that published ≥1); sitemap via
  model signals; frontend CMS cache invalidated on publish/archive/reopen/
  rollback hooks.

## 15. Service architecture final decision

**OPTION A confirmed and now enforced everywhere**: services are sections of
the `/services` hub. No `/services/:slug` route, no detail component, no
internal per-service links (studio workspace links to `/services` hub).
Phase 18 closed the last violation: global search emitted
`/services/{slug}/` (404) — now returns `/services`. Sitemap hub-only
(unchanged), studio SEO preview → hub (unchanged), studio preview renders
section parity (unchanged). No Option B work started.

## 16. SEO consistency

E2E `seo.spec.ts` 12/12: home/services/articles/article-detail/projects/
project-detail/about/contact heads (title, description, canonical,
`index,follow`, OG, twitter); auth/error/404 noindex; JSON-LD on /about;
robots + sitemap reachable. Stored meta/canonical preferred with locale
fallbacks. No SEO invented for services beyond the hub. Timeline/dashboard
`noindex,follow`. hreflang intentionally absent (locale-less SPA, documented).

## 17. Cache invalidation

Audited §14 list. No new cache system. Sitemap 300s + signal invalidation;
dashboard 60s + `_clear_ops_cache` on all mutating paths. Timeline uses
30s-stale query cache with invalidation on cancel/reschedule/schedule. No
stale-content path found.

## 18. RBAC matrix

Backend authoritative (frontend capabilities are UX-only). Seeder truth:

| Role | view (timeline) | schedule/manage | approve | review |
|---|---|---|---|---|
| SUPER_ADMIN | yes | yes | yes | yes |
| COMPANY_ADMIN | yes | manage+schedule | approve | — |
| CONTENT_MANAGER | yes | manage+schedule | — | review |
| PROJECT_MANAGER | yes read-only | — | — | review |
| EDITOR | yes read-only | — | — | review |
| VIEWER | yes read-only | — | — | — |
| anonymous | 401 | 401 | 401 | 401 |

Staff-gated CMS writes (`IsStaffOrReadOnly`) additionally reject non-staff
regardless of editorial perms. Dashboard endpoint staff-only (403 non-staff).

## 19. Security tests

Backend: anonymous schedule/counts/dashboard → 401; viewer schedule/cancel →
403; viewer reads allowed; staff write matrix in existing suites. Playwright:
six-role flow 8/8, viewer read-only timeline (no Cancel/Reschedule buttons),
anonymous API rejection, session-expiry redirect, 401/403 error page. No
privilege escalation found. No secrets in logs/reports/payloads (dashboard
secrets test passes).

## 20. Error UX

- `PUBLICATION_BLOCKED` (422): panel alert lists per-locale field + human
  message + how-to-fix ordering (missing title/body/slug/canonical); action
  links unchanged (studio fields adjacent). No backend internals exposed.
- Timeline mutations toast success/failure via existing provider; row-level
  failure reasons inline with `role=alert`.
- Existing global handling reused for 401/403/404/409/422/429/500
  (`toApiError` + AxiosProvider + route fallbacks). No duplicate system.

## 21. Accessibility

Axe 13/13 (9 public pages + H1/landmarks/labels/alt). Timeline: locale dots
are links with full `aria-label` + `title` (never color-only: symbol +
locale code + state word); failure text in `role=alert`; times in `<time
dateTime title>`; Pagination has nav label + aria-current; dialogs/inputs
keep labels; reduced-motion untouched.

## 22. RTL/LTR

RTL suite 6/6 (FA/AR direction, workspace, no backend leaks, locale parity).
Timeline dots/dates direction-neutral; phase spec asserts FA timeline +
dashboard render without overflow. Studios edit RTL locales with `dir=auto`.

## 23. Responsive

Verified 375/390/768/1024/1280/1440 via responsive suite 52/52 after fix.
Fix: workspace tables (`Articles/Projects/ServicesWorkspacePage`) — title
cell `max-w-[24rem]` forced 645px min-content at 390px; constrained to
`max-w-[10rem]` on mobile + `max-w-0` cell so truncate works. Pre-existing
file (untouched by my changes), data-dependent — found by this phase.

## 24. Performance

- Timeline: 1 paginated GET + 1 counts GET; compact rows (readiness ≤3 short
  strings/locale, failure fields only when annotated); no images; no polling;
  lazy chunk 9.24 kB (~3.4 kB gzip). Measured §6.
- Dashboard: 1 cached GET (60s). No new deps, stores, or clients.
- Vite build 8.41s; Storybook 12.57s build (+17s preview). Pre-existing
  dynamic-import chunking notice remains (cosmetic).

## 25. RAM observations

No new stores/caches/background work. Readiness computed inline from
already-fetched objects; annotations are per-list-query (freed after
response); pagination bounds retained rows (20/page). Nothing retained
beyond render.

## 26. API/network observations

Timeline: `GET /schedules/?bucket=&page=&page_size=` + `GET
/schedules/counts/`; mutations POST cancel/reschedule/schedule/publish with
targeted invalidation (schedules, workflows, dashboard). No duplicate calls,
no polling, no second client.

## 27. Database status

7 articles (6 demo published + `t1` draft), 5 projects, 4 services, 2
workflows, 1 schedule (id 1, far-future 2099, workflow 1), 21 audits, 7 users.
`publish_due()` dry run publishes 0. Backup
`backend/backups/db-phase18-pre-hygiene.sqlite3` retained. No reset/flush/
password changes.

## 28. Migration status

`manage.py check`: clean. `makemigrations --check`: "No changes detected".
No migration added (readiness/failure state computed, not stored).

## 29. Backend exact test count

`python -m pytest -q --no-cov`: **382 passed**, 0 failed (~13s). Includes new
`test_timeline_attention.py` (8 tests) + existing governance (17) + schedule
ops (4) + search/seo (23).

## 30. Frontend exact test count

`npm run test -- --run`: **56 files, 286 passed**, 0 failed. Includes new
`studioLocale.test.ts` (3) + `scheduleActionError.test.ts` (3) + extended
timeline test (3, incl. locale-href + failure badge).

## 31. Playwright exact test counts by batch

| Batch | Specs | Result |
|---|---|---|
| publication-hardening (new) | 6 | 6 passed |
| timeline + governance | 9 (4+5) | 9 passed |
| seo + roles + services-studio + workspace | 34 (12+8+2+12) | 34 passed |
| responsive | 52 | 51 passed + 1 failed (overflow, fixed) → re-run 52/52 |
| errors + theme + performance + cursor-grid + user-admin | 29 | 28 passed + 1 visual flake → re-run green (29/29) |
| accessibility + rtl + smoke | 36 | 36 passed |
| **Total** | **166** | **165 passed, 1 fixed, 1 flake re-run green** |

No full single run (harness timeouts, as in Phase 17). Batches above are the
exact executed set.

## 32. Pre-existing failures

- Workspace table overflow at 390px (`/dashboard/articles`, 253px): file
  untouched by earlier phases' diffs in this area; data-dependent. Fixed §23.
- Cursor-grid scroll-story visual threshold (0.97 vs 1.03): known unstable
  animation assertion (also noted Phase 16); passes in isolation; unrelated
  files untouched.

## 33. New failures

None. The two failures observed during the phase (above) were a real
pre-existing bug (fixed) and a visual flake (re-run green).

## 34. Known issues

- `publishing` schedule-status choice is never written (dead value; harmless).
- Vite dynamic-import chunking notice for `editorial/api` (cosmetic,
  pre-existing; now one more static importer).
- Full single-run Playwright exceeds harness time — batches remain the method.

## 35. Deferred items

- Charts on dashboard publication section (out of scope since Phase 17).
- Per-locale SEO-difference tooltips beyond presence (payload discipline).
- Timeline virtualization (unneeded: paginated, 20/page).
- Committing the earlier-phase uncommitted tree (needs owner triage per
  phase, not a blind bundle).
- `og_image` picker in studios (backend field exists; reuses cover).

## 36. Files created

- `backend/apps/editorial/tests/test_timeline_attention.py` (8 tests)
- `frontend/src/shared/lib/studioLocale.ts` (+ `studioLocale.test.ts`)
- `frontend/src/features/editorial/api/scheduleActionError.test.ts`
- `frontend/e2e/publication-hardening.spec.ts` (6 tests)
- `docs/reports/phase-18-report.md` (this file)

## 37. Files modified

- `backend/apps/editorial/api/views.py` (buckets, pagination, counts,
  failure annotation helpers, attention logic)
- `backend/apps/editorial/api/serializers.py` (`has_failed`,
  `last_failed_at`, `last_failed_details`)
- `backend/apps/editorial/services.py` (`PUBLISH_DUE_BATCH_SIZE`, batch cap)
- `backend/apps/core/services/dashboard.py` (`failed_count`, `failed` briefs)
- `backend/apps/search/services.py` (service hits → `/services` hub)
- `docs/operations/publication-scheduling.md` (Phase 18 retry semantics)
- `frontend/src/features/editorial/{api,hooks,types,pages/PublicationTimelinePage}`
- `frontend/src/features/{articles,projects,services}/workspace/*EditPage.tsx`
  (locale preselect + fixed error extraction)
- `frontend/src/features/articles|projects|services/workspace/*WorkspacePage.tsx`
  (mobile table overflow fix)
- `frontend/src/features/dashboard/{pages/DashboardPage,types.ts}` (failed surfacing)
- `frontend/src/i18n/locales/{en,fa,ar}/translation.json` (6 new keys)
- `frontend/src/features/editorial/pages/PublicationTimelinePage.test.tsx`

Note: the tree also holds earlier-phase uncommitted work (listed in §11);
only the files above are Phase 18 scope.

## 38. Git status before/after

- Before: 30 modified + 21 untracked (Phase 15.5–17 work + dirty DB).
- After: 33 modified (Phase 18 edits + `db.sqlite3` hygiene) + 26 untracked
  (+5 Phase 18 files). Full lists captured during the phase; no commits made
  (out of scope), no irreversible operations, no secrets in diff.

## 39. ERP status

PARKED. Live config: `ERP_ENABLED=False`, `ERP_PROVIDER=null`
(NullProvider). No ERP calls, credentials, models, or migrations touched.

## 40. Final production-readiness assessment

Publication governance is now shippable: server-authoritative attention +
pagination, visible failure lifecycle with safe retries, locale-preselect
deep links, fixed error surfacing, hub-consistent services + search, clean DB,
RBAC verified end-to-end, responsive/accessibility/SEO green, no new
infrastructure or migrations. Remaining work is presentation polish, not
governance.

## 41. Next phase recommendation

Phase 19 — final production/presentation quality: dashboard publication
charts (if wanted), `og_image` picker, dead `publishing` choice cleanup,
owner-triaged commits of the earlier-phase tree, production cron wiring,
full-batch Playwright re-run on a staging clone.
