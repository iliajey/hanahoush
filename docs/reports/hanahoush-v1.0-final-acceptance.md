# Hanahoush v1.0 — Final Acceptance Report (Phase 25)

Date: 2026-09-15. Close-out phase: no new product domains, no speculative features, no architecture rewrite, no ERP work, no destructive DB operations, no blind commits.

> No credentials, secrets, password hashes, or tokens appear in this report.

## 1. Executive Summary

Phase 19–24 claims were re-audited against code, DB, migrations, git, and deployment docs — then fully re-verified live. Result: product journeys work for all six roles, backend remains authoritative on RBAC, publication lifecycle is idempotent and failure-isolated, SEO hub-only services architecture holds, responsive/RTL/theme/a11y green, production code ready with operator-supplied config only. No P0/P1 acceptance blocker found in Phase 25. One E2E residue set cleaned; zero source changes made. Verdict: **ACCEPTED WITH LOW-RISK DEBT**.

- Backend: **391 passed**
- Frontend: **62 files / 310 passed**, typecheck PASS, lint PASS, vite build PASS, storybook build PASS
- Playwright: **177 passed / 0 failed** across 9 deterministic batches
- `manage.py check` clean, `makemigrations --check` clean, all migrations `[X]`
- DB preserved; Phase 25 residue removed; ERP parked (`ERP_ENABLED=False`, `ERP_PROVIDER=null`, NullProvider)

## 2. Final Verdict

**ACCEPTED WITH LOW-RISK DEBT**

Rationale: all acceptance journeys verified live with evidence; remaining items are low-risk deferred debt (SVG serve note, localStorage JWTs, react-router moderate CVEs, no email verification by design, staff-flag content gates by design, in-app SPA dirty guard limitation, minor studio papercuts, uncommitted tree owner triage, tracked sqlite history hygiene). None blocks real users or safe operator deploy.

## 3. Architecture Snapshot

- Backend: Django 5.2.16 + DRF 3.17.1 + SimpleJWT 5.5.1, WSGI `config.wsgi:application` (Gunicorn sync), WhiteNoise static, `DATABASE_URL` via psycopg 3.3.4, LocMemCache, cron `publish_scheduled`, SMTP reset mail. ASGI module reserved/unused. No Docker/Celery/Redis/K8s.
- Frontend: React + Vite 5.4 + TypeScript, React Query, React Router `createBrowserRouter`, i18n FA/EN/AR, ThemeProvider light/dark/system, MotionConfig reduced-motion, Radix Dialog, lazy routes, single Command Center palette, single MediaPicker, three studios (Article/Project/Service), hub-only services (no `/services/:slug` — verified absent except one code comment referencing the decision).
- Data: SQLite dev (`backend/db.sqlite3`, git-tracked historically — hygiene note), PostgreSQL production via `DATABASE_URL` (operator-provisioned, not faked).
- ERP: parked. `config/settings/base.py:198,201` defaults `False`/`null`; runtime confirmed; NullProvider; zero ERP calls/creds/models/migrations.

## 4. Completed Product Capabilities

Public: Home/About/Projects(+detail case-study)/Services hub/Articles(+detail)/Contact/Search/Credits(easter egg)/sitemap.xml/robots.txt/JSON-LD/OG/canonical. Staff: Dashboard(TodayCard/Attention/QuickActions/SystemPulse/publication ops/recent), Articles/Projects/Services workspaces (trilingual, cover+OG, SEO/health, preview, dirty guard, autosave), Media (upload/search/metadata/soft-delete), Editorial (review queue/detail/approvals/comments/revisions/locks), Publication Timeline (buckets/pagination/counts/readiness dots/deep links/reschedule/cancel/retry), Command Center (Ctrl+K, grouped permission-aware commands+search+recent), Users admin (superadmin only), Profile, Auth (login/logout/lockout/reset/change/sessions). Ops: `publish_due()` batch 50 idempotent + per-item isolation + audit + cache clear + sitemap signals; cron `*/2 * * * *`; backup/restore/rollback runbook.

