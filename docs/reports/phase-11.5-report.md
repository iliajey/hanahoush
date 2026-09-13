# Phase 11.5 Report — Authentication & Super Admin User Management

Date: 2026-09-12
Scope: Phases 11.5 Parts A–V. Phase 12 NOT started. ERP remains parked.

> No credentials, secrets, password hashes, or tokens appear in this report.

---

## 1. Root cause of the reported login failure (Part A)

The seven local development accounts (`superadmin`, `companyadmin`,
`contentmanager`, `projectmanager`, `editor`, `viewer`, `admin`) were
inspected in the live SQLite database (`backend/db.sqlite3`) via the Django
ORM:

| Username | `is_active` | `is_staff` | `is_superuser` | Role | Usable password |
|---|---|---|---|---|---|
| superadmin | true | true | true | SUPER_ADMIN | true |
| companyadmin | true | true | false | COMPANY_ADMIN | true |
| contentmanager | true | true | false | CONTENT_MANAGER | true |
| projectmanager | true | true | false | PROJECT_MANAGER | true |
| editor | false→true\* | false | false | EDITOR | true |
| viewer | true | false | false | VIEWER | true |
| admin | true | true | true | SUPER_ADMIN | true |

\* All accounts were active at inspection time; no repair was required.

ORM-level `authenticate()` succeeded for every account, and — decisively —
the **real HTTP login endpoint** (`POST /api/v1/auth/login/`) returned
`200` with valid `access` + `refresh` tokens plus the correct user payload
for all seven accounts, and `GET /api/v1/auth/me/` returned the correct user
for each token (verified 2026-09-12 against `runserver 127.0.0.1:8000`).

**Root cause: the credentials and the database were healthy. The failure
mode is operational, not data:** with no backend server listening on
`http://localhost:8000`, the frontend (`VITE_API_BASE_URL=
http://localhost:8000/api/v1`) gets `ECONNREFUSED`, the axios client
normalizes it to a generic error, and `LoginForm` renders only the generic
`auth.loginFailed` alert (it never surfaces transport errors). So a user
testing "login" without the backend running sees an identical "login failed"
for every account — exactly the reported symptom. Contributing factors:

- No backend process was running in this environment (verified: nothing
  listening on :8000/:5173 before verification started).
- `LoginForm` shows a generic failure message for both 401s and network
  errors, so a down backend is indistinguishable from bad credentials.
- Account lockout was ruled out (only 2 rows in `LoginAttempt`, no lockout).

No password was changed, no user was recreated, and `db.sqlite3` content
data was never touched to "fix" login.

---

## 2. Account / role state (Parts B–C)

- Database is SQLite (`USE_SQLITE=true` in `backend/.env`); PostgreSQL was
  not touched. `db.sqlite3` was never reset, deleted, or re-migrated from
  PostgreSQL.
- All 6 roles exist: `SUPER_ADMIN`, `COMPANY_ADMIN`, `CONTENT_MANAGER`,
  `PROJECT_MANAGER`, `EDITOR`, `VIEWER` (27 permissions, 92 role-permission
  mappings per the Phase 11 audit).
- All 7 accounts exist, are active, and authenticate — **no repair or
  recreation was necessary**, so no writes to user rows were made by this
  phase beyond normal login-audit/session rows created by verification
  itself.
- Passwords are stored exclusively as Django hashes (`set_password` /
  `create_user`); no plaintext exists anywhere. Password material never
  enters source, bundles, storage, logs, or API responses.

## 3. Authentication verification — real HTTP API (Part D)

Against `http://127.0.0.1:8000/api/v1` (Django `runserver`, SQLite):

| Check | Result |
|---|---|
| `POST /auth/login/` × 7 accounts | ✅ 7 × `200`, `access` + `refresh` present |
| `GET /auth/me/` per token | ✅ 7 × `200`, correct username |
| Roles | ✅ SUPER_ADMIN / COMPANY_ADMIN / CONTENT_MANAGER / PROJECT_MANAGER / EDITOR / VIEWER / SUPER_ADMIN(admin) |
| Permissions count | ✅ 27 / 25 / 16 / 10 / 8 / 6 / 27 |
| Staff flags | ✅ true/true/true/true/false/false/true |
| Superuser flags | ✅ true,false,false,false,false,false,true |
| Wrong password | ✅ `401` |
| `POST /auth/logout/` + refresh reuse | ✅ `200`, then refresh → `401` (blacklisted) |
| Registration still works | ✅ covered by `test_registration.py` (backend) |
| Profile read/update | ✅ covered by `test_auth_api.py` (backend) |

## 4. Super Admin User Management (Parts E–M)

The management surface (introduced in the `passwords` commit) was audited
and verified end-to-end; no second RBAC system was created.

**Backend** (`backend/apps/accounts/api/`):

