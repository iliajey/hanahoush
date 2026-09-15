# Phase 21 Report — Finalization Hardening, Studio Papercuts & Publication Operations

Date: 2026-09-14. Hardening phase: no new CMS/editor/publication/search/RBAC/analytics/API/SEO system, ERP parked.

> No credentials, secrets, password hashes, or tokens appear in this report.

---

## 1. Executive summary

Closed the five Phase 20 leftovers without expanding scope: **dirty guard** is now a shared `useDirtyGuard(dirty)` hook (correct `beforeunload` with `returnValue`) wired into all three studios; **dead `publishing` schedule status removed** from model + frontend type with migration `editorial/0002` (zero rows existed, no logic touched); **Service icon picker** is a small curated Select (11 Lucide keys, preview, clear, FA/EN/AR) reusing the existing `sectionIcon` map — public hub already consumed the value; **OG image picker** is a reusable `OgImageField` (choose/replace/remove, MediaPicker reuse, cover fallback) wired into Article/Project/Service studios with backend read path fixed (Service list/detail now expose `og_image`); **`publish_due()` ops** verified on an isolated staging lifecycle (publish, idempotency, failure isolation, retry, cancel) with the existing `*/2 * * * *` cron runbook confirmed accurate. Full verification: backend **385 passed**, frontend **306 passed / 61 files**, typecheck/lint/vite/storybook clean, Playwright batches all green (one flaky axe contrast failure passed on rerun).

## 2. Git/repository tree audit

Working tree at start: **49 modified + 47 untracked** (96 entries, nothing staged — `git log` head is `d5cfd71 phase15`, so phases 16–20 work was never committed in this environment).

### Modified (49)

Backend (10 + DB): `core/services/dashboard.py`, `editorial/api/{serializers,views}.py`, `editorial/{models,services}.py`, `search/services.py`, `seo/{views,tests/test_seo}.py`, `services/api/{serializers,viewsets}.py`, `db.sqlite3` (binary, runtime artifact — do NOT commit).

Frontend (39): layouts (`Navbar`, `StaffSidebar`), routes, workspaceConfig + nav test, ui (`content-health`, `dialog`, `index`, `toast`), articles (`api/staff`, EditPage + test, PreviewPage, WorkspacePage), auth (`capabilities`, `AuthProvider`, authorize test), cms/seo index, dashboard (page + types), editorial (api/hooks/types/components index), media (MediaPicker + test), page-builder `common.tsx` (Phase 21: `SERVICE_ICON_KEYS` export), projects (Edit/Preview/Workspace pages), search (SearchCommand + index + test), services index, i18n FA/EN/AR, shared hooks index.

Phase 21 files inside the modified set: `editorial/models.py` (dead status cut), `editorial/types/index.ts` (union cut), `services/api/{serializers,viewsets}.py` (og_image read + select_related), `page-builder/common.tsx` (icon keys), 3 studio EditPages (dirty guard + OG), `cms/seo/index.ts` + `SeoPreview.tsx` (image prop), `articles/services api/staff.ts` (og_image detail type), translations (og/icon/clear keys), shared hooks index. The rest is uncommitted phases 16–20 work.

### Untracked (47)

Phase 21 new: `editorial/migrations/0002_alter_publicationschedule_status.py`, `shared/hooks/useDirtyGuard.{ts,test.ts}`, `services/workspace/ServiceIconPicker.{tsx,test.ts}`, `cms/seo/{OgImageField.tsx,OgImageField.test.tsx,SeoPreview.tsx}`, `services/tests/test_phase21_hardening.py`.

Earlier phases (keep, commit per §3): `editorial/{readiness.py,tests/test_publication_governance.py,test_schedule_ops.py,test_timeline_attention.py}`, `services/tests/` dir, `docs/operations/` (runbook), `docs/reports/phase-{15.5,16,17,18,19,20}-report.md` + user guide, e2e `phase19-personality/phase20-workflow/publication-{governance,hardening,timeline}/services-studio` specs, `CreditsPage`, `health-indicator`, `SeoPreview.tsx` (pre-existing untracked, Phase 21 extended it), `seoHealth.{ts,test.ts}`, dashboard `Phase19.test/SystemPulse/TodayCard`, `scheduleActionError.test`, editorial `Countdown/PublicationPanel(+test)/PublicationTimelinePage(+test)`, search `CommandCenter.test/KeyboardShortcutsDialog/commands.ts`, `services/{api,hooks,workspace}/` dirs, `useHomeClickEgg`, `studioLocale.{ts,test.ts}`.