## 5. Six-Role Permission Summary

Backend authoritative; frontend hides/disables only. Content writes gate on `is_staff` (not per-codename) — intentional existing design; EDITOR (non-staff per seeder) gets API 403 despite holding article codenames. Users admin `IsSuperAdmin` only. Media `IsAdminUser` (=`is_staff`). Editorial per-codename `_require_perm`. Dashboard `IsStaffOrAdmin` (non-staff API 403, UI read-only overview). Register/profile strip `role/is_staff/is_superuser`. Verified by `test_phase23_security.py` (6) + roles/user-admin E2E 10/10 + direct probes in Phase 23 (re-audited, code unchanged).

| Role | Dashboard | Articles | Projects | Services | Media | Timeline mutate | Users | Schedule/Publish | Profile self |
|---|---|---|---|---|---|---|---|---|---|
| SUPER_ADMIN | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW |
| COMPANY_ADMIN | ALLOW | ALLOW(staff) | ALLOW(staff) | ALLOW(staff) | ALLOW(staff) | ALLOW | DENY 403 | ALLOW | ALLOW |
| CONTENT_MANAGER | VIEW(403 API) | ALLOW(staff) | ALLOW(staff cross-module) | ALLOW(staff) | DENY 403 | view-only | DENY | ALLOW | ALLOW |
| PROJECT_MANAGER | ALLOW | VIEW(staff cross-write possible) | ALLOW | VIEW | ALLOW(staff) | view-only | DENY | DENY/GATED | ALLOW |
| EDITOR | VIEW | VIEW(API 403) | VIEW | VIEW | DENY | view-only | DENY | DENY | ALLOW |
| VIEWER | VIEW | VIEW | VIEW | VIEW | DENY | read-only | DENY | DENY | ALLOW self, priv ignored |

## 6. Authentication Acceptance

VERIFIED live + regression: login/logout valid; invalid → 401 generic; lockout 5 fails/15 min → 429; password change/reset-confirm/admin set-password/admin deactivate now blacklist ALL outstanding refresh tokens (`blacklist_user_tokens()` in `accounts/api/services.py:88`, wired 4 paths — Phase 23 fix, code present and tests green); deactivated → login/access/refresh 401; refresh rotates + blacklists old; logout blacklists + revokes session; reset enumeration-safe + signed token link; anonymous `/auth/me` 401; dead session → `/session-expired`; no tokens/secrets in logs (path/method/status/request_id/username only). No email verification — documented absence by design, not defect.

## 7. Article End-to-End Journey

VERIFIED via workspace E2E (edit-save, create draft, studio 2.0 locale/health/preview, round-trip public reflect + restore) + publication E2E (schedule→reschedule→cancel→publish-now) + backend governance tests: Dashboard → Articles → New draft → FA/EN/AR locale + completeness dots → title/slug/excerpt/body/tags → cover + OG pickers → SEO/health → Save (dirty guard + 30s autosave) → Preview (Edit back-link + published-only public link) → Submit (editorial.manage) → approvals → Schedule/Publish (approved/scheduled, readiness 422 enforced) → Timeline (countdown, retry/cancel, Failed fix&retry) → Published → public `/articles/:slug`. `?locale=` preserved; blockers inline with retry; no false success toast (Phase 20 fix present).

## 8. Project End-to-End Journey

VERIFIED via workspace E2E (list/search/filter, case-study editor, preview, public regression `online shop platform` all sections, studio round-trip public reflect + restore): same pipeline with six case-study sections (Challenge/Objectives/Solution/Stages/Architecture/Results, per-locale hide toggles) + cover + gallery (save-first gate) + SEO/OG/health → Preview (hero+body+sections+gallery, Edit back, published-only link) → submit/schedule/publish → Timeline → public `/projects/:slug`. Projects list Preview button present (Phase 20 fix).

## 9. Service End-to-End Journey

