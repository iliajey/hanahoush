# Phase 12 Report — Admin User Management + Account Management + Final Auth Hardening

Date: 2026-09-12
Scope: Phase 12 Parts A–S. ERP remains parked (`ERP_ENABLED=false`, `ERP_PROVIDER=null`).

> No credentials, secrets, password hashes, or tokens appear in this report.

---

## 1. Audit findings (Part A)

Backend auth (`backend/apps/accounts/`) was already complete and correct from
Phase 11.5: `User` (`AbstractUser` + `role` FK + `phone` + `preferred_language`),
6 system roles, 27-permission catalog, `LoginAudit` / `LoginAttempt` /
`UserSession`, `IsSuperAdmin`-gated `AdminUserViewSet` at
`/api/v1/admin/users/` (no DELETE, write-only password pair, `is_superuser`
unwritable, self-lockout guards, session revocation on reset/deactivate).

Frontend (`frontend/src/features/auth/` + `features/users/`) was already
largely complete: `UsersWorkspacePage` (search, role/active/staff filters,
sorting, pagination), `UserFormDialog` (create/edit), `UserDetailDialog`
(facts + permission viewer + set-password), `RolePermissionsDialog`,
`RequireSuperAdmin` route guard, FA/EN/AR parity with RTL logical props.

Gaps found and closed in Phase 12:

| # | Gap | Fix |
|---|---|---|
| 1 | No routed pages — `/dashboard/users/new`, `/:id`, `/:id/edit` missing (dialogs only) | New routed pages reusing the same API/hooks/schemas |
| 2 | No confirmation before activate/deactivate | `ConfirmActionDialog` on list + detail flows |
| 3 | `preferred_language` absent from admin API + admin forms | Serializer fields + form/schema/type/i18n support |
| 4 | Update/activate/deactivate wrote no audit rows | `LoginAudit` rows on every admin mutation |
| 5 | Last-admin guard covered only the `is_superuser` flag, not the `SUPER_ADMIN` role | Strict last-role-holder guard on demote + deactivate |
| 6 | No safe account-health check command | `verify_auth_accounts` management command (read-only, never prints passwords) |
| 7 | `RegisterPage` used `<a href="/login">` (full reload) | React Router `Link` |
| 8 | `ProfileMenu` had no Profile entry; sidebar footer linked to `/dashboard` | Profile entries added |
| 9 | `ProfilePage` returned `null` while loading | Skeleton loading state |
| 10 | Role selector showed names only | `RoleSelect` with description + permission count |

No second RBAC, user, role, permission, auth API, CMS, or logging system was
created. The backend remains the authoritative security boundary.

---

## 2. Implementation

### Backend (`backend/apps/accounts/`)

- `api/admin_users.py`
  - `AdminUserSerializer` + `AdminUserWriteSerializer`: `preferred_language`
    readable/writable (validated by model choices `fa/en/ar`).
  - `_is_last_super_admin_holder()`: strict last `SUPER_ADMIN`-role-holder
    check (refused even when a Django-superuser flag exists elsewhere, so the
    role-based admin path can never silently disappear).
  - `_last_admin_errors()`: blocks demoting/deactivating the last admin
    holder for non-self targets (self-targets already refused).
  - `deactivate` action: also refuses the last role holder.
  - Audit: `update` / `activate` / `deactivate` write `LoginAudit` rows with
    `detail=admin_user_updated:<what>` (`role_changed:OLD->NEW`,
    `activated`, `deactivated`). `create` (`register/admin_created`) and
    `set-password` (`password_change/admin_reset`) already audited.
  - No migration required (no model changes).
- `management/commands/verify_auth_accounts.py` (new): read-only check of the
  6 demo accounts + `admin` (existence, role, active, staff/superuser flags,
  usable password). Never prints passwords. Exit 1 on any failure.
- `tests/test_admin_users.py`: +9 tests — `preferred_language` read/update/
  invalid rejection, audit rows on update/role-change/activate/deactivate,
  audit secret-freedom, cannot demote/deactivate the last `SUPER_ADMIN`
  holder.

### Frontend (`frontend/src/`)

- `features/users/pages/UserCreatePage.tsx` (new): `/dashboard/users/new`.
- `features/users/pages/UserDetailPage.tsx` (new): `/dashboard/users/:id`
  (avatar, facts, language, permission summary, edit/set-password/
  activate-deactivate with confirmation, back link).
- `features/users/pages/UserEditPage.tsx` (new): `/dashboard/users/:id/edit`.
- `features/users/components/ConfirmActionDialog.tsx` (new): explicit
  confirmation for activate/deactivate; names the account, explains the
  consequence, surfaces backend refusal verbatim.
- `features/users/components/RoleSelect.tsx` (new): backend-catalog roles
  with localized name + description + permission count.
- `features/users/pages/UsersWorkspacePage.tsx`: list now navigates to routed
  create/edit/detail; activate/deactivate go through `ConfirmActionDialog`;
  modal dialogs removed from the page (components kept, still exported).
- `features/users/{types,schemas,api,hooks}`: `preferred_language` end to end.
- `app/routes/index.tsx`: `users/new`, `users/:id`, `users/:id/edit` under
  `RequireSuperAdmin`.
- Auth fixes: `RegisterPage` `Link`, `ProfileMenu` Profile entry, sidebar
  footer → `/dashboard/profile`, `ProfilePage` skeleton while loading.
- i18n: `users.fields.language`, `users.actions.backToUsers`,
  `users.confirm.*`, `users.detail.*`, `users.roleSelect.permissionCount*` in
  FA/EN/AR (parity test green).
- Tests (`features/users/tests/`): schemas (5), components incl.
  secret-freedom (4), route guards incl. superuser + blocked roles (4).

---

## 3. API changes

- `GET/PATCH /api/v1/admin/users/` + `GET /:id/` now include
  `preferred_language`; `PUT/PATCH` accept it.
- New refusal cases (400): demoting/deactivating the last `SUPER_ADMIN`
  role holder (`Cannot remove/deactivate the last SUPER_ADMIN role holder`).
- New audit rows on update/activate/deactivate (no new endpoints, no schema
  change, no migration).

## 4. Frontend changes

New routes (all `RequireSuperAdmin`):

- `/dashboard/users` (list, existing, routed actions + confirmations)
- `/dashboard/users/new`
- `/dashboard/users/:id`
- `/dashboard/users/:id/edit`

Auth/nav fixes: register link, profile menu entry, sidebar profile link,
profile loading state. No login identifier change (still USERNAME).

## 5. RBAC matrix (verified live + tests)

| Caller | `GET /admin/users/` | mutate |
|---|---|---|
| anonymous | 401 | 401 |
| VIEWER / EDITOR / PROJECT_MANAGER / CONTENT_MANAGER / COMPANY_ADMIN | 403 | 403 |
| SUPER_ADMIN (`superadmin`) / superuser (`admin`) | 200 | 200 |

Frontend mirrors with `RequireSuperAdmin` (UX only). Backend tests cover
anonymous 401, per-role 403, super paths, no-DELETE, `is_superuser`
unwritable, self-protection, last-admin, secret non-exposure. Browser test
covers viewer-blocked-on-all-3-routes.

## 6. Security decisions

- Backend enforces everything; frontend guards are UX-only.
- No passwords/hashes/tokens in UI, API payloads, audit details, logs, or
  reports (asserted by tests).
- Audit reuses `LoginAudit` (no second logging system). Admin mutations use
  the existing `password_change` event with an `admin_user_updated:` detail
  prefix — semantically imperfect but migration-free; a dedicated event
  choice is deferred (see §10).
- Last-`SUPER_ADMIN`-holder guard is strict: Django-superuser coverage does
  not exempt demote/deactivate of the last role holder.
- No credentials stored in frontend; e2e credentials live in an untracked
  temp file outside the repo.

## 7. Tests

| Suite | Result |
|---|---|
| Backend pytest (`backend/`) | **325 passed** (316 pre-existing + 9 new) |
| `manage.py check` | clean |
| `makemigrations --check` | no changes |
| Frontend typecheck | 0 errors |
| Frontend lint | 0 errors |
| Frontend vitest | **229 passed** (216 + 13 new), 39 files |
| i18n parity (fa/en/ar) | 4/4 green |
| `npm run build` | pass |
| `npm run build-storybook` | pass |
| Playwright (system Edge, live stack) | **2/2 passed** (`e2e/user-admin.spec.ts`) |

## 8. Database verification (Part Q)

Source of truth `backend/db.sqlite3` — never reset, no migrations added.

