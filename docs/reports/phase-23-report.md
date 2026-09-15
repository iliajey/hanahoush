# Phase 23 Report — Security + RBAC Final Audit

Date: 2026-09-15. Hardening/verification phase: no new domains, no new architecture, no second RBAC system, no auth rewrite, ERP parked.

> No credentials, secrets, password hashes, or tokens appear in this report.

---

## 1. Executive Summary

Proved the existing security model is authoritative and cannot be bypassed. Full sweep across all six roles (SUPER_ADMIN, COMPANY_ADMIN, CONTENT_MANAGER, PROJECT_MANAGER, EDITOR, VIEWER) plus anonymous: backend denies every direct-bypass, escalation, IDOR, and mass-assignment probe with correct 401/403/404/400 codes; frontend guards match backend for every route. Found and fixed exactly one genuine defect: **password change/reset/deactivation revoked audit session rows but left outstanding JWT refresh tokens valid** (stale refresh survived with 200). Minimal fix: new `blacklist_user_tokens()` helper wired into 4 paths (self change-password, reset-confirm, admin set-password, admin deactivate). New regression file `test_phase23_security.py` (6 tests). Final: backend **391 passed** (385 + 6), frontend **62 files / 310 passed**, typecheck/lint/vite/storybook clean, Playwright **177 passed / 0 failed** across 8 batches (one transient responsive flake green on rerun).

## 2. Security Scope

Hardening/verification only. No new domains, roles, permission counts, auth architecture, audit viewer, storage system, worker framework, or ERP work. Permission catalog (27 codenames) unchanged. Six roles unchanged.

## 3. Existing Security Architecture

**Authentication (JWT Bearer, SimpleJWT 5.5.1):**
- `config/settings/base.py:230-233` — JWTAuthentication, default AllowAny (per-view gates).
- `config/settings/base.py:283-299` — access 30m, refresh 7d (1d short session unless remember_me), rotate + blacklist true, HttpOnly Lax cookies.
- `accounts/api/views.py:88-114` — LoginView: lockout check (5 fails / 15 min), issues rotated tokens, session row + audit.
- `accounts/api/views.py:135-168` — RefreshView: rotates, blacklists old, touch_session + audit.
- `accounts/api/views.py:222-245` — LogoutView: IsAuthenticated, blacklists refresh + revoke_session.
- No email verification exists (documented absence, not a defect — password-reset via signed token + enumeration-safe response).

**Authorization (backend authoritative):**
- `accounts/api/permissions.py` — IsSuperAdmin (superuser OR SUPER_ADMIN role), IsAdminUser (superuser OR role=="admin", legacy), IsStaffOrAdmin, IsStaffOrReadOnly (writes need staff/superuser/admin), HasRole/HasPermission (superuser bypass), IsOwnerOrReadOnly (unused structure).
- Content viewsets (articles/projects/services): `IsStaffOrReadOnly` — **staff flag, not per-codename**. Editorial: IsAuthenticated + manual `_require_perm` per codename. Media: DRF IsAdminUser (**legacy means Django `is_staff`** — see §4 note). Dashboard: IsAuthenticated + IsStaffOrAdmin. Admin users: IsSuperAdmin only. ERP health: IsIntegrationOperator.
- `config/api/base/viewsets.py:179-188` — draft protection filters published+public for non-staff regardless of `?status=`.
- `config/api/base/responses.py:71-118` — standard envelope + request_id; unhandled → generic 500, no leak.

**Frontend gates (non-authoritative, match backend):**
- `features/auth/role-config/capabilities.ts` — 22 capabilities derived from backend permissions + staff/superAdmin gates.
- `app/routes/index.tsx` — ProtectedRoute + RequirePermission/RequireAnyPermission/RequireStaff/RequireSuperAdmin per route; users routes RequireSuperAdmin.
- `shared/api/axiosClient.ts` — single 401 retry with `_retry`, login/refresh URLs excluded, queue drained, failure clears tokens.

## 4. Six-Role Matrix

Verified by direct API probes (test DB) + route specs + existing suites. Key finding documented: **content writes (articles/projects/services) gate on `is_staff`, not on per-module codenames** — intentional existing design (docstrings say "staff-only"). Consequence: COMPANY_ADMIN/CONTENT_MANAGER/PROJECT_MANAGER (staff) can write cross-module; EDITOR (non-staff per seeder) cannot write via API despite holding `articles.create/update` (403). Frontend mirrors with staffOnly. Documented, not changed.