VERIFIED via services-studio E2E (list/search/filter/create round-trip + public, restricted-role hidden): section-based hub-only architecture preserved — grep confirms no `/services/:slug` route (only a code comment referencing the decision). Flow: New service → title/slug + section picker + icon picker (11 Lucide keys, preview, clear, FA/EN/AR) + order + cover + OG → Save → Preview (ServiceCard+body+hub breadcrumb, Edit back, published-only `/services` link) → submit/schedule/publish → Timeline → public `/services` hub. `og_image` read path present on list/detail (`services/api/serializers.py`, `viewsets.py`).

## 10. Publication Lifecycle

VERIFIED code + tests + live E2E: schedule (approved/scheduled + `assert_ready`), reschedule (future-only, scheduled-only), cancel (scheduled-only, `schedule.cancelled` audit), publish-now, `publish_due(batch_size=50)` — filters `scheduled+due`, oldest-first, cap 50 (`PUBLISH_DUE_BATCH_SIZE=50` in `editorial/services.py:33,374`), per-item try/except (`PublicationBlocked`/`WorkflowError` → `publish.failed` audit, stays `scheduled` for retry, siblings continue), already-published marked done without republish, `_clear_ops_cache()` on success, sitemap signals, command prints `Published N`. Cancelled never publishes (due filter). Live `publish_scheduled` prints `Published 0` with only far-future schedule. Governance/schedule/timeline backend tests green.

## 11. Timeline and Scheduling

VERIFIED live E2E (timeline, hardening, governance 15/15): buckets all/upcoming/today/overdue/attention/published/cancelled/done server-driven with counts + pagination 20/page, Needs-attention + Failed badges (`role=alert`), locale readiness dots with studio deep-links + `?locale=` preselect, reschedule/cancel with toasts, single page-level 60s countdown (no per-row timers), dates `dir=ltr`, 375/390 RTL no-overflow, viewer read-only + anon 401 + viewer mutation 403, role gates (SUPER_ADMIN full). Cron `*/2 * * * * …/manage.py publish_scheduled` re-confirmed accurate (`docs/operations/publication-scheduling.md`).

## 12. SEO Acceptance

VERIFIED live: article/project SEO + service hub architecture; canonical per page; robots.txt + sitemap.xml 200 (sitemap lists `/services` hub, never per-service dead URLs — governance spec green); JSON-LD present; OG image real field (cover fallback preserved); preview staff-only login-guarded; dashboard/auth/404/credits `noindex,follow` (CreditsPage + RouteErrorFallback + NotFound verified in code); public pages indexable; stale noindex never leaks; hreflang intentionally omitted (locale-less SPA — documented). `seo` E2E 13/13 + governance SEO specs green.

## 13. Media and Upload Acceptance

VERIFIED live E2E (media list/upload/metadata/refcount/soft-delete) + phase20 picker specs: dialog `max-h-[calc(100dvh-2rem)]`, internal scroll `data-testid="media-picker-scroll"`, sticky footer reachable 375/390 RTL/LTR dark/light keyboard; global dialog bound; backend enforcement intact (10MB cap, extension allowlist + dangerous list, Pillow verification, MIME from extension, sanitized filenames, soft-delete only, DRF IsAdminUser=`is_staff`). SVG stored-served XSS note remains LOW deferred (no inline-render evidence).

## 14. Command Center

VERIFIED live E2E (open via Ctrl+K, grouped permission-aware, viewer hides admin/create, 390px no-overflow): single palette (no duplicate) — commands + `useGlobalSearch` grouped results, capability-filtered (`commands.ts`), categories Nav/Create/Content/Publishing/Admin/System + Recent (localStorage max 5), keyboard Ctrl+K/Cmd+K, arrows, Enter, Esc (Radix trap), `combobox/listbox/option` ARIA + `aria-selected`, focus-visible, mobile `w-[calc(100vw-2rem)]` top-anchored, shortcuts dialog, staff topbar entrypoint.

## 15. Credits Easter Egg

