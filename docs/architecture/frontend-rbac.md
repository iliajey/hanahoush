# Frontend RBAC Architecture (Phase 9G)

## Overview

Hanahoush has exactly **one** role/permission system, defined and enforced by the Django
backend (`apps/accounts`). Phase 9G adds a *frontend authorization layer* that consumes
that single source of truth for navigation, route protection and action visibility. The
backend remains the authoritative security boundary; the frontend layer is UX-only.

- Backend authoritative objects: `Role`, `Permission`, `User.role`, `User.is_staff`
  (`apps/accounts/models.py`, `apps/accounts/seeders.py`).
- Backend authoritative serialization: `GET /api/v1/auth/me/` and the login payload both
  return the current user's `role` (nested `{id, name, codename}`) plus a
  `permissions[]` array of codenames (`UserSerializer`,
  `apps/accounts/api/serializers.py`). Superusers receive the full catalog.
- The JWT itself carries only standard claims (`user_id`, `exp`, `iat`, `jti`) — the
  frontend never parses role/permission data out of the token.
- The Django superuser (`admin`) is represented as a staff user with a full permission
  list and no primary role; the frontend treats it as staff with `SUPER_ADMIN`-equivalent
  capabilities through the shared capability rules.

## Principles

1. **No second role system.** The frontend mirrors the backend catalog in typed
   constants, never in free-form role checks inside components.
2. **Authorization is UX, not security.** Every protected backend operation is still
   enforced by the backend ACL. A forged user object can only affect what the UI shows.
3. **Centralization.** All role/permission strings and decision helpers live under
   `src/features/auth/`. Components use `useAuthorization()` or the workspace route
   metadata.
4. **Freshness.** The user object (including `role` + `permissions`) is loaded from
   `/auth/me/` on app start and refreshed from the authenticated session on demand —
   never trusted from `localStorage` (only JWT tokens live there, and they are not
   parsed for any authorization decision).

## Module map

```
src/features/auth/
  types/            UserProfile, RoleBrief, AuthStatus, login/profile payloads
  permissions/      PERMISSIONS (codenames), hasPermission/hasAnyPermission/
                    hasAllPermissions/hasRole/hasAnyRole/isStaffUser
  role-config/      ROLE_CODES, ROLE_CATALOG (role definitions ↔ i18n keys),
                    CAPABILITIES (capability keys) + canUseCapability/grantedCapabilities
  guards/           AuthorizationGate + RequirePermission / RequireAnyPermission /
                    RequireRole / RequireStaff
  hooks/            useUser, useAuthorization, useLogin, useLogout, useRoles/Permissions
  services/         AuthProvider (context; login/logout/refreshUser via /auth/me/)
  api/              thin typed wrappers over the shared axios client
  components/       ProtectedRoute, GuestRoute, ProfileMenu, UserAvatar, LoginForm
  pages/            Login, ForgotPassword, ResetPassword, Unauthorized, SessionExpired
  utils/            getDisplayName etc.
```

### Permission catalog (`permissions/types.ts`)

`PERMISSIONS` is a typed, frozen object mirroring the backend catalog
(`apps/accounts/seeders.py` → `PERMISSION_DEFINITIONS`, 27 codenames):

- `articles.view/create/update/delete/publish`
- `projects.view/create/update/delete/publish`
- `services.view/create/update/delete`
- `company.view/update`
- `media.upload/manage`
- `analytics.view`
- `users.manage`, `roles.manage`
- `editorial.view/manage/approve/review/schedule`
- `integration.view`

`PERMISSION_MODULES` groups them by module for the profile permission summary. The
`ALL_PERMISSIONS` constant mirrors the superuser grant.

### Role catalog (`role-config/roles.ts`)

`ROLE_CODES` covers the six seeded roles (`SUPER_ADMIN`, `COMPANY_ADMIN`,
`CONTENT_MANAGER`, `PROJECT_MANAGER`, `EDITOR`, `VIEWER`). `ROLE_CATALOG` maps each
codename to i18n keys (`roles.*`, `dashboard.host.role.*`) and a UX category
(`operations | content | editorial | readonly`). `getRoleDefinition()` falls back to a
neutral "Custom role" definition for future backend roles — no hardcoded component checks.

### Capabilities (`role-config/capabilities.ts`)

Capabilities abstract "can this user perform X" from raw permission strings and encode
the backend gates that codenames don't capture:

| Capability | Rules | Notes |
|---|---|---|
| `DASHBOARD` | authenticated | role-aware dashboard landing |
| `CONTENT_ARTICLES` | `articles.view` **+ staff** | backend writes are `IsStaffOrReadOnly` |
| `CONTENT_PROJECTS` | `projects.view` **+ staff** | same |
| `CONTENT_ARTICLES_WRITE` / `CONTENT_PROJECTS_WRITE` | `articles.update` / `projects.update` **+ staff** | gating *create/edit/filter* actions, not the whole route |
| `EDITORIAL` | `editorial.view` | review queue read |
| `EDITORIAL_REVIEW` / `MANAGE` / `APPROVE` / `SCHEDULE` | matching codename (+ `SCHEDULE` also allows `MANAGE`) | |
| `MEDIA_LIBRARY` | `media.upload` OR `media.manage` **+ staff** | backend media API is DRF `IsAdminUser` |
| `MEDIA_UPLOAD` / `MEDIA_MANAGE` | matching codename **+ staff** | metadata/delete gated on `media.manage` |
| `CONTACT_MANAGE` | **staff** | no dedicated codename in the catalog |
| `NEWSLETTER_MANAGE` | **staff** | same |
| `ANALYTICS` | `analytics.view` | drives the dashboard engagement section |
| `SYSTEM` | **staff** | system-health widgets |

`canUseCapability(user, key)` evaluates `staffOnly` then `requiresAll`/`requiresAny` on
the *caller-supplied* user object; `grantedCapabilities(user)` returns the full set.

## Authorization hook

`useAuthorization()` (`hooks/useAuthorization.ts`) exposes a single, memoized facade:

- `user` — resolved from `AuthProvider`
- `hasRole(codename)`, `hasAnyRole(codenames)`
- `hasPermission(code)`, `hasAnyPermission(codes)`
- `isStaff`
- `can(capability)` — the preferred action-level API
- `capabilities` — the granted capability set

Components call `useAuthorization()`; they never import the raw permission arrays unless
building a route/action explicitly (e.g. `RouteGuard` in `app/routes/index.tsx`).

## Route authorization

All staff routes live under `/dashboard`, wrapped in `ProtectedRoute` (authentication
enforcement) + `StaffLayout` (workspace shell), and each child is additionally wrapped in
a permission guard from `features/auth/guards`:

- `RequirePermission` / `RequireAnyPermission` / `RequireRole` / `RequireStaff` all
  delegate to the single `AuthorizationGate`, which resolves:
  - `loading` → full-screen loader
  - `guest` → `/login` (return location preserved in navigation state)
  - `session-expired` → `/session-expired`
  - authenticated but unauthorized → `/unauthorized`
  - authorized → children
- Redirect-loop safety: `/login`, `/unauthorized`, `/session-expired` are unguarded.
- Public marketing routes are untouched and remain fully public.

`workspaceConfig` (`app/workspace/workspaceConfig.ts`) is the **single** permission-aware
route metadata table; the sidebar (`StaffSidebar`) filters by `workspaceNavForUser`, and
the route guard uses the same capability constants — navigation and route protection
cannot drift apart.

## Security model

- The JWT (access/refresh) is persisted in `localStorage` by the existing Phase 6/8H
  token storage and injected via the axios interceptor; **no role/permission data is
  stored client-side**, and refresh uses the standard `/auth/refresh/` + blacklist flow.
- `frontend authorization is not security`: role/permission state is refreshed from
  `/auth/me/`, never trusted for API calls; the backend ACL remains authoritative.
- The staff clients never reference `unsubscribe_token`, and subscriber/contact data is
  only reachable through staff-only endpoints (guards mirror those gates).
- No admin credentials or alternate API keys are embedded anywhere in the frontend.

## Testing

Frontend authorization is covered by unit + component tests against role fixtures that
mirror the backend seeders exactly (`features/auth/tests/fixtures.ts`):

- `authorize.test.ts` — pure permission/role helpers
- `guards.test.tsx` — allowed/forbidden routes for each guard
- `auth.routes.test.tsx` — `ProtectedRoute`/`GuestRoute` flows
- `workspace-permissions.test.ts` — per-workspace action rules + newsletter token privacy
- `app/workspace/tests/navigation.test.tsx` — per-role sidebar links + RTL/localization
- `features/dashboard/tests/dashboard.test.tsx` — role-aware dashboard widgets

See `docs/reports/phase-09G-report.md` for the full verification matrix.