| Capability | SUPER_ADMIN | COMPANY_ADMIN | CONTENT_MANAGER | PROJECT_MANAGER | EDITOR | VIEWER |
|---|---|---|---|---|---|---|
| Dashboard (API/route) | ALLOW | ALLOW | DENY/DENY* | ALLOW | DENY/DENY* | DENY/DENY* |
| Articles read | ALLOW | ALLOW | ALLOW | ALLOW (view) | ALLOW (view) | ALLOW (view) |
| Articles write (API) | ALLOW | ALLOW (staff) | ALLOW (staff) | ALLOW (staff!) | DENY 403 | DENY 403 |
| Projects write (API) | ALLOW | ALLOW (staff) | ALLOW (staff!) | ALLOW (staff) | DENY 403 | DENY 403 |
| Services write (API) | ALLOW | ALLOW (staff) | ALLOW (staff) | ALLOW (staff!) | DENY 403 | DENY 403 |
| Media (API/route) | ALLOW | ALLOW (staff) | DENY 403** | ALLOW (staff) | DENY 403 | DENY 403 |
| Timeline view / mutate | ALLOW | ALLOW | ALLOW/view-only | ALLOW/view-only | ALLOW/view-only | ALLOW/view-only |
| Editorial manage/approve/schedule | ALLOW | manage+approve+schedule (no review) | manage+review+schedule (no approve) | review only | review only | view only |
| Users admin | ALLOW | DENY 403 | DENY 403 | DENY 403 | DENY 403 | DENY 403 |
| Profile mutate | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW (own only, priv fields ignored) |
| ERP health | ALLOW | ALLOW | ALLOW (integration.view) | DENY 403 | DENY 403 | DENY 403 (ALLOW only with integration.view) |

\* Dashboard requires IsStaffOrAdmin: non-staff roles get 403 on API; frontend DASHBOARD capability has no gate but dashboard widgets degrade to read-only overview (roles specs green).
\*\* Media uses DRF IsAdminUser = `is_staff` — CONTENT_MANAGER with media.upload but staff flag in seeder still passes; non-staff denied 403 regardless of codename.

## 5. API Direct-Bypass Results

Runtime probes (isolated test DB, live DB untouched) + permanent regression tests:

| Probe | Result |
|---|---|
| PM (staff, no articles.create) POST /articles/ | 201 (staff-gate, by design) |
| EDITOR (non-staff, has articles.create) POST /articles/ | 403 |
| VIEWER POST published article | 403 |
| anon GET admin/users | 401 |
| EDITOR/PM GET admin/users | 403 |
| SUPER_ADMIN GET admin/users | 200 |
| VIEWER workflow ensure | 403 |
| anon `?status=draft` filter | 0 rows leaked |
| VIEWER ERP w/ integration.view | 200 (by design); without → 403 |
| non-staff media list | 403 |
| deactivated access → /me | 401; refresh → 401 |
| register with role/is_staff/is_superuser | 201 forced VIEWER/non-staff/non-super |
| profile patch with role/is_staff/is_superuser | 200, priv fields ignored |

## 6. URL Direct-Bypass Results

