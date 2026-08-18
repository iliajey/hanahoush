# Hanahoush — Phase 6 Report: Enterprise Authentication & Authorization

> Date: 2025-08-04

---

## Executive Summary

This phase delivered **end-to-end authentication and authorization** for the
Hanahoush platform: a JWT-based auth API on the Django REST Framework backend
(SimpleJWT) and a complete `features/auth/` slice on the React frontend
(login/logout/refresh/me/password-reset/profile + route guards + automatic
token refresh with retry-once and logout-on-refresh-failure).

Security controls include account lockout, login audit logging, session
tracking, rate limiting, refresh-token blacklist/rotation, Django password
validators, and role/object permission classes. All 12 auth endpoints are
documented in OpenAPI.

**Verification:** backend 64 tests pass, frontend 27 tests pass, TypeScript,
ESLint, Vite build and Storybook build all green.

---

## Objectives Achieved

- [x] JWT authentication (login / logout / refresh / me)
- [x] Change password + profile endpoint
- [x] Role & permission endpoints
- [x] Password validation, rate-limiting hooks, account-lock structure
- [x] Audit login log + session-tracking structure
- [x] Token rotation ready + refresh-token blacklist
- [x] CSRF preparation
- [x] Role-based + object permission classes
- [x] Frontend `features/auth/` slice (api/components/hooks/pages/schemas/types/utils/services)
- [x] Login / Forgot / Reset / Unauthorized / Session-Expired pages
- [x] Login Form, Password Input, Remember Me, Profile Menu, User Avatar
- [x] React Hook Form + Zod + TanStack Query + Axios
- [x] Protected Route + Guest Route + protected dashboard
- [x] Automatic JWT injection, automatic refresh, retry once, logout on refresh failure
- [x] Backend, frontend, integration & auth-flow tests
- [x] API documentation (AUTH_FLOW.md, OpenAPI)

---

## Files Created

### Backend
| Path | Purpose |
|------|---------|
| `apps/accounts/api/__init__.py` | Accounts API package |
| `apps/accounts/api/serializers.py` | Login/Logout/Profile/ChangePassword/Reset/User/Role/Permission serializers |
| `apps/accounts/api/views.py` | Auth views (login, logout, refresh, me, profile, change-password, reset, roles, permissions) |
| `apps/accounts/api/urls.py` | Auth URL routes |
| `apps/accounts/api/permissions.py` | `IsAdminUser`, `HasRole`, `HasPermission`, `IsOwnerOrReadOnly` |
| `apps/accounts/api/throttles.py` | Scoped throttle classes |
| `apps/accounts/api/services.py` | Lockout, audit, session-tracking services |
| `apps/accounts/migrations/0002_loginattempt_loginaudit_usersession.py` | Security models migration |
| `apps/accounts/tests/test_auth_api.py` | 20 auth API tests |

### Frontend
| Path | Purpose |
|------|---------|
| `src/features/auth/index.ts` | Auth feature barrel |
| `src/features/auth/types/index.ts` | Auth domain types |
| `src/features/auth/api/authApi.ts` | Typed auth API wrappers |
| `src/features/auth/schemas/index.ts` | Zod schemas |
| `src/features/auth/services/AuthProvider.tsx` | Auth state provider |
| `src/features/auth/utils/index.ts` | Error/display helpers |
| `src/features/auth/hooks/useAuth.ts` | useAuth hook |
| `src/features/auth/hooks/useLogin.ts` | Login mutation |
| `src/features/auth/hooks/useLogout.ts` | Logout mutation |
| `src/features/auth/hooks/useUser.ts` | Current-user hook |
| `src/features/auth/hooks/useChangePassword.ts` | Change-password mutation |
| `src/features/auth/hooks/useRolesPermissions.ts` | Roles/permissions queries |
| `src/features/auth/components/LoginForm.tsx` | RHF + Zod login form |
| `src/features/auth/components/PasswordInput.tsx` | Show/hide password input |
| `src/features/auth/components/RememberMe.tsx` | Remember-me checkbox |
| `src/features/auth/components/ProfileMenu.tsx` | User dropdown |
| `src/features/auth/components/UserAvatar.tsx` | Avatar with initials |
| `src/features/auth/components/ProtectedRoute.tsx` | Auth guard |
| `src/features/auth/components/GuestRoute.tsx` | Guest guard |
| `src/features/auth/pages/AuthShell.tsx` | Centered auth layout |
| `src/features/auth/pages/LoginPage.tsx` | Login page |
| `src/features/auth/pages/ForgotPasswordPage.tsx` | Forgot-password page |
| `src/features/auth/pages/ResetPasswordPage.tsx` | Reset-password page |
| `src/features/auth/pages/UnauthorizedPage.tsx` | 403 page |
| `src/features/auth/pages/SessionExpiredPage.tsx` | Session-expired page |
| `src/features/auth/tests/auth.schemas.test.ts` | Schema tests |
| `src/features/auth/tests/auth.utils.test.ts` | Util tests |
| `src/features/auth/tests/auth.axios.test.ts` | Refresh-interceptor tests |
| `src/features/auth/tests/auth.routes.test.tsx` | Route-guard tests |
| `src/components/ui/dropdown-menu.tsx` | Radix dropdown wrapper |
| `src/app/routes/pages/DashboardPage.tsx` | Protected dashboard placeholder |
| `AUTH_FLOW.md` | Authentication flow documentation |

---

## Files Modified

| Path | Change |
|------|--------|
| `config/settings/base.py` | Added `token_blacklist` app; throttle rates; lockout settings; short-session & frontend-URL settings |
| `config/api/v1.py` | Mounted `/auth/` routes |
| `backend/.env.example` + `.env` | Added auth/security env vars |
| `config/settings/ci.py` | Raised throttle limits for deterministic tests |
| `src/app/providers/AppProviders.tsx` | Added `AuthProvider` |
| `src/app/layouts/Navbar.tsx` | Profile menu when authenticated, Login link otherwise |
| `src/app/routes/index.tsx` | Auth routes + guards + protected dashboard |
| `src/shared/api/axiosClient.ts` | Real auto-refresh, retry-once, auth-failure event, no-refresh URLs |
| `src/shared/api/tokenStorage.ts` | (reused) token persistence |
| `src/shared/types/api.ts` | Added `TokenRefreshEnvelope` |
| `src/i18n/locales/{en,fa,ar}/translation.json` | Added `auth` namespace |
| `CHANGELOG.md` | Added Phase 6 |

---

## Folder Tree (changed folders only)

```
backend/
└── apps/accounts/
    ├── api/
    │   ├── __init__.py
    │   ├── serializers.py
    │   ├── views.py
    │   ├── urls.py
    │   ├── permissions.py
    │   ├── throttles.py
    │   └── services.py
    ├── migrations/0002_loginattempt_loginaudit_usersession.py
    └── tests/test_auth_api.py

frontend/
└── src/
    ├── features/auth/
    │   ├── api/authApi.ts
    │   ├── components/{LoginForm,PasswordInput,RememberMe,ProfileMenu,UserAvatar,ProtectedRoute,GuestRoute}.tsx
    │   ├── hooks/{useAuth,useLogin,useLogout,useUser,useChangePassword,useRolesPermissions}.ts
    │   ├── pages/{AuthShell,LoginPage,ForgotPasswordPage,ResetPasswordPage,UnauthorizedPage,SessionExpiredPage}.tsx
    │   ├── schemas/index.ts
    │   ├── services/AuthProvider.tsx
    │   ├── types/index.ts
    │   ├── utils/index.ts
    │   └── tests/*.test.{ts,tsx}
    ├── components/ui/dropdown-menu.tsx
    └── app/routes/pages/DashboardPage.tsx
```

---

## Packages Added

| Package | Type | Reason |
|---------|------|--------|
| `react-hook-form` | frontend | Form state + validation |
| `zod` | frontend | Schema validation |
| `@hookform/resolvers` | frontend | RHF ↔ Zod bridge |
| `@radix-ui/react-dropdown-menu` | frontend | Profile menu primitive |

**Backend packages:** none added — `djangorestframework-simplejwt` was already
installed; `rest_framework_simplejwt.token_blacklist` is part of it.

## Packages Removed

None.

---

## Backend Changes

- New `apps/accounts/api/` module (serializers, views, urls, permissions,
  throttles, services) with `versioning_class = None` on all views so
  drf-spectacular documents them (NamespaceVersioning has no default version).
- JWT login issues custom claims via `RefreshToken.for_user`; `remember_me`
  shortens the refresh lifetime.
- `POST /logout/` blacklists the refresh token and revokes the matching
  `UserSession`.
- `POST /change-password/` validates the old password + Django validators and
  invalidates other active sessions.
- Password reset uses Django's token generator (enumeration-safe response) and
  invalidates sessions on confirm.

## Frontend Changes

- `features/auth/` slice with pages, components, hooks, schemas, services,
  types, utils and api wrappers.
- `AuthProvider` restores the session on mount (`/me`), tracks
  `loading/authenticated/guest/session-expired`, exposes `login`/`logout`.
- `Navbar` swaps the Login link for `ProfileMenu` when authenticated.
- `AppProviders` now composes `AuthProvider` (after AxiosProvider).

## API Changes

New endpoints under `/api/v1/auth/` (12 documented in OpenAPI):
`login`, `logout`, `refresh`, `me`, `profile` (GET/PATCH),
`change-password`, `password-reset`, `password-reset/confirm`,
`roles`, `permissions`. All return the standard envelope.

## Database Changes

- `apps/accounts/0002` adds three models:
  - `LoginAttempt` (username, ip, success, created_at)
  - `LoginAudit` (event, user, username, ip, user_agent, success, detail)
  - `UserSession` (user, refresh_jti, ip, user_agent, remember_me, last_seen, revoked_at)
- `rest_framework_simplejwt.token_blacklist` migrations (13) applied.
- No changes to existing business models.

## Authentication Changes

See [AUTH_FLOW.md](./AUTH_FLOW.md). Frontend automatically injects the access
token, refreshes transparently (retry once, queues concurrent 401s), and ends
the session (logout + `/session-expired`) when refresh fails.