- `admin_users.py` — `AdminUserViewSet` at `/api/v1/admin/users/` with
  `permission_classes=[IsSuperAdmin]` (Django superuser OR `SUPER_ADMIN`
  role) on **every** operation. `http_method_names` excludes `DELETE`
  (deactivation is the only off-boarding path). List supports `?search=`,
  `?role=`, `?is_active=`, `?is_staff=`, `?ordering=`, pagination.
  Extra actions: `POST {id}/set-password/`, `POST {id}/activate/`,
  `POST {id}/deactivate/`, `GET roles/` (role catalog with permissions for
  the read-only permission viewer).
- `AdminUserCreateSerializer` accepts a write-only `password` /
  `confirm_password` pair and persists via `set_password` only.
  `AdminUserSerializer` never serializes password material.
  `is_superuser` is not a writable field anywhere.
- Self-protection (backend-enforced): cannot self-deactivate, cannot remove
  own `is_staff`, cannot demote own `SUPER_ADMIN` role; cannot deactivate
  the last active superuser.
- `permissions.py` — `IsSuperAdmin` is the single gate; no parallel system.
- No new models or migrations in this phase (`0003_alter_loginaudit_event`
  remains latest; `makemigrations --check` clean).

**Frontend** (`frontend/src/features/users/` + existing auth guards):

- Route `/dashboard/users` → `RequireSuperAdmin` → `UsersWorkspacePage`
  (`src/app/routes/index.tsx`); registered in `workspaceConfig.ts` with the
  `USER_MANAGE` capability (`superAdminOnly`), so the sidebar entry is
  hidden for all other roles and direct navigation is still blocked by the
  guard + backend `403`.
- `UsersWorkspacePage`: responsive table (name/username/email/role/staff/
  active/last-login), search, role/active/staff filters, sorting
  (`username`, `date_joined`, `last_login`), pagination, detail / edit /
  activate / deactivate actions, role-permission viewer dialog.
- `UserFormDialog`: create (write-only password pair) vs edit (no password
  fields at all); roles come only from `GET …/admin/users/roles/`.
- `UserDetailDialog` + `RolePermissionsDialog`: read-only permission display
  grouped by module; separate controlled password-reset action.
- `PermissionViewer` also exists under `features/auth` for the profile page.

## 5. RBAC matrix — measured, not assumed (Part L)

Measured via real HTTP against `/api/v1/admin/users/`:

| Actor | `GET /admin/users/` | Frontend `/dashboard/users` |
|---|---|---|
| Anonymous | `401` | redirected to `/login` |
| SUPER_ADMIN (`superadmin`, `admin`) | `200` | visible + accessible |
| COMPANY_ADMIN | `403` | hidden; direct nav → `/unauthorized` |
| CONTENT_MANAGER | `403` | hidden; direct nav → `/unauthorized` |
| PROJECT_MANAGER | `403` | hidden; direct nav → `/unauthorized` |
| EDITOR | `403` | hidden; direct nav → `/unauthorized` |
| VIEWER | `403` | hidden; direct nav → `/unauthorized` |

Backend is authoritative; the frontend only mirrors the gate for
navigation. The frontend capability matrix test now pins
`USER_MANAGE: true` for SUPER_ADMIN and `false` for everyone else.

## 6. Localization & accessibility (Parts N–O)

- `users` + `roles` namespaces verified present in `fa`, `en`, and `ar`
  translation catalogs; role names resolve via `roles.<CODENAME>.name`.
- Dialogs use `Label`/`aria-describedby`/`aria-invalid` error wiring,
  `role="alert"` / `aria-live="polite"` states, `sr-only` table caption,
  logical CSS properties (`start-`, `ps-`, `ms-`, `rtl:rotate-180`) for RTL.
- Mobile: table scrolls horizontally (`overflow-x-auto`), email/staff/
  last-login columns collapse below `md`/`lg` breakpoints.

## 7. Security audit (Part P)

- Every user-management operation requires `IsSuperAdmin` server-side;
  anonymous → `401`, authenticated non-authorized → `403` (measured).
- No password or hash is ever serialized (verified in `AdminUserSerializer`,
  `UserSerializer`, `ManagedUser` type, and both dialogs).
- No JWT leakage: tokens live in `localStorage` via `tokenStorage`
  (pre-existing architecture, unchanged) and travel only as
  `Authorization: Bearer`; logout blacklists + revokes sessions.
- No role/permission escalation: roles assignable only by codename from the
  backend catalog; `is_superuser` unwritable; permission sets are read-only
  (no mutation endpoint exists).
- No IDOR beyond the intentional admin surface: object access is still gated
  by `IsSuperAdmin`; self-protection guards block lockout paths.
- No secrets in the frontend bundle (grep: no hardcoded credentials/keys;
  the single `api_key` string match is an analytics allowlist key name).
- No alternate API-key auth exists in the accounts app.

## 8. Tests & builds (Part Q)