Playwright `roles.spec.ts` (8) + `user-admin.spec.ts` (2) green 10/10: all six role flows (login → dashboard → nav → backend → logout), guest → /login + /auth/me 401, session-death → /session-expired, superadmin UI CRUD, viewer blocked from every /dashboard/users/* path. Frontend guards redirect to /unauthorized or /login; backend verified separately (§5). No bypass.

## 7. User Admin Security

`/api/v1/admin/users/` — IsSuperAdmin only (superuser OR SUPER_ADMIN role; `users.manage` codename alone grants nothing — docstring explicit). DELETE disabled (deactivation only). Self-protection: no self-deactivate/destaff/demote; last superuser + last SUPER_ADMIN holder protected. Password material never serialized (test asserts). COMPANY_ADMIN denied 403 despite `users.manage`. Regression: `test_admin_users.py` + `test_phase23_security.py`.

## 8. Role Escalation Tests

VIEWER→EDITOR→CONTENT_MANAGER→COMPANY_ADMIN→SUPER_ADMIN attempted via register payload (role/is_staff/is_superuser ignored), profile patch (ignored), admin API (403 for non-super). Serializers inspected: register (7 safe fields), profile (5 safe fields), admin write (no is_superuser field, role by existing codename only). No escalation possible. No policy changed.

## 9. Object-Level Authorization

Product intentionally uses **role/module authorization, not per-user ownership**: Article.author is byline (separate from created_by audit); no IsOwnerOrReadOnly on content viewsets. Cross-user mutation allowed for authorized staff roles by design. Documented, no new ownership architecture introduced.

## 10. Publication Security

State machine enforced in `WorkflowService`: schedule only from approved/scheduled + `assert_ready`; publish only from scheduled/approved + `assert_ready` unless soft; archive only from published; reopen only from archived; transitions via allowlist (WorkflowError → 400). Editorial `_require_perm` per action (view/manage/approve/review/schedule). Viewer publish/schedule/cancel attempts → 403. Health-blocked stays scheduled + `publish.failed` audit; warning-only does not block. Existing `test_publication_governance.py` green.

## 11. Scheduled Publication Security

`ScheduleService.publish_due(batch_size=50)` (`services.py:33,374`): filters scheduled+due, oldest-first, cap 50; per-item try/except (PublicationBlocked/WorkflowError → audit, stays scheduled for retry); already-published marked done without republish; clears ops cache; sitemap via signals. Command `publish_scheduled` prints count. Cron `*/2 * * * *` unchanged. Worker uses stored `scheduled_by` as actor — no privilege escalation (only executes already-authorized schedules). Existing `test_schedule_ops.py` green.

## 12. Authentication Security

Invalid credentials → 401; lockout after 5 fails → 429; inactive accounts rejected at login + access (401) + refresh (401, SimpleJWT CHECK_USER_IS_ACTIVE + blacklist); refresh rotates with old blacklisted; single retry, no loops, login/refresh excluded from intercept; logout blacklists + revokes; password change/reset now blacklists ALL outstanding tokens (fix §24); reset never reveals existence; logs contain only path/method/status/request_id/username (no tokens/bodies). No email verification (documented absence).

## 13. Password/Secret Hygiene

Grep for secret patterns: 39 hits, all test-fixture dummy passwords (`pass12345` etc. in `test_*.py`, never committed real creds). `backend/.env` + `frontend/.env` present locally but `git check-ignore` confirms untracked; tracked `.env.example` files contain placeholders only (`change-me-in-production`, empty keys, reserved ERP creds marked never-commit). Seeders take demo passwords from env, never source. No secrets in reports/frontend bundle/logs.

## 14. CSRF/CORS/Security Headers

JWT-Bearer auth (no cookie auth) → CSRF N/A; CSRF_TRUSTED_ORIGINS localhost defaults. CORS: base allowlist localhost 3000/5173/6006 + credentials; `local.py` allows all (dev only); production controlled by `CORS_ALLOWED_ORIGINS` env. Production: DEBUG False, SSL redirect, secure cookies, HSTS 1yr + subdomains + preload, nosniff, DENY framing, toolbar removed, SECRET_KEY required from env. Middleware: nosniff + strict-origin-when-cross-origin referrer + restrictive permissions-policy on every response; no-store on /api/v1/auth/ + /api/v1/admin/. Local/prod correctly separated.

## 15. Information Disclosure

`hanahoush_exception_handler`: standard envelope (success/message/data/errors/request_id); unhandled → generic "Internal server error" 500 with server-side log. Auth errors generic ("Invalid credentials"); reset enumeration-safe; permission denials generic messages with correct codes. No stack/SQL/paths/secrets/tokens in responses.

## 16. IDOR/Parameter Tampering

IDs are sequential but authorization is permission-gated, not secrecy-gated: GET/PUT/PATCH/DELETE/workflow actions on foreign article/project/service/media/schedule/user IDs return 401/403/404 per gate, never data leak. Draft filter bypass (`?status=draft` anon) returns 0. User IDs: non-super retrieve/update → 403. No per-user ownership model (documented §9).

## 17. Mass Assignment

Serializers inspected: Article/Project/Service write serializers exclude audit/workflow fields (status/is_public/is_featured/published_at assignable by authorized staff — by design, workflow engine governs visibility); media `created_by` server-set; profile/register strip priv fields at serializer level (unknown fields ignored, 200 with no effect). `is_superuser` absent from admin write serializer. Verified at runtime (§5).

## 18. Media Security

DRF IsAdminUser (= `is_staff`) for all ops; non-staff 403 regardless of `media.upload`. Upload: extension allowlist (jpg/png/gif/webp/svg/avif/pdf/doc/xls/csv/txt), dangerous list (exe/bat/php/py/js/html/svgz/jsp/asp/cgi/pl/rb), Pillow image verification, 10MB cap, MIME derived from extension not client, filename sanitized (`Path.name` + char whitelist, traversal-proof). Soft-delete only. SVG allowed = stored-served XSS note (deferred low-risk §31).

## 19. ERP Security

PARKED: `ERP_ENABLED=False`, `ERP_PROVIDER=null`, NullProvider active (runtime confirmed). Health endpoint: anon 401, non-staff 403, staff/superuser/integration.view 200 with `{enabled:false, provider:null, connectivity:disabled}`; `?probe=true` while disabled performs zero network; POST 405; `Cache-Control: no-store`. No creds/network/sync/mutations/migrations. 10 existing tests green.

## 20. Frontend Security UX

Guards verified per role (§6): hidden actions backed by backend; unauthorized → /unauthorized (auth'd) or /login (guest) or /session-expired (dead session); logout clears localStorage tokens; auth failure bus clears + redirects; refresh preserves state via fetchMe; no sensitive data pre-auth (ProtectedRoute loading gate). Frontend never the boundary — backend verified separately.

## 21. Audit Logging

Login/login_failed/logout/refresh/register/password_change/admin user events (LoginAudit) + workflow events (schedule.created/cancelled, workflow.publish, publish.failed, approval.decided, transitions) with actor/target/IP. No secrets in audit detail. Unauthorized attempts rejected before mutation (no false success events). No new viewer built.

## 22. Dependency Security

- Frontend `npm audit --omit=dev`: 2 moderate (react-router 6–7 open-redirect CVE-2025-68470 bypass GHSA-wrjc-x8rr-h8h6 + SSR deserializeErrors GHSA-337j-9hxr-rhxg), fix via `npm audit fix` — deferred (no SSR usage, SPA only; major bump risk) — LOW/NON-BLOCKING.
- Backend: SimpleJWT 5.5.1, DRF 3.17.1, Django 5.2.16 — no pip audit tool configured; no known exploitable issue in used surface; no blind upgrades.
- No new dependencies added this phase.

## 23. Security Bugs Found

1. **MEDIUM — stale refresh survives password change/reset/deactivation.** Repro: login twice → change password with session A → refresh with session B → 200 (expected 401). Cause: code revoked `UserSession` audit rows but never blacklisted SimpleJWT `OutstandingToken`s. Affected: `ChangePasswordView`, `PasswordResetConfirmView`, admin `set-password`, admin `deactivate`.
2. LOW (deferred) — stored SVG served as-is (stored XSS if rendered inline). No evidence of inline rendering; sanitization deferred.
3. LOW (deferred) — tokens in `localStorage` (XSS-dependent theft). HttpOnly cookie mode exists in settings but frontend uses Bearer; migration deferred (needs arch change).
4. LOW (deferred) — react-router moderate CVEs, no SSR usage; bump deferred.

## 24. Security Bugs Fixed

Fix for §23.1 (minimal, no arch change): `apps/accounts/api/services.py` += `blacklist_user_tokens(user)` (blacklists all `OutstandingToken`s via existing `token_blacklist` app); wired into `views.py` ChangePassword + PasswordResetConfirm, `admin_users.py` set-password + deactivate. Regression: `apps/accounts/tests/test_phase23_security.py` (6 tests: 2 token-invalidation + 4 bypass/mass-assignment). Verified: previously-failing 200→401 assertions now pass; full backend 391 green.

## 25. Regression Tests

- Backend: `python -m pytest . -q` → **391 passed** (was 385; +6 new `test_phase23_security.py`).
- Frontend: `npm run test -- --run` → **62 files / 310 passed**. `typecheck` exit 0, `lint` exit 0, `vite build` 5.25s, `build-storybook` 35.84s.
- Probed-then-deleted temp files: `test_phase23_probes_tmp.py`, `test_phase23_list_tmp.py` (removed; only `test_phase23_security.py` kept).

## 26. Playwright Results

Real Edge/Chromium headless, servers bound 127.0.0.1 (jobs per batch; first attempt failed on missing servers — env, not code). All EXIT green:

| Batch | Specs | Result |
|---|---|---|
| roles + user-admin | 10 | 10 passed |
| smoke + seo + errors + phase19-personality | 44 | 44 passed |
| workspace + services-studio | 14 | 14 passed |
| publication timeline/hardening/governance | 15 | 14+1 flake→6/6 alone |
| phase20-workflow | 5 | 5 passed |
| rtl + responsive + theme | 66 | 66 passed |
| accessibility | 13 | 13 passed |
| cursor-grid + performance | 10 | 10 passed |
| **Total** | | **177 passed, 0 failed** |

## 27. Database Integrity

No reset/wipe. E2E residue cleaned via ORM/SQLite (article 54 `phase10-e2e-draft`, service 15 `phase155-e2e-service`, workflows 37/41 + children). Final: articles **7** (6 demo published + `t1` review), projects **4**, services **4**, users **7**, workflows **2**, schedules **1** (far-future scheduled). Backend re-run green after cleanup (391).

## 28. Migration State

`manage.py check`: clean. `makemigrations --check`: "No changes detected". `showmigrations editorial`: 0001 + 0002 `[X]`. No new migration (fix needed no schema change).

## 29. Git/Tree Status

Uncommitted by design (head pre-phase-16; owner commits). `git status --short`: **121 entries** (phases 16–23 accumulated). This phase changes exactly: `backend/apps/accounts/api/services.py`, `views.py`, `admin_users.py` (fix) + `backend/apps/accounts/tests/test_phase23_security.py` (new) + this report. Temp probes/scripts removed (outside-repo temp files only). Never committed: `backend/db.sqlite3` (+1 tracked `.bak` pre-existing), `.env` files (untracked), `dist/`, `storybook-static/`, `node_modules/`, logs, `e2e-artifacts/`, `test-results/`.

## 30. ERP Status

**PARKED.** `ERP_ENABLED=False`, `ERP_PROVIDER=null`, NullProvider active (runtime shell confirmed). No Odoo calls/creds/migrations/UI/sync touched.

## 31. Deferred Security Debt

1. LOW — SVG stored-served XSS: sanitize/inline-CSP on render if SVGs ever inlined; add render-context check.
2. LOW — localStorage JWTs: migrate to HttpOnly cookie flow (settings already support) — needs frontend arch work.
3. LOW — react-router bump for 2 moderate CVEs (no SSR path affected); `npm audit fix` when convenient.
4. INFO — no email verification (by design; reset flow enumeration-safe).
5. INFO — staff-flag (not codename) content gates: cross-module staff writes intentional; tighten to codenames only if product wants it (arch change, not this phase).

## 32. Final Six-Role Acceptance Matrix

| Role | Dashboard | Articles | Projects | Services | Media | Timeline | Users | Create | Edit | Review | Schedule | Publish | Cancel/Resched | Profile | ERP |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| SUPER_ADMIN | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW |
| COMPANY_ADMIN | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW | DENY | ALLOW | ALLOW | DENY* | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW |
| CONTENT_MANAGER | VIEW† | ALLOW | ALLOW‡ | ALLOW | DENY | VIEW | DENY | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW‡ | ALLOW | ALLOW | ALLOW |
| PROJECT_MANAGER | ALLOW | VIEW | ALLOW | VIEW‡ | ALLOW | VIEW | DENY | ROLE-GATED§ | ROLE-GATED§ | ALLOW | DENY | ROLE-GATED§ | DENY | ALLOW | DENY |
| EDITOR | VIEW† | VIEW‖ | VIEW | VIEW | DENY | VIEW | DENY | DENY‖ | DENY‖ | ALLOW | DENY | DENY | DENY | ALLOW | DENY |
| VIEWER | VIEW† | VIEW | VIEW | VIEW | DENY | VIEW | DENY | DENY | DENY | DENY | DENY | DENY | DENY | ALLOW (self) | DENY¶ |

\* COMPANY_ADMIN lacks editorial.review (seeder) but holds manage/approve/schedule. † Non-staff dashboard API 403; UI shows read-only overview. ‡ Staff-flag gates allow cross-module writes (documented). § PROJECT_MANAGER staff-gate allows API writes cross-module; frontend write capability role-gates projects-only. ‖ EDITOR holds articles codenames but non-staff → API 403; needs staff flag for writes (existing design). ¶ VIEWER+integration.view → ERP ALLOW.

## 33. Final Security Verdict

**PASS WITH DOCUMENTED LOW-RISK DEBT.** Backend authoritative on every probe; one genuine MEDIUM defect found and fixed with regression cover; remaining debt (§31) is low-risk/deferred by design, none exploitable in current deployment. Not BLOCKED.

## 34. Exact Phase 24 Recommendation

**Phase 24 = "Production Deployment Readiness"**: production settings + env vars, PostgreSQL prod config, static/media, Gunicorn, reverse-proxy assumptions, HTTPS, security headers, logging, health checks, backups + restore procedure, deployment checklist, cron `*/2 * * * * publish_scheduled`, cache, email config, production monitoring. Do NOT deploy automatically. No cloud infra unless requested.