### Classification (A–H)

- **A. Required production work**: all backend `apps/` source + migrations (incl. 0002), all frontend `src/` source + i18n, e2e specs listed above, `docs/operations/publication-scheduling.md`.
- **B. Documentation/report**: `docs/reports/phase-*.md` (15.5–21) + user workflow guide.
- **C. Test infrastructure**: `*.test.ts(x)` / `test_*.py` files listed above.
- **D. Generated/build — DO NOT commit**: `dist/`, `storybook-static/`, `node_modules/`, `__pycache__/`, `.pytest_cache/`, coverage, `e2e-artifacts/`, `test-results/`, `*.log`.
- **E. Local/developer-only**: `.env` files, `.vscode/`, editor temp files.
- **F. Database/runtime — DO NOT commit**: `backend/db.sqlite3`, `*.bak.*`, `backups/`, `media/` uploads.
- **G. Temporary residue**: `C:/Users/USER~1.RD-/AppData/Local/Temp/opencode/staging21.*` (outside repo), `pw21*.log` (outside repo).
- **H. Unclear**: none — every entry classified above.

## 3. Commit classification (recommended groups; NOT committed here)

No commits created in this environment (head is `phase15`; owner decides push/remote). Recommended logical groups when the owner commits:

1. **Phase 16–18 publication governance** (readiness gate, schedule ops, timeline attention, runbook, related e2e + backend tests).
2. **Phase 19 studio/search/dashboard** (studios, command center, SystemPulse/TodayCard, search, i18n bulk).
3. **Phase 20 workflow hardening** (MediaPicker footer, dialog bound, false-toast fix, preview links, PublicationPanel tests).
4. **Phase 21 studio/UX fixes** (dirty guard, icon picker, OG picker, SeoPreview image, Service og read path, translations, new tests).
5. **Phase 21 dead-status migration** (`editorial/0002` + model/type cuts) — separate so it can be reviewed/rolled back alone.
6. **Docs** (phase reports 15.5–21 + user guide).

Do NOT stage: `db.sqlite3`, `dist/`, `storybook-static/`, `node_modules/`, logs, `e2e-artifacts/`, `test-results/`, `.env`.

## 4. Studio papercuts found

Prior audit (Phase 20 §7–8) already fixed the P0/P1 items. Remaining small issues triaged this phase; fixed only the concrete ones:

- **Fixed**: beforeunload missing `returnValue` (Chrome prompt unreliable) → shared hook.
- **Fixed**: icon free-text with silent fallback → curated picker with preview + clear.
- **Fixed**: OG image unwritable (payload never sent, health used cover fallback) → real picker + payload + hydration + health target.
- **Fixed**: Service detail/list never returned `og_image` despite model + write serializer → read path added.
- **Verified, left as-is**: save-button pending scope, autosave silence, excerpt FieldError gaps, gallery hover actions, hardcoded robots preview, workflowId-0 binding — all pre-existing, none blocks the journey, no redesign per phase rules.

## 5. Dirty-state guard

- **Implemented**: `frontend/src/shared/hooks/useDirtyGuard.ts` — subscribes to `beforeunload` only while `dirty`, sets `preventDefault + returnValue=""`, cleans up on save/unmount. Wired into Article/Project/Service studios (replacing three hand-rolled handlers that omitted `returnValue`).
- **Verified**: unit test (`useDirtyGuard.test.ts`) asserts listener added only when dirty, removed on unmount. Full suites green.
- **Documented limitation**: guards browser refresh/tab-close only. In-app SPA navigation (React Router v6 data-router without `useBlocker`) is NOT intercepted — same limitation noted in Phase 20 §7. Dirty badge + 30s silent autosave mitigate; a full in-app blocker needs router-design work, intentionally deferred rather than hacked.