| Check | Result |
|---|---|
| `manage.py check` | ✅ no issues |
| `makemigrations --check` | ✅ no changes |
| Backend pytest (full suite, SQLite) | ✅ **316 passed** (incl. 55 accounts tests: auth/registration/admin-users) |
| `npm run typecheck` (`tsc --noEmit`) | ✅ 0 errors (after fixes below) |
| `npm run lint` | ✅ 0 errors |
| `npm run test` (vitest) | ✅ **216 passed** (36 files) |
| `npm run build` | ✅ (incl. `UsersWorkspacePage` chunk) |
| `npm run build-storybook` | ✅ |

Fixes made by this phase (all verified by the green runs above):

1. `src/features/auth/guards/index.ts` — missing newline fused two export
   statements into a syntax error; split into two lines.
2. `src/features/auth/tests/fixtures.ts` — fixtures lacked the required
   `is_superuser` field; added it (`true` for SUPER_ADMIN fixture and the
   `admin` superuser fixture, `false` otherwise).
3. `src/features/users/hooks.ts` — imported payload types from `./api`
   (which only imports them); now imports types from `./types`.
4. `src/features/auth/tests/authorize.test.ts` — capability matrix and
   SUPER_ADMIN nav expectation predated the `users` route; pinned
   `USER_MANAGE` (`true` for SUPER_ADMIN via the all-true factory,
   `false` for the other five roles) and added `"users"` to the expected
   SUPER_ADMIN nav links.

## 9. Browser verification (Part R)

**Playwright browser verification could not run in this environment:**
`@playwright/test 1.62.1` is installed but no browser binary is present
(`ms-playwright/chromium-1234` missing) and `npx playwright install
chromium --only-shell` failed (download error, offline/restricted
network). This is stated explicitly per the phase instructions rather than
claimed. Compensating evidence: the real HTTP API consumed by the frontend
was exercised directly (Section 3 + RBAC matrix), and the full vitest
suite (216), production build, and Storybook build are green. The repo
retains the e2e harness (`frontend/e2e/`, incl. `roles.spec.ts` and
`workspace.spec.ts`) for environments with browsers available.

## 10. Database safety (Part S)

`backend/db.sqlite3` was never reset, deleted, or migrated from
PostgreSQL. Before/after row counts (only auth-audit side effects differ):

| Table | Before | After | Δ |
|---|---|---|---|
| accounts.User | 8 | 8 | 0 |
| accounts.Role | 6 | 6 | 0 |
| accounts.Permission | 27 | 27 | 0 |
| accounts.LoginAudit | 648 | 672 | +24 (verification logins) |
| accounts.LoginAttempt | 2 | 2 | 0 |
| accounts.UserSession | 525 | 547 | +22 (verification sessions) |
| articles.Article / Category / Tag | 29 / 3 / 6 | same | 0 |
| projects.Project / Technology / Category | 5 / 7 / 3 | same | 0 |
| services.Service / ServiceSection | 4 / 2 | same | 0 |
| company.* (About/Partner/Testimonial/FAQ/Settings) | 1/5/4/6/1 | same | 0 |
| analytics.* (ContactRequest 8, Events 2558, NewsletterSubs 8) | same | same | 0 |
| page_builder.Page / PageSection / SectionConfig | 6/53/50 | same | 0 |
| editorial.Workflow / Stage / Revision / Approval | 21/7/9/5 | same | 0 |
| media_library.MediaFile | 19 | 19 | 0 |

## 11. ERP (Part T)

Parked. Runtime settings confirm `ERP_ENABLED=false`,
`ERP_PROVIDER=null` (`NullProvider`, no network calls). No Odoo calls,
credentials, models, migrations, or sync added by this phase.

## 12. Known issues & deferred work

- `LoginForm` still shows a generic message for network errors; a future
  pass could distinguish "server unreachable" from "invalid credentials"
  (helps operators diagnose a down backend faster).
- Real-browser matrix (FA/EN/AR × desktop/mobile × light/dark, Users
  create/edit/role-assign flows) remains to be run where Playwright
  browsers are available.
- **Phase 12 has NOT started**: no Services/Pages/Company/Analytics CMS
  surfaces were added.

## 13. Definition of Done

1. ✅ Root cause known (backend not running; accounts healthy).
2. ✅ Six users log in through the real login API.
3. ✅ Django superuser (`admin`) logs in.
4. ✅ Roles/permissions correct per account.
5. ✅ Super Admin User Management present and secure.
6. ✅ Other roles blocked (403 + hidden nav + guard).
7. ✅ Backend enforces the boundary on every operation.
8. ✅ Registration still works (tests).
9. ✅ Profile still works (tests).
10. ✅ FA/EN/AR catalogs present.
11. ✅ RTL via logical properties.
12. ✅ Data intact (table above).
13. ✅ Tests pass (316 backend / 216 frontend).
14. ✅ Builds pass (app + Storybook).
15. ⚠️ Browser verification unavailable (stated explicitly with cause).
16. ✅ ERP disabled.
17. ✅ Documentation complete (this report + CHANGELOG + NEXT_PHASE).

STOP — Phase 12 not started.