VERIFIED code (`useHomeClickEgg.ts`: `CLICKS_REQUIRED=10`, `RESET_MS=2000`, `COOLDOWN_MS=30000`, in-memory refs, `preventDefault` race fix, desktop+mobile Home wiring) + live E2E (10-click lands `/credits`, FA RTL 390px no-overflow): reset on inactivity, 30s cooldown, refresh resets, no analytics/persistence, FA/EN/AR + RTL/LTR, mobile safe, no accidental activation, `noindex,follow`, back-home link, placeholder sections with no invented claims.

## 16. RTL/LTR Acceptance

VERIFIED live `rtl` 6/6 + responsive RTL specs: FA/AR RTL + EN LTR, logical `ms/me/ps/pe/start/end/border-s` (Phase 22 converted leftovers incl. CommentThread/PublishButton/LockIndicator/Dropdown/TOC/ProjectsTimeline/Gallery/FeaturedProjectCard), chevrons `rtl:rotate-180`, invalid `lg:direction-rtl` fixed, dates/numbers intentional `dir=ltr`, translation parity enforced by suite (all phase keys FA/EN/AR).

## 17. Responsive Acceptance

VERIFIED live `responsive` 52/52 + picker/timeline/credits/command specs asserting `horizontalOverflowPx=0`: 375/390/768/1024/1280/1440 — dashboard, article/project/service workspaces, media picker, dialogs (`max-h` bound + `w-[calc(100vw-2rem)]`), timeline, command center, publication panel, previews, credits. No horizontal overflow on core flows; staff tables use cards/lists.

## 18. Accessibility Acceptance

VERIFIED live `accessibility` 13/13 this run (9 axe scans home/services/articles/article-detail/projects/project-detail/about/contact/login — zero critical/serious; H1, landmarks, contact labels, image alt): Radix focus trap + labels, picker keyboard (dropzone Enter/Space, grid `aria-pressed`), alerts `role=alert`, success `role=status`, dots symbol+text (never color-only), focus-visible rings, reduced-motion respected globally. Phase 21 `/articles` contrast flake did not reproduce (no token changed deliberately).

## 19. Security/RBAC Regression

Re-ran Phase 23 scope by code audit + suites (no policy weakened — diff confirms fix files unchanged since Phase 23/24): backend authoritative; anon writes 401; unauthorized role writes 403; role/profile priv fields stripped at serializer; token invalidation via `blacklist_user_tokens` (4 paths); schedule/publish per-codename; users admin super-only + self/last-holder protection; media `is_staff`; JWT Bearer (CSRF N/A); CORS/prod strict; envelope errors no leak; IDOR permission-gated; mass-assignment inspected; audit logging without secrets. Backend `test_phase23_security.py` 6/6 green. Remaining: §28 LOW debt only.

## 20. Production Readiness