| Table proxy | Before | After |
|---|---|---|
| users | 8 (7 expected + pre-existing `p115_smoke_user`) | 8 |
| roles | 6 | 6 |
| permissions | 27 | 27 |

Only `LoginAudit`/`UserSession`/`LoginAttempt` rows grew (expected from live
verification logins). No content data touched.

## 9. Seven-account verification (Parts H, P)

Live `runserver 127.0.0.1:8000`, per account `login → /me → /admin/users`
access → wrong-password rejection: **28/28 checks passed**.

| Account | login | /me | users access | bad password rejected |
|---|---|---|---|---|
| superadmin | PASS | PASS | 200 PASS | PASS |
| companyadmin | PASS | PASS | 403 PASS | PASS |
| contentmanager | PASS | PASS | 403 PASS | PASS |
| projectmanager | PASS | PASS | 403 PASS | PASS |
| editor | PASS | PASS | 403 PASS | PASS |
| viewer | PASS | PASS | 403 PASS | PASS |
| admin | PASS | PASS | 200 PASS | PASS |

`verify_auth_accounts` management command: all account checks passed
(roles, staff/superuser flags, active, usable passwords). No passwords
changed, no users recreated.

## 10. Known issues

1. Admin audit rows reuse the `password_change` event with an
   `admin_user_updated:` detail prefix (no dedicated `EVENT_*` choice, to
   avoid a migration). A dedicated audit event + read API is deferred.
2. `IsAdminUser`/`IsStaffOrAdmin`/`IsStaffOrReadOnly` still reference a
   non-seeded `admin` role codename (pre-existing; only the `is_superuser` /
   `is_staff` branches are effective). Unchanged by Phase 12.
3. `LoginForm` still shows the generic failure for transport errors
   (pre-existing 11.5 finding; unchanged).
4. Pre-existing `p115_smoke_user` row remains in `db.sqlite3` (left intact
   deliberately; not created by Phase 12).

## 11. Deferred work

- Dedicated audit event choices + read API for `LoginAudit`/`UserSession`.
- Session list/revoke UI (backend revokes on reset/deactivate; no per-session
  management surface yet).
- Role editing UI (roles remain system-defined, assignment-only).
- Full 143-scenario Playwright matrix re-run (Phase 12 ran a focused 2-test
  spec; full matrix last green in Phase 10/11.5 with no regressions
  introduced since — only additive routes/components).

## 12. ERP status (Part R)

Parked. `ERP_ENABLED=false`, `ERP_PROVIDER=null`, `NullProvider` active. No
Odoo requests, credentials, models, sync, or migrations. Untouched.

---

## Files created

- `backend/apps/accounts/management/__init__.py`
- `backend/apps/accounts/management/commands/__init__.py`
- `backend/apps/accounts/management/commands/verify_auth_accounts.py`
- `frontend/src/features/users/pages/UserCreatePage.tsx`
- `frontend/src/features/users/pages/UserDetailPage.tsx`
- `frontend/src/features/users/pages/UserEditPage.tsx`
- `frontend/src/features/users/components/ConfirmActionDialog.tsx`
- `frontend/src/features/users/components/RoleSelect.tsx`
- `frontend/src/features/users/tests/users.schemas.test.ts`
- `frontend/src/features/users/tests/users.components.test.tsx`
- `frontend/src/features/users/tests/users.routes.test.tsx`
- `frontend/e2e/user-admin.spec.ts`
- `docs/reports/phase-12-report.md` (this file)

## Files modified

- `backend/apps/accounts/api/admin_users.py`
- `backend/apps/accounts/tests/test_admin_users.py`
- `frontend/src/app/routes/index.tsx`
- `frontend/src/app/layouts/StaffSidebar.tsx`
- `frontend/src/features/users/index.ts`
- `frontend/src/features/users/types.ts`
- `frontend/src/features/users/schemas.ts`
- `frontend/src/features/users/pages/UsersWorkspacePage.tsx`
- `frontend/src/features/users/components/UserFormDialog.tsx`
- `frontend/src/features/auth/pages/RegisterPage.tsx`
- `frontend/src/features/auth/components/ProfileMenu.tsx`
- `frontend/src/features/auth/pages/ProfilePage.tsx`
- `frontend/src/i18n/locales/{en,fa,ar}/translation.json`
- `CHANGELOG.md` (see below)
- `NEXT_PHASE.md` + `docs/reports/next-phase.md` (see below)