## Security Changes

- Account lockout after repeated failures (`429`).
- Login audit log for all auth events.
- Session tracking + revocation on logout/password change/reset.
- Rate limiting on auth endpoints (login, refresh, password reset, user).
- Refresh-token blacklist + rotation.
- Django password validators enforced on change/reset.
- Permission classes (`IsAdminUser`, `HasRole`, `HasPermission`,
  `IsOwnerOrReadOnly`).
- CSRF middleware active; SimpleJWT cookie flags prepared.

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `AUTH_MAX_FAILED_ATTEMPTS` | 5 | Failed logins before lockout |
| `AUTH_LOCKOUT_MINUTES` | 15 | Lockout window |
| `AUTH_SHORT_SESSION_DAYS` | 1 | Refresh lifetime when remember-me is off |
| `FRONTEND_URL` | http://localhost:5173 | Base for password-reset links |
| `THROTTLE_LOGIN` | 10/min | Login rate limit |
| `THROTTLE_REFRESH` | 30/min | Refresh rate limit |
| `THROTTLE_PASSWORD_RESET` | 5/hour | Reset rate limit |
| `THROTTLE_USER` | 120/min | General authenticated limit |

---

## Test Results

| Suite | Count | Result |
|-------|-------|--------|
| Backend `pytest` (all apps) | 64 | ✅ passed |
| Backend auth tests | 20 | ✅ passed |
| Frontend `vitest` (all) | 27 | ✅ passed |
| Frontend auth tests | 12 | ✅ passed |
| `manage.py check` | — | ✅ no issues |
| `makemigrations --check` | — | ✅ no drift |
| Frontend `tsc --noEmit` | — | ✅ |
| Frontend ESLint | — | ✅ no errors |
| `vite build` | — | ✅ |
| `storybook build` | — | ✅ |
| `manage.py check --deploy` | — | ⚠️ SECRET_KEY warning (dev `.env` value only) |

---

## Manual Testing Guide

**Backend**
1. `cd backend && python manage.py runserver`
2. `curl -X POST http://localhost:8000/api/v1/auth/login/ -H "Content-Type: application/json" -d '{"username":"admin","password":"Admin@123456","remember_me":true}'` → access + refresh
3. `curl http://localhost:8000/api/v1/auth/me/ -H "Authorization: Bearer <access>"`
4. Repeat bad login 5× → `429 Too Many Requests`
5. Reuse a logged-out refresh token → `401`

**Frontend**
1. `cd frontend && npm run dev` → visit `/login`
2. Sign in → redirected to `/dashboard` (protected)
3. Expire the access token manually → request transparently retried after refresh
4. Trigger refresh failure → redirected to `/session-expired`
5. Visit `/reset-password?uid=..&token=..` with a valid reset link → set new password

---

## Known Issues

- `check --deploy` reports the `SECRET_KEY` length warning because the local
  `.env` uses a dev key; production must inject a strong key via env.
- Password-reset emails use the console/locmem email backend in development
  (no real SMTP configured).
- `remember_me` currently only shortens the refresh-token lifetime; long-lived
  sessions are still persisted server-side via `UserSession`.

## Technical Debt

- The axios refresh interceptor keeps in-memory `isRefreshing`/queue state; a
  multi-tab strategy (BroadcastChannel) is not implemented.
- `UserSession` rows are soft-revoked, not pruned; a periodic cleanup job is
  deferred.
- Auth pages are rendered inside `AppLayout` (navbar/footer); a dedicated
  auth layout could be introduced later.

## Performance Notes

- `UserSession` and `LoginAttempt` carry DB indexes on hot query paths.
- `/me`, roles and permissions are cacheable read paths (React Query
  `staleTime` 5 min on the frontend).
- Token refresh is single-flight (concurrent 401s share one refresh call).

## Rollback Instructions

1. **Backend:** `git revert` the Phase-6 commits; run `python manage.py migrate
   accounts 0001` to roll back the security models (after removing dependent
   data) — or keep 0002 (additive, safe to retain).
2. **Frontend:** revert the auth feature files + `AppProviders`/routes/axios
   changes; `npm install` the removed packages if needed.
3. The `token_blacklist` app migration can stay (harmless) or be removed with
   its apps.

## Suggested Git Commit Message

```
feat(auth): enterprise authentication & authorization (phase 6)

- SimpleJWT login/logout/refresh/me/change-password/profile/reset + roles/permissions APIs
- Account lockout, login audit, session tracking, rate limiting, token blacklist/rotation
- Role & object permission classes
- Frontend features/auth slice (pages, components, hooks, schemas, provider)
- Axios auto-refresh with retry-once + logout on refresh failure
- Protected/guest route guards + dashboard protection
- Backend (64) + frontend (27) tests, AUTH_FLOW.md, OpenAPI docs
```

---

## Readiness for Next Phase

**READY.** The authentication & authorization foundation is complete,
verified and documented. The next phase (remaining CRUD APIs, then business
pages) can build on a secure, session-aware platform.