Code READY; config OPERATOR REQUIRED (see §21). Re-audited Phase 24 vs code: production.py fail-fast hosts/CORS/CSRF, `CORS_ALLOW_ALL_ORIGINS=False`, bootstrap default False, DEBUG False, SECRET_KEY required env, SSL redirect + HSTS + secure cookies + JWT Secure mutation, nosniff/DENY/referrer/permissions-policy/no-store middleware, toolbar stripped, ManifestStaticFilesStorage; `.env.example` classified REQUIRED/PRODUCTION ONLY/OPTIONAL/LOCAL ONLY with placeholders only; gunicorn.conf.py bind/workers/threads/timeout/logs verified (22.0.0 installed, Linux `fcntl` note); `DATABASE_URL` psycopg parsing; static `collectstatic` 274 unmodified + WhiteNoise; media DEBUG-only Django serving → proxy map; proxy assumptions (TLS term, X-Forwarded-Proto, /api//admin//static//media maps, SPA fallback, ping/health, HTTP→HTTPS); health/ping/version/sitemap/robots live 200 (local); logging no secrets; email SMTP env-driven; LocMemCache + write-through invalidation; cron accurate; backup/restore/rollback documented. `check --deploy` with proper key: **0 Django security warnings** (16 drf-spectacular W001 schema hints only) — VERIFIED this phase.

## 21. Deployment Operator Requirements

OPERATOR CONFIGURATION REQUIRED (not code defects): provision PostgreSQL 16 + `DATABASE_URL`; `DJANGO_SECRET_KEY` 50+ random; `DJANGO_ALLOWED_HOSTS`/`CSRF_TRUSTED_ORIGINS`/`CORS_ALLOWED_ORIGINS`/`SITE_URL`/`FRONTEND_URL` real domain; SMTP creds + FROM; reverse proxy + TLS cert + SPA fallback + `/static/` + `/media/` maps; `VITE_API_BASE_URL` prod build; cron line install; backup schedule + media snapshots; disable bootstrap after first superuser; secret store for `.env` (never commit).

## 22. Backup / Restore / Rollback

Documented in runbook §§17–19 (not executed live per rules — OPERATOR REQUIRED): `pg_dump -Fc` daily 30d encrypted off-host `0600` + monthly restore-to-disposable verification + WAL/PITR note + media snapshot same timestamp; restore via `createdb`+`pg_restore` to disposable DB then promote + media restore + `showmigrations`; rollback via previous code tag + previous `dist/` symlink + `collectstatic` re-run, cron keeps running (idempotent), media append-only, migration rollback only if reversible + backup exists (0002 choices-only safe).

## 23. Database and Migration Status

Preserved, no reset, no fixture wipe. Before Phase 25 E2E: articles 7 / projects 5 / services 4 / users 7 / workflows 2(+2 E2E) / schedules 1. After full 177-spec runs: +1 article (`phase10-e2e-draft-mu2jw2lb` id 56), +1 service (`phase155-e2e-service-mu2jvvvn` id 17), +2 workflows (42 orphan obj 55, 43 obj 56) + children. Cleaned ONLY Phase 25 residue via SQL (children first, then rows): articles 8→7, services 5→4, workflows 4→2, audits 29→25, approvals 6→4, revisions 10→8. Final: articles **7** (6 demo published + `t1` review), projects **5**, services **4**, users **7**, workflows **2**, schedules **1** (far-future `scheduled`). Backend re-run 391 green after cleanup. Temp probe files removed (`temp/phase25*.txt`).

## 24. Test Matrix with EXACT COUNTS

- Backend `python -m pytest -q --no-cov`: **391 passed** (pre + post cleanup).
- Frontend `npm run test -- --run`: **62 files / 310 passed**.
- `npm run typecheck`: PASS (exit 0). `npm run lint`: PASS (exit 0).
- `npm run build` (vite): PASS (~6.56s, index ~488kB/gzip ~159kB, pre-existing dynamic-import notice only).
- `npm run build-storybook`: PASS (~12.43s).
- `manage.py check`: clean (0 issues). `makemigrations --check --dry-run`: No changes detected. `showmigrations`: all `[X]` incl. editorial 0001+0002.
- `check --deploy` (proper key): 0 Django security warnings (16 drf-spectacular W001 hints only).
- Playwright (Chromium, live `localhost:5173 ↔ 127.0.0.1:8000`), 9 batches: smoke **16** + seo/errors/phase19 **28** + workspace/services **14** + publication ×3 **15** + phase20-workflow **5** + rtl/responsive/theme **66** + accessibility **13** + roles/user-admin **10** + cursor-grid/performance **10** = **177 passed / 0 failed**. Zero flakes this run (Phase 21 contrast flake and Phase 23 responsive flake did not reproduce).
- Live probes: `/api/ping/` 200 pong, `/api/health/` 200 healthy, `/api/version/` 200, `/sitemap.xml` 200, `/robots.txt` 200.
- `npm audit --omit=dev`: 2 moderate react-router CVEs (GHSA-wrjc-x8rr-h8h6, GHSA-337j-9hxr-rhxg) — unchanged, deferred LOW (SPA-only, no SSR).

## 25. Performance Observations

No new deps; lazy routes/chunks preserved (Dashboard ~28.67kB, ArticleEdit ~17.86kB, ServiceEdit ~17.95kB, ProjectEdit ~31.71kB); no polling added (timeline single 60s page timer, studio 30s autosave unchanged, search debounce 350ms); React Query caching kept; images lazy + aspect boxes; perf E2E 3/3 (no duplicate GETs, minimal CLS, dashboard chunk split). No optimization project started.

## 26. Bugs Found During Final Acceptance

Zero new P0/P1/P2 user-facing acceptance defects requiring code change. Pre-existing deferred items confirmed still deferred (see §28/§29). E2E residue (above) is test artifact, not product bug.

## 27. Bugs Fixed During Final Acceptance

Zero source fixes — none needed. Only action: Phase 25 E2E residue cleanup (§23). Phases 19–24 fixes re-verified present (MediaPicker footer, false-toast gate, projects Preview, preview Edit/public links, dirty-guard `returnValue`, dead `publishing` removal + 0002, icon picker, OG picker + Service og read, RTL logical props, HealthMeter revert, token-blacklist fix, prod fail-fast + email + JWT-Secure, runbook).

## 28. Known Technical Debt

LOW-risk, non-blocking: (1) SVG stored-served as-is (sanitize/inline-CSP if ever inlined); (2) JWTs in localStorage (HttpOnly cookie mode exists, needs frontend arch); (3) react-router 2 moderate CVEs, SPA-only unaffected; (4) staff-flag (not codename) content gates allow cross-module staff writes — intentional; (5) in-app SPA dirty-nav blocker absent (beforeunload+dirty badge+autosave mitigate, needs router design); (6) minor studio papercuts (save-pending scope, autosave error surfacing, gallery hover-on-touch, hardcoded preview robots, workflowId-0 binding); (7) drf-spectacular W001 schema hints; (8) no backend lockfile (ranges + frontend lockfile); (9) `backend/db.sqlite3` + `.bak.20260825_114328` tracked in history — owner hygiene if repo public.

## 29. Deferred Items

Explicitly NOT in v1.0: charts on dashboard; per-locale SEO-difference tooltips; timeline virtualization (20/page suffices); in-app router blocker; gallery touch redesign; broad recolor for contrast flake watch; email verification; cookie-auth migration; react-router major bump; multi-node shared cache; cloud/Docker/Celery/Redis/K8s; any ERP work; service detail route (architecture decision — must stay hub-only); cosmetic preferences without usability materiality.

## 30. Git/Repository Audit

Head `d5cfd71 phase15` (phases 16–25 uncommitted by owner design; nothing committed here; no history rewrite). `git status --short`: **77 modified + 68 untracked = 145 entries** (full list in §31 groups + `temp/pw24*.json/err` run artifacts + this report + `backend/db.sqlite3` runtime modification).
A. Production source (backend apps/config/gunicorn + frontend src/i18n): §31 groups 1–4.
B. Tests (backend `test_*.py`, frontend `*.test.*`, e2e specs): groups 1–4.
C. Docs (`docs/operations/` runbooks + `docs/reports/phase-15.5–24` + user guide + this report): group 6.
D. Migrations (`editorial/0002` choices-only): group 5.
E. Generated/build — DO NOT commit: `frontend/dist/`, `storybook-static/`, `node_modules/`, `__pycache__/`, `.pytest_cache/`, coverage, `e2e-artifacts/`, `test-results/`, `*.log`, `backend/staticfiles/`.
F. Databases/backups — DO NOT commit: `backend/db.sqlite3` (+ tracked `.bak` hygiene note), `backups/`, `backend/media/` uploads.
G. Logs/temp — DO NOT commit: `backend_server.log`, `frontend_server.log`, `temp/pw24*.json/err`, `temp/phase25*.txt` (removed), OS temp probes (outside repo, removed).
H. Unknown: none — every entry classified. Secrets: `.env` files untracked + ignored (verified `check-ignore`); `.env.example` files placeholders only (`change-me-in-production`, empty keys, reserved ERP creds marked never-commit); grep 39 hits all dummy fixture passwords; no secrets in report/logs/bundle.

## 31. Recommended Commit Plan

DO NOT blindly bundle; owner reviews/commits in order (nothing staged here):

1. **Publication governance** — `editorial/readiness.py`, `editorial/api/*`, `editorial/services.py` (governance parts), `search/services.py`, `seo/views.py` + tests `test_publication_governance.py`, `test_schedule_ops.py`, `test_timeline_attention.py`, `seo/tests/test_seo.py` + e2e `publication-governance/hardening/timeline` + `docs/operations/publication-scheduling.md`.
2. **Studios/search/dashboard** — Article/Project/Service workspaces + hooks/api, Command Center (`commands.ts`, `KeyboardShortcutsDialog`, `SearchCommand`), `TodayCard`/`SystemPulse`/`Countdown`/`PublicationPanel`/`PublicationTimelinePage`, `CreditsPage`, `useHomeClickEgg`, `health-indicator`, dashboard/core/search services, i18n bulk, related unit + e2e `phase19-personality/phase20-workflow/services-studio/workspace`.
3. **Workflow hardening** — MediaPicker footer + dialog bound + false-toast fix + preview Edit/public links + `OgImageField`/`SeoPreview`/`ServiceIconPicker`/`useDirtyGuard`/`studioLocale`/`seoHealth` + Service og read path + `page-builder/common.tsx` icon keys + translations + related tests.
4. **Security + prod settings** — `accounts/api/services.py` + `views.py` + `admin_users.py` (token blacklist) + `test_phase23_security.py` + `config/settings/base.py` + `production.py` + `backend/.env.example` + `gunicorn.conf.py` (if tracked changes) + marketing/RTL polish files (ERPCard/FAQ/ServiceCard/TestimonialCard/Timeline/breadcrumb/dialog/dropdown/pagination/toast/filter bars/TOC/Featured/Gallery/JourneySection) + `phase22-polish.test.tsx`.
5. **Migration (separate, reviewable/rollback-safe)** — `editorial/migrations/0002_alter_publicationschedule_status.py` + `editorial/models.py` choice cut + frontend `editorial/types` union cut.
6. **Docs** — `docs/operations/production-deployment.md` + `docs/reports/phase-15.5-report.md` through `phase-24-report.md` + `phase-20-user-workflow-guide.md` + this `hanahoush-v1.0-final-acceptance.md`.
7. **NEVER stage/commit** — `backend/db.sqlite3`, `*.bak.*`, `.env`, `dist/`, `storybook-static/`, `node_modules/`, `staticfiles/`, `media/`, logs, `e2e-artifacts/`, `test-results/`, `temp/`.

## 32. Release Checklist

1. Owner commits §31 groups 1–6 (review each; keep 7 untracked).
2. Provision PostgreSQL 16 + role/DB + `DATABASE_URL`.
3. Fill production `.env` (SECRET_KEY 50+, hosts/CSRF/CORS/SITE/FRONTEND_URL, SMTP, bootstrap True only for first boot).
4. Configure reverse proxy + TLS + SPA fallback + `/static/` + `/media/` maps.
5. `pip install -r requirements/production.txt` → `manage.py migrate` → `showmigrations` all `[X]` → `collectstatic --noinput`.
6. `VITE_API_BASE_URL=https://<domain>/api/v1 npm run build` → place `dist/` at web root.
7. Create/verify superuser → set `BOOTSTRAP_ADMIN_ENABLED=False`.
8. Persistent `MEDIA_ROOT` volume + writable + backup pairing.
9. Install cron `*/2 * * * * …/manage.py publish_scheduled`.
10. Schedule `pg_dump -Fc` daily + media snapshots; monthly restore-to-disposable test.
11. Smoke: ping/health/version → login/me → public Home/Articles/Projects/Services → Dashboard → Media → Timeline → draft→publish → `publish_scheduled` → sitemap/robots → logout.
12. Tag v1.0 → release.

## 33. Explicit Final Acceptance Verdict

**ACCEPTED WITH LOW-RISK DEBT**

“Is Hanahoush v1.0 accepted for release?” — **Yes, with documented low-risk debt (§28) and operator configuration (§21).** Users can successfully use it; operator can deploy it safely by following the runbook + checklist. No acceptance blocker remains. ERP stays parked.
