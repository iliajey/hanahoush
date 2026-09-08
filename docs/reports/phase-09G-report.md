# Phase 9G — Frontend RBAC + Staff Workspace + Role-Based Dashboard

**Status:** ✅ COMPLETE — READY FOR REVIEW
**Date:** 2026-08-19
**Phase:** 9G — frontend RBAC foundation, role-aware dashboard, staff workspace
navigation/routes, article/project/media/contact/newsletter/editorial workspaces,
profile/session, localization, testing, live six-role verification.
**Scope constraint honoured:** this phase is **not** ERP work. `ERP_ENABLED=false`,
`ERP_PROVIDER=null`, no Odoo contacts, no ERP models/sync/credentials/migrations. The
Phase 9A/9B connector foundation is untouched (§26). No second auth, RBAC, dashboard,
CMS, media, analytics, editorial or page-builder system was created (§5, §19).

---

## 1. Executive summary

Phase 9G delivers the missing **frontend role-aware staff infrastructure** on top of the
existing backend role/permission system:

- A centralized frontend authorization layer (`src/features/auth`):
  `permissions/`, `guards/`, `hooks/`, `role-config/` — typed mirrors of the backend
  27-permission / 6-role catalog, a capability layer derived from the **actual** backend
  catalog + `is_staff` gates, reusable route guards, and a single `useAuthorization()`
  facade (`hasRole`, `hasAnyRole`, `hasPermission`, `hasAnyPermission`, `can`,
  `capabilities`). No role strings live scattered in components.
- A **role-aware dashboard** (`DashboardPage`): role-specific workspace titles
  (Operations centre / Company & content / Content / Project / Editorial workspace /
  Overview), capability-gated operational widgets for staff, and a read-only overview
  for Editor/Viewer — powered by the existing Phase 8H `GET /api/v1/admin/dashboard/`
  (no second dashboard API).
- A **staff workspace shell** (`StaffLayout` + `StaffSidebar`) separated from the public
  marketing Navbar, with navigation generated from `workspaceConfig` route metadata
  (one permission source shared by sidebar and route guards).
- **Workspaces** for Articles, Projects, Media, Contact, Newsletter and Editorial, each
  reusing existing Phase 8A–8G APIs and never duplicating models/system state machines.
- **Profile/session** area (Part O), full EN/FA/AR localization + correct RTL, and
  accessibility passes (landmarks, labelled controls, dialogs, reduced-motion).
- **Verification:** frontend typecheck/lint/test(216)/build/build-storybook green;
  backend check/makemigrations/migrate/bootstrap/pytest(278) green; live six-role
  HTTP verification **69/69 checks passed** (real server, real credentials read from the
  seeder, never printed).

## 2. Initial audit

The audit (running through the 8C–9F report trail and the live code) confirmed:

- **Backend** already provides everything the frontend needs:
  - `GET /api/v1/auth/me/` plus the login payload return `user.role` (nested
    `{id, name, codename}`) and `user.permissions[]` (codenames; superusers get all 27)
    via `UserSerializer` (`apps/accounts/api/serializers.py`).
  - The JWT carries only standard claims — the frontend must never parse the token for
    role/permission data (and doesn't).
  - Clear, singly-owned backend gates: `IsStaffOrReadOnly` (articles/projects/services),
    DRF `IsAdminUser` (media/contact-admin/newsletter-admin), `IsStaffOrAdmin`
    (admin dashboard), and the editorial permission classes (`editorial.view/manage/
    approve/review/schedule`, `apps/editorial/permissions.py`).
- **Frontend** already had the Phase 6 auth provider (login/logout/refresh user,
  axios interceptors, token storage), Phase 8C editorial hooks, Phase 8G media/contact/
  newsletter APIs, and the Phase 8H `useOperationalDashboard` hook. **No second auth
  mechanism existed, so none was created.**
- **Findings that shaped the build:**
  - Several seeded codenames (`articles.*`, `projects.*`, `services.*`, `company.*`,
    `media.*`, `analytics.view`, `users.manage`, `roles.manage`) are **not enforced**
    server-side — writes are gated by the cruder `is_staff` flag. The frontend capability
    layer therefore mirrors the **effective** backend behaviour (e.g. content workspaces
    require the codename **and** the staff flag) so a role is never invited into a UI
    whose backend would reject it.
  - `CONTENT_MANAGER`/`PROJECT_MANAGER` are `is_staff=True`; `EDITOR`/`VIEWER` are not.
  - No permission codenames exist for contact/newsletter/dashboard/pages — those surfaces
    are staff-gated. The capability model encodes `staffOnly` for them.
  - Local PostgreSQL role cannot create test DBs; backend verification uses the documented
    `USE_SQLITE=true` fallback.
- **ERP:** no ERP work was found to undo, and none was added (§26).

## 3. Existing backend role catalog

Source of truth: `apps/accounts/seeders.py` (`ROLE_DEFINITIONS`, `DEMO_USERS`),
mirrored in the frontend by `role-config/roles.ts` and `tests/fixtures.ts`.

| Role codename | Seeded username | `is_staff` | Permission count (live) |
|---|---|---|---|
| `SUPER_ADMIN` | `superadmin` (also superuser) | yes | 27 (full catalog) |
| `COMPANY_ADMIN` | `companyadmin` | yes | 25 |
| `CONTENT_MANAGER` | `contentmanager` | yes | 16 |
| `PROJECT_MANAGER` | `projectmanager` | yes | 10 |
| `EDITOR` | `editor` | no | 8 |
| `VIEWER` | `viewer` | no | 6 |

Plus the Django superuser (`admin`): superuser + staff, no primary role, full catalog.

## 4. Permission discovery

The complete backend catalog has **27 codenames** (`PERMISSIONS` in `permissions/types.ts`
mirrors them 1:1). Enforcement matrix discovered:

| Codename group | Server-side enforcement |
|---|---|
| `articles.*`, `projects.*`, `services.*`, `company.*` | coarser: `IsStaffOrReadOnly` (writes), read-only 405s on services/company |
| `media.upload`, `media.manage` | none by codename; media API = DRF `IsAdminUser` (staff) |
| `analytics.view` | none by codename; surfaced via dashboard widgets |
| `users.manage`, `roles.manage` | none by codename (Django admin surface) |
| `editorial.*` | ❌ enforced per-action (see §14) |
| `integration.view` | enforced (`IsIntegrationOperator`) |

No codenames exist for pages/page-builder, search, newsletter, contact or dashboard —
those are staff-gated. The frontend does not invent permissions; capabilities specify
`staffOnly` where the backend gate is staff, and codename requirements where the backend
enforces codenames.

## 5. Frontend RBAC architecture

See `docs/architecture/frontend-rbac.md`. Structure:

- `features/auth/permissions/` — `PERMISSIONS`, `PERMISSION_MODULES`, pure helpers
  (`hasPermission/hasAnyPermission/hasAllPermissions/hasRole/hasAnyRole/isStaffUser`).
- `features/auth/role-config/` — `ROLE_CODES`, `ROLE_CATALOG` (i18n-linked role
  definitions), `CAPABILITIES` + `canUseCapability`/`grantedCapabilities` (permission +
  staff rules).
- `features/auth/guards/` — `AuthorizationGate` plus `RequirePermission`,
  `RequireAnyPermission`, `RequireRole`, `RequireStaff`.
- `features/auth/hooks/` — `useAuth`/`useUser`, `useAuthorization`, `useLogin`,
  `useLogout`, `useRoles`/`usePermissions`.
- `app/workspace/workspaceConfig.ts` — the single permission-aware route metadata table.

The JWT is not inspected for permissions; current user data (role + permissions) comes
from `/auth/me/` and the login payload via `AuthProvider`.

## 6. Route authorization

All staff routes are children of `ProtectedRoute` (authentication) inside `StaffLayout`,
and each is individually guarded by workspace capability constants:

| Route | Guard | Result without access |
|---|---|---|
| `/dashboard` | `ProtectedRoute` | `/login` (guest) / `/session-expired` |
| `/dashboard/articles`, `/projects` | `RequireAnyPermission` + staff | `/unauthorized` |
| `/dashboard/articles/new`, `/articles/:id/edit` | `RequirePermission` + staff | `/unauthorized` |
| `/dashboard/projects/new`, `/projects/:id/edit` | `RequirePermission` + staff | `/unauthorized` |
| `/dashboard/media` | `RequireAnyPermission` + staff | `/unauthorized` |
| `/dashboard/contact`, `/newsletter` | `RequireStaff` | `/unauthorized` |
| `/dashboard/editorial`, `/editorial/:workflowId` | `RequirePermission` | `/unauthorized` |

Guest → `/login` (return path preserved); authenticated-but-unauthorized →
`/unauthorized` (the existing UnauthorizedPage). No redirect loops (`/login`,
`/unauthorized`, `/session-expired` are unguarded). Public routes untouched.

## 7. Navigation authorization

`StaffSidebar` renders only sections/items the user's capabilities grant, generated by
`workspaceNavForUser(user)` from the same metadata the route guards read
(no duplicated logic). Dashboard/Content/Editorial/Media/Communication sections; detail
routes (e.g. `editorial/:workflowId`) are hidden from nav. The public marketing Navbar is
untouched (authenticated users keep the Phase 9D Dashboard/Logout entries); the workspace
shell is wholly separate (`StaffLayout`).

## 8. Dashboard architecture

One dashboard (`DashboardPage`) only, upgraded to be role-aware, reusing
`GET /api/v1/admin/dashboard/`:

- Role-aware title/description per role (`dashboard.host.role.*`).
- Staff: `OperationalDashboardSection` with capability-gated widget groups — Content,
  Editorial, Engagement (analytics), Operations (recent media/contact/editorial
  activity), System (health) — the live aggregates come from the existing API, never
  duplicated client-side.
- Non-staff (Editor/Viewer): `OverviewSection` — read-only links to surfaces their
  permissions allow; no staff data, no management actions.
- Left rail: `ProfileCard` + workspace quick-links.

## 9. Article workspace

`/dashboard/articles` (+ new/edit). Reuses the article CMS API (`api/staff.ts`,
`hooks/staff.ts`) and the Phase 8C editorial hooks (`useWorkflowForContent`,
`useEnsureWorkflowMutation`, `useSubmitForReviewMutation`):

- list + search + status tabs (all/draft/review/published/archived)
- create draft / edit (trilingual fields, slug, featured/public) — create/edit gated on
  `CONTENT_ARTICLES_WRITE`
- per-row workflow: start review / submit for review (gated on `EDITORIAL_MANAGE`);
  full revision/diff/approve/schedule/publish happens in the editorial workspace
- public preview link. No second article CMS; publishing runs through the editorial
  workflow; draft content is only visible to authorized staff via the existing
  draft-protection on the API.

## 10. Project workspace

`/dashboard/projects` (+ new/edit). Reuses the project CMS API (`api/staff.ts`):

- list + search + status tabs, client/year columns, case-study links
- create/edit project metadata (trilingual, client, location, dates, live URL,
  featured/public); publish workflow via the shared editorial system.
- Gated to staff with `projects.view` (list) and `projects.update` (write).

## 11. Media workspace

`/dashboard/media`. Reuses the existing media API and `MediaPicker` infrastructure
(no duplicated `MediaFile`):

- search, image/document/all filter, reference counts
- upload (staff), metadata edit (title/alt/public) gated by backend `media.manage`,
  soft-delete with confirmation
- staff-only route (`RequireAnyPermission` + `RequireStaff` mirror).

## 12. Contact workspace

`/dashboard/contact`. Reuses the Phase 8G staff contact API (`admin.ts`/`adminHooks.ts`):

- list + search + status filter (new/in_progress/resolved/closed/spam)
- inspect dialog (email, phone, company, source, service, budget, message)
- lifecycle status updates + mark-handled; handler recording stays server-side.
- Staff-only (backend DRF `IsAdminUser`; frontend `RequireStaff`).

## 13. Newsletter workspace

`/dashboard/newsletter`. Reuses the Phase 8G admin newsletter API
(`api.ts`/`hooks.ts`/`types.ts`):

- search, active/inactive filter
- activate / deactivate per subscriber
- CSV export (staff-authorized). `unsubscribe_token` is **never** referenced by the
  frontend feature (enforced by a source-level privacy test) and never returned by the
  backend serializer. Staff-only route.

## 14. Editorial workspace

`/dashboard/editorial` + `/dashboard/editorial/:workflowId`. Reuses the Phase 8C hooks
and components (no duplicated state machine; frontend displays/invokes backend
operations):

- Hub: review queue (pending approvals), all workflows, schedule, locks, audit trail.
- Detail: workflow badge/version, approvals (decide), threaded comments (+resolve),
  publish/schedule, revision history + diff viewer, rollback, audit timeline.
- Action buttons capability-gated (`EDITORIAL_REVIEW`, `EDITORIAL_MANAGE`,
  `EDITORIAL_APPROVE`, `EDITORIAL_SCHEDULE`); the backend enforces the same rules.

## 15. Profile / session

`ProfileCard` (dashboard) + sidebar/topbar user block: display name, `@username`/email,
role badge (localized), session status, permission-module summary badges, and logout.
No secrets or JWTs are rendered anywhere.

## 16. Localization

All workspace copy lives in `src/i18n/locales/{en,fa,ar}/translation.json`
(`roles.*`, `navWorkspace.*`, `dashboard.host.*`, `dashboard.widgets.*`,
`articleWorkspace.*`, `projectWorkspace.*`, `mediaWorkspace.*`, `contactWorkspace.*`,
`newsletterWorkspace.*`, `editorialWorkspace.*`, `workflowStage.*`). The existing
locale-parity test asserts EN/FA/AR key parity (including plural-suffixed keys).
RTL/LTR correctness: logical properties (`start/end`, `ps-*`/`ms-*`), `dir="ltr"` on
email/URL/date cells; the RTL sidebar test asserts `document.documentElement.dir`.

## 17. Accessibility

- Workspace shell: `<nav aria-label>`, labelled menu/open/close buttons, Radix dialog
  focus management, keyboard closable mobile drawer, reduced-motion preserved
  (`MotionConfig reducedMotion`).
- Pages: labelled search inputs, table semantics, `sr-only` labels on icon-only actions,
  status conveyed by text + colour (not colour alone), focus-visible rings from the
  existing design system.

## 18. Security

- **Frontend authorization is not security.** Every protected operation remains enforced
  by the backend ACL (verified live, §20).
- The role/permission object is refreshed from `/auth/me/`; role is **never** trusted
  from `localStorage` (only JWT tokens are stored there, and they are never parsed for
  authorization decisions — no stale-role trust).
- No admin credentials, alternate API keys, or client-side toggles for protected writes.
- `unsubscribe_token` not referenced by the frontend feature; contact/subscriber data
  reachable only through staff-only endpoints whose guards mirror the backend gates.
- No JWT contents are rendered in the UI (§15).

## 19. Testing

Frontend (`npm run test`): **216 passed** (36 files). Phase 9G coverage:

- Authentication: anonymous/authenticated/guest/session-expired (`auth.routes.test.tsx`,
  `guards.test.tsx`).
- Authorization: each role, allowed/forbidden routes and actions (`authorize.test.ts`,
  `guards.test.tsx`, `workspace-permissions.test.ts`) against fixtures that mirror the
  backend catalog exactly.
- Navigation: per-role sidebar links (`app/workspace/tests/navigation.test.tsx`).
- Dashboard: role-aware widgets per role (`features/dashboard/tests/dashboard.test.tsx`).
- Articles/Projects/Media/Contact/Newsletter: capability assertions + newsletter token
  privacy (source-level test).
- RTL + localization: bilingual sidebar tests + locale-key parity.
- Regression: all public marketing page tests still pass unchanged.

Backend: **278 passed** (`USE_SQLITE=true`), `manage.py check`, `makemigrations
--check` (no changes), `migrate` (no-op), `bootstrap` (idempotent).

## 20. Live six-role verification

`backend/scripts/verify_six_roles.py` ran against the live server
(`http://127.0.0.1:8000`): **69 checks, 0 failures**. For each of the six demo accounts
(credentials read directly from the seeder, never printed) it verified login, `/auth/me`
role + permission resolution, dashboard API gating, editorial/media/contact/newsletter
authorization, a forbidden action (editorial `ensure` requires `editorial.manage`), the
media-upload gate, and logout:

| Check | superadmin | companyadmin | contentmanager | projectmanager | editor | viewer |
|---|---|---|---|---|---|---|
| login + role | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/auth/me` role | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| perms count | 27 | 25 | 16 | 10 | 8 | 6 |
| admin/dashboard | 200 | 200 | 200 | 200 | 403 | 403 |
| editorial/workflows | 200 | 200 | 200 | 200 | 200 | 200 |
| media list | 200 | 200 | 200 | 200 | 403 | 403 |
| admin/contact (+newsletter) | 200 | 200 | 200 | 200 | 403 | 403 |
| editorial ensure (action) | 200 | 200 | 200 | 403 | 403 | 403 |
| media upload gate | 400(valid) | 400 | 400 | 400 | 403 | 403 |
| logout | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

Anonymous: public articles 200, dashboard 401, `/auth/me` 401 — all pass.

## 21. Files created

Frontend:

- `src/features/auth/permissions/{types,authorize,index}.ts`
- `src/features/auth/role-config/{roles,capabilities,index}.ts`
- `src/features/auth/guards/{AuthorizationGate,RequirePermission,RequireAnyPermission,RequireRole,RequireStaff,index}.tsx`
- `src/features/auth/hooks/useAuthorization.ts`
- `src/features/auth/tests/{authorize.test.ts,fixtures.ts,guards.test.tsx,workspace-permissions.test.ts}`
- `src/app/workspace/workspaceConfig.ts` + `src/app/workspace/tests/navigation.test.tsx`
- `src/app/layouts/StaffLayout.tsx`, `src/app/layouts/StaffSidebar.tsx`
- `src/features/dashboard/{types.ts,api/index.ts,hooks/index.ts}`
- `src/features/dashboard/components/{ProfileCard,StatTile}.tsx`
- `src/features/dashboard/pages/DashboardPage.tsx` + `tests/dashboard.test.tsx`
- `src/features/articles/{api/staff.ts,hooks/staff.ts}`
- `src/features/articles/workspace/{ArticlesWorkspacePage,ArticleEditPage}.tsx`
- `src/features/projects/{api/staff.ts,hooks/staff.ts}`
- `src/features/projects/workspace/{ProjectsWorkspacePage,ProjectEditPage}.tsx`
- `src/features/media/{hooks/index.ts}` + `workspace/MediaWorkspacePage.tsx`
- `src/features/contact/{admin.ts,adminHooks.ts}` + `workspace/ContactWorkspacePage.tsx`
- `src/features/newsletter/{api.ts,hooks.ts,types.ts}` + `workspace/NewsletterWorkspacePage.tsx`
- `src/features/editorial/pages/{EditorialWorkspaceHub,WorkflowDetailWorkspacePage}.tsx`

Backend:

- `backend/scripts/verify_six_roles.py`

Docs:

- `docs/architecture/frontend-rbac.md`, `docs/architecture/staff-workspace.md`,
  `docs/reports/phase-09G-report.md`

## 22. Files modified

Frontend:

- `src/app/routes/index.tsx` — staff workspace routes + guards wired under
  `ProtectedRoute`/`StaffLayout`
- `src/features/auth/{index.ts,hooks/useAuth.ts}` — exports
- `src/i18n/locales/{en,fa,ar}/translation.json` — `roles.*`, `navWorkspace.*`,
  `dashboard.*`, workspace page bundles

No backend application code, migrations, models or settings were modified. The only new
backend file is the (non-shipping) live-verification script `scripts/verify_six_roles.py`.

## 23. Known issues

- Content/analytics/roles codenames remain unenforced server-side (pre-existing Phase 8C
  gap); the API continues to rely on the `is_staff` flag. The frontend mirrors the
  effective gate (codename + staff) so no unauthorized UI is shown, but backend ACL
  refinement remains a separate hardening exercise (deferred — not this phase's scope).
- `EDITOR` and `VIEWER` are non-staff, so the content workspaces (staff-only by backend
  design) are not reachable for them even where codenames overlap — intended.
- The mobile workspace is usable but intentionally lighter than desktop (responsive
  tables, drawer navigation); pixel-level browser verification of the workspace remains
  part of the deferred browser-harness initiative.
- `temp/locales-test.json` (from a prior dev session) is tracked in the repo; harmless
  but could be removed.

## 24. Deferred work

- Browser-harness (Playwright-style) pixel/UX verification of the workspace across
  viewports and the six roles (see NEXT_PHASE Option B).
- `/dashboard/analytics`, `/dashboard/company`, `/dashboard/settings` and dedicated
  services/pages workspaces were deliberately NOT added: their backend APIs are read-only
  today, and the phase rule forbids fake management UI. They should be added when the
  backend exposes real write/management capability.
- Backend ACL tightening (codename enforcement for articles/projects/services/media/
  analytics) — separate hardening phase.
- Editing workflow deeper integration (e.g. per-field HTML body editor, cover image
  picker inside article form) can be layered onto the existing endpoints later.

## 25. Architectural risks

- **Frontend/backend capability drift**: the mirror of the catalog and the `staffOnly`
  gates are maintained by hand. Mitigated by fixtures that encode the backend catalog and
  tests that assert the capability matrix; a future shared-catalog generation is noted in
  NEXT_PHASE.
- **Coarser backend gate than catalog** (is_staff vs codenames): if the backend later
  starts enforcing codenames, the frontend gate is already the stricter of the two, so
  behavior can only get safer; the workspace-permissions tests pin the expected rules.
- **Draft data exposure**: staff lists include drafts; this relies on the existing
  draft-protection in the article/project APIs (staff can read drafts by design).
- SPA SEO ceiling and copy drift (backend seed ↔ frontend keys) remain from prior phases.

## 26. ERP safety

- `ERP_ENABLED=false` (default, no override in `.env`); `ERP_PROVIDER=null`.
- No Odoo/ERP network calls, credentials, models, migrations, sync jobs or assumptions
  added; `apps/integration` untouched; `NullProvider` remains active.
- Confirmed via `config/settings/base.py` (`ERP_ENABLED = env.bool(..., default=False)`,
  `ERP_PROVIDER = env(..., default="null")`) and a clean `.env` scan.
- Phase 10 ERP integration was not started (see NEXT_PHASE — ERP stays parked until the
  real Odoo 19 instance is deployed).

## 27. Documentation

- Created: `docs/architecture/frontend-rbac.md`, `docs/architecture/staff-workspace.md`,
  `docs/reports/phase-09G-report.md`.
- Updated: `CHANGELOG.md`, `NEXT_PHASE.md`, `docs/reports/next-phase.md`.

## 28. Final status

**COMPLETE.** Phase 9G is implemented, localized, tested and live-verified across all six
demo roles. ERP safety preserved, no duplicate systems, backend unchanged except the
standalone verification script.