## 6. Dead `publishing` status decision

- **Removed.** `PublicationSchedule.STATUS_CHOICES` had `("publishing", "Publishing")` with zero writers/readers: services only write `scheduled/published/cancelled`, views filter/count only those, frontend Timeline buckets never reference it, no test references it.
- Changes: `backend/apps/editorial/models.py` (choice removed) + migration `0002_alter_publicationschedule_status` (AlterField, choices-only — no data change) + `frontend/.../editorial/types/index.ts` union member removed.
- Safety: baseline had 0 `publishing` rows (only 1 `scheduled` far-future row); Django choices impose no DB CHECK so no historical data breaks. `makemigrations --check` clean after, `manage.py check` clean, backend 385 green.
- False positives kept: i18n `"publishing"` labels, `CommandCategory="publishing"`, docstrings — UI strings, not the status value.

## 7. Service icon picker decision/implementation

- Backend already had `Service.icon` CharField + write serializer + public list exposure — no migration needed.
- **Implemented** `ServiceIconPicker.tsx`: Select over exported `SERVICE_ICON_KEYS` (11 keys from the existing `ICON_MAP` in `common.tsx`), live Lucide preview via `sectionIcon`, "No icon" option, clear button, FA/EN/AR labels (`form.noIcon`, `common.clear`), keyboard accessible (Radix Select), mobile/RTL safe. Payload normalized with `trim().toLowerCase()`.
- Public hub already consumed `service.icon` via `mapServices → sectionIcon` — no section-architecture change, no new route.
- **Verified**: `ServiceIconPicker.test.ts` (3 tests) + backend hardening test (icon round-trip) green.

## 8. OG image picker decision/implementation

- Backend already had `og_image` FK on Article/Project/Service + write serializers + article/project detail reads. Gap: Service list/detail never returned it; frontend never sent it (payloads omitted, hydration omitted, health faked it from cover).
- **Implemented** `OgImageField.tsx` (label + choose/replace + 1200/630 preview + remove + empty-state hint, FA/EN/AR) reusing `MediaPicker`; wired into all three studios (state, `pickerMode:"og"`, hydration from `detail.og_image`, payload `og_image: ogId`, snapshot/dirty inclusion, `FieldError`, `SeoPreviewCard image={ogPreview ?? coverPreview}` with cover fallback preserved). `SeoPreview` renders the social image when present. Health `og` target now points at the real field (`article-og/project-og/service-og`).
- Backend fix: `ServiceListSerializer` (+detail via inheritance) exposes `og_image {id,file}`; viewset `select_related` extended. No migration (field pre-existed).
- **Verified**: `OgImageField.test.tsx` (2 tests) + existing `seoHealth.test.ts` + backend hardening test green; typecheck/lint/build clean.

## 9. `publish_due()` audit

`ScheduleService.publish_due(batch_size=50)`: filters `status=scheduled, scheduled_for<=now`, oldest-first, slices 50; per-item try/except (`PublicationBlocked` → `publish.failed` audit + warn log, stays `scheduled` for retry; `WorkflowError` same); already-public content marked `published` without republish; success clears dashboard ops cache; sitemap invalidates via model signals; `publish_scheduled` command prints `Published N`. No engine rewrite. Batch cap 50 confirmed in code and at runtime (`__defaults__ == (50,)`).

## 10. Cron/scheduler wiring

No new wiring needed — the existing runbook (`docs/operations/publication-scheduling.md`, Phase 18) is accurate and was re-verified: `*/2 * * * * …/manage.py publish_scheduled`, UTC storage + `timezone.now()` comparison (DST-safe), overlap-safe (second run finds `published`), no Celery/Redis introduced. Minor Phase 21 touch: runbook header notes re-verified status. Deploy step remains: paste the cron line on the host (`crontab -e`); disable by commenting it out.

## 11. Staging clone verification

Strategy: copied `backend/db.sqlite3` → `Temp/opencode/staging21.sqlite3` for reads; ran the lifecycle as isolated Django test transactions (baseline untouched, torn down by the test runner).

1. Scheduled healthy content in the past → `publish_due()` published 1. ✅
2. Reran → 0 (idempotent). ✅
3. Broken content (missing slug/title/body) + healthy sibling in one tick → sibling published, broken stayed `scheduled` (failure isolated). ✅
4. Failure surfaced via `publish.failed` audit + warning log. ✅
5. Retry semantics: broken row stays `scheduled` for next tick. ✅
6. Cancelled schedule never published; rerun returns []. ✅
7. Future schedule (id 1, year 2099) untouched — `publish_scheduled` prints `Published 0`. ✅
8. Cache cleared on success (`_clear_ops_cache` in publish path); sitemap signals wired. ✅
9. Audit records correct (`workflow.publish` / `publish.failed` / `schedule.cancelled`). ✅

Baseline after: articles 8, projects 5, services 4, workflows 3, schedules 1 (`scheduled`), users 7 — intact.

## 12. Article workflow verification

Dashboard → Articles → Create → locale FA/EN/AR → content → cover + OG pickers → SEO → Save → Preview → Submit → Schedule/Publish → Timeline → Published → public `/articles/:slug`. OG payload/hydration/preview wired; dirty guard active; dead-status removal touches nothing in the path. E2E `workspace` + `phase20-workflow` + `publication-*` batches green.

## 13. Project workflow verification

Same pipeline with case-study + gallery (save-first gate unchanged). OG wired identically. `phase20-workflow` projects-preview spec + publication batches green.

## 14. Service workflow verification

Same pipeline; section picker + new icon picker + cover + OG → hub preview → submit/schedule/publish → Timeline → public `/services` hub. `services-studio` batch green (list/search/filter/create round-trip + restricted-role check).

## 15. RBAC verification

No permission changes. Backend authoritative; `user-admin` + `roles` E2E batches green; workspace restricted-role specs green; viewer read-only timeline intact. Six roles (SUPER_ADMIN, COMPANY_ADMIN, CONTENT_MANAGER, PROJECT_MANAGER, EDITOR, VIEWER) behave as in Phase 20.

## 16. Responsive verification

375/390/768/1024/1280/1440 via `responsive` suite + picker specs; new pickers use existing responsive primitives (Select, grid, aspect-ratio image) — no overflow introduced. `responsive` batch green.

## 17. RTL/LTR verification

FA/AR RTL + EN LTR: pickers use logical layout + `dir` attrs; `rtl` suite green; new i18n keys present in all three locales.

## 18. Accessibility verification

`accessibility` batch: 71/72 on first run (one axe `color-contrast` failure on public `/articles`), **fully green on rerun** — pre-existing theme contrast flake, no Phase 21 file touches public article markup (verified via diff). Dialogs keep Radix trap + labels; pickers keyboard navigable; alerts/roles preserved; reduced motion untouched.

## 19. Performance verification

No new dependencies; no polling/timers added (autosave unchanged); React Query/cache architecture kept. Build output stable (ArticleEdit ~17.9kB, ServiceEdit ~18kB, ProjectEdit ~31.7kB gzippes ~5.7/5.7/8.6kB — no unexpected growth).

## 20. Backend tests

`python -m pytest backend -q`: **385 passed** (was 382; +3 new Phase 21 hardening tests). `manage.py check`: clean. `makemigrations --check --dry-run`: no changes (0002 applied). `showmigrations editorial`: 0001 + 0002 applied.

## 21. Frontend tests

`npm run test -- --run`: **61 files, 306 passed** (was 58/300; +3 files/+6 tests: dirty guard, icon keys, OG field). `typecheck` PASS, `lint` PASS, `vite build` PASS, `storybook build` PASS.

## 22. Playwright tests

Real Edge/Chromium headless vs `localhost:5173 ↔ 127.0.0.1:8000`, batched:

| Batch | Result |
|---|---|
| phase20-workflow + services-studio | EXIT 0 |
| publication hardening/timeline/governance | EXIT 0 |
| workspace + smoke + seo | EXIT 0 |
| rtl + accessibility + responsive (rerun a11y alone) | 71 passed + 1 flaky contrast → EXIT 0 on rerun |
| user-admin + roles + media | EXIT 0 |

No failures outstanding.

## 23. Database status

Intact: articles 8, projects 5, services 4, workflows 3, schedules 1 (far-future `scheduled`), users 7. Staging used a file copy + test transactions; baseline never written by lifecycle checks. E2E residue: none new (suites reuse fixed slugs/cleanup; Phase 20 residue already cleaned).

## 24. Migration status

One new migration: `editorial/0002_alter_publicationschedule_status` (choices-only AlterField). Applied. `makemigrations --check`: clean. No other migrations. No reset.

## 25. ERP status

**PARKED.** `ERP_ENABLED=False`, `ERP_PROVIDER=null` (`NullProvider`). No Odoo calls, credentials, models, or migrations. No ERP files changed.

## 26. Remaining known issues

- In-app SPA navigation guard (React Router blocker) — documented limitation, needs router design.
- Studio papercut backlog (save-pending scope, autosave error surfacing, gallery hover-on-touch, hardcoded preview robots, workflowId-0 binding) — cosmetic, non-blocking.
- Axe `color-contrast` on public `/articles` flaked once — pre-existing theme tokens, watch in Phase 22.
- Accumulated tree (phases 16–21) still uncommitted — owner decision per §3.
- `db.sqlite3` modified in tree by test/dev runs — must stay untracked.

## 27. Exact recommended next phase

**Phase 22 — commit triage + papercut polish + contrast fix.** Owner commits the §3 groups; then: in-app router blocker design (only if router work is approved), gallery touch actions, save-pending scope, autosave error toast, preview robots per status, `workflowId` hook guard, and the `/articles` contrast token fix. No new domains, no architecture restart, ERP stays parked.

---

## Final user-level summary

**Can a normal Hanahoush staff user now create, edit, preview, review, schedule and publish Articles, Projects and Services without getting stuck?**

**Yes.** Path (all three content types): Dashboard → workspace list → New/Edit → pick locale FA/EN/AR → fill title/slug/body (+ case-study/gallery for projects; section + icon picker for services) → choose cover + social image from media library → check SEO/health → Save (dirty badge clears) → Preview → Submit for review → approvals → Schedule (datetime) or Publish now → Timeline (countdown, retry on failure) → Published → public proof (`/articles/:slug`, `/projects/:slug`, `/services` hub). Refresh/tab-close is guarded when dirty; failures show inline blockers with retry; scheduled publishing runs via cron every 2 minutes.

- **Changed**: shared dirty guard, dead status removal (+migration), service icon picker, OG picker ×3 studios + preview, Service og read path, translations, 4 new test files.
- **Fixed**: unreliable beforeunload, free-text icon fallback, unwritable OG image, missing Service og read, dead status value.
- **Verified**: publish lifecycle on staging clone, full journeys, 6 roles, responsive/RTL/a11y, 385 + 306 tests, all builds, all browser batches.
- **Remains**: in-app nav guard (by design), minor papercut backlog, uncommitted tree (owner commits), one flaky contrast token to watch.
- **Production scheduled publishing**: `*/2 * * * * /srv/hanahoush/backend/venv/bin/python /srv/hanahoush/backend/manage.py publish_scheduled >> /var/log/hanahoush/publish.log 2>&1` (UTC, idempotent, cap 50, failures retry with audit). Details: `docs/operations/publication-scheduling.md`.
- **Phase 22**: commit triage + polish + contrast fix (§27).

---

> Verification (this run):
>
> - Backend tests: **385 passed**
> - Frontend tests: **306 passed / 61 files**
> - Playwright: **all batches green** (phase20+services, publication ×3, workspace+smoke+seo, rtl+a11y+responsive, user-admin+roles+media; one axe flake green on rerun)
> - TypeScript: **PASS** · ESLint: **PASS** · Vite build: **PASS** · Storybook build: **PASS**
> - Migrations: **1 new (editorial/0002, applied)** · DB preserved: **YES** · ERP: **PARKED**
