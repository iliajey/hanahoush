# Hanahoush — Authentication Flow Documentation

> Complete walkthrough of the Hanahoush authentication & authorization flow
> (backend Django REST Framework SimpleJWT + frontend React).

---

## 1. Flow Overview

```
┌────────────┐  1. POST /auth/login   ┌──────────────────┐
│  LoginForm │ ─────────────────────▶ │  Django backend  │
└────────────┘ ◀───────────────────── └──────────────────┘
         │  { access, refresh, user }
         ▼
   store tokens (localStorage)
         │
         ▼
   GET /auth/me  ──▶  AuthProvider restores user + session status
         │
         ▼
   React Query mutations + apiClient (Bearer token injected)
         │
         └──▶ 401 (expired access) ──▶ POST /auth/refresh (once)
                                            │
                                            ├─ success → retry original request
                                            └─ failure → clear tokens → /session-expired
```

---

## 2. Backend Endpoints

All endpoints are under `/api/v1/auth/` and return the standard envelope
`{ success, message, data, errors, request_id }`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/login/` | — | Credentials → `{access, refresh, user}`; `remember_me` controls refresh lifetime |
| POST | `/logout/` | Access | Blacklists the refresh token + revokes the session |
| POST | `/refresh/` | — | Rotates tokens (old refresh blacklisted when rotation enabled) |
| GET | `/me/` | Access | Current user with role + permissions |
| GET | `/profile/` | Access | Read own profile |
| PATCH | `/profile/` | Access | Update own profile (first/last name, email, phone, preferred_language) |
| POST | `/change-password/` | Access | Change password (old + new + confirm; invalidates other sessions) |
| POST | `/password-reset/` | — | Request reset link (enumeration-safe) |
| POST | `/password-reset/confirm/` | — | `{uid, token, new_password}` — set new password |
| GET | `/roles/` | Access | List roles |
| GET | `/permissions/` | Access | List permissions |

### Login payload

```json
{ "username": "alice", "password": "Secret@123", "remember_me": true }
```

### Login response (`data`)

```json
{
  "access": "<jwt>",
  "refresh": "<jwt>",
  "user": {
    "id": 1,
    "username": "alice",
    "email": "alice@hanahoush.local",
    "role": { "id": 1, "name": "Editor", "codename": "editor" },
    "permissions": ["manage_articles"]
  }
}
```

---

## 3. Security Controls

| Control | Implementation |
|---------|----------------|
| **Refresh token blacklist** | `rest_framework_simplejwt.token_blacklist`; logout + rotation blacklist JTIs |
| **Token rotation** | `ROTATE_REFRESH_TOKENS=True`, `BLACKLIST_AFTER_ROTATION=True` |
| **Account lockout** | `LoginAttempt` rows; after `AUTH_MAX_FAILED_ATTEMPTS` failures within `AUTH_LOCKOUT_MINUTES` → `429` |
| **Rate limiting** | DRF scoped throttles: login `10/min`, refresh `30/min`, password-reset `5/hour`, user `120/min` |
| **Audit log** | `LoginAudit` — event, username, IP, user-agent, success, timestamp |
| **Session tracking** | `UserSession` keyed by refresh JTI; revoked on logout / password change |
| **Password validation** | Django `AUTH_PASSWORD_VALIDATORS` (similarity, length, common, numeric) |
| **Password change** | Requires old password; invalidates other sessions |
| **Password reset** | Django token generator (time-limited, single-use); response never reveals account existence |
| **CSRF** | JWT Bearer auth + `CsrfViewMiddleware`; cookie-mode flags prepared in `SIMPLE_JWT` |
| **Permission classes** | `IsAdminUser`, `HasRole`, `HasPermission`, `IsOwnerOrReadOnly` (object-level) |

---

## 4. Frontend Auth State

- `AuthProvider` (in `features/auth/services/`) exposes:
  `{ user, status, isAuthenticated, login, logout, refreshUser }`
- `status` ∈ `loading | authenticated | guest | session-expired`
- On mount: if a token exists → `GET /me` → `authenticated`; otherwise `guest`.
- The axios refresh interceptor emits an auth-failure event on refresh failure →
  `AuthProvider` sets `session-expired` → `ProtectedRoute` redirects to `/session-expired`.

## 5. Route Guards

| Guard | Behavior |
|-------|----------|
| `ProtectedRoute` | loading → spinner; session-expired → `/session-expired`; guest → `/login` (remembers location); else render |
| `GuestRoute` | loading → spinner; authenticated → `/dashboard`; else render |

## 6. Token storage

- `localStorage` via `shared/api/tokenStorage.ts`:
  `hanahoush_access_token`, `hanahoush_refresh_token`.
- Tokens cleared on logout and on refresh failure.

## 7. Manual test flow

1. `python manage.py runserver` (backend) + `npm run dev` (frontend).
2. Create a user (admin bootstrap user or via Django admin).
3. Visit `/login`, sign in → redirected to `/dashboard`.
4. Open devtools → verify `Authorization: Bearer <token>` on `/me`.
5. Manually expire the access token → observe transparent refresh + retry.
6. Logout → token blacklisted; refresh with the old token returns 401.
