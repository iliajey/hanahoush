# Staff Workspace Architecture (Phase 9G)

## Overview

The staff workspace is a **role-aware professional enterprise shell**, kept deliberately
separate from the public marketing Navbar/Footer. It is the single authenticated
management surface for the platform — there is exactly one dashboard, one article/project
CMS, one media library, one editorial system, one contact/newsletter management surface.

Everything is generated from centralized route metadata
(`src/app/workspace/workspaceConfig.ts`) plus the authenticated user's capabilities —
no permission logic is duplicated between the route guard and the sidebar.

## Layout

`StaffLayout` (`src/app/layouts/StaffLayout.tsx`):

- Fixed role-aware `StaffSidebar` on desktop (`lg`), slide-in drawer on mobile.
- `StaffLayoutTopbar`: menu button, role-aware workspace title, View site link, logout.
- `<Suspense>` boundary around the routed workspace page (route-level code splitting).
- Independent of the public marketing Navbar/Footer (`AppLayout` untouched).

`StaffSidebar` groups navigation by section (Dashboard / Content / Editorial / Media /
Communication). Section headers and item labels all come from `navWorkspace.*` i18n keys
(EN/FA/AR). The workspace footer area shows the authenticated user card
(avatar + display name + role name), linking back to the dashboard.

## Route metadata — single source of truth

`workspaceConfig.ts` defines `WORKSPACE_ROUTES`: each entry carries the route path (relative
to `/dashboard`), label/description i18n keys, icon, section, a **capability**, and an
`inNav` flag (detail routes like `editorial/:workflowId` don't appear in the sidebar).

| Path | Page | Capability gate |
|---|---|---|
| `/dashboard` | `DashboardPage` | authenticated |
| `/dashboard/articles` | `ArticlesWorkspacePage` | `articles.view` + staff |
| `/dashboard/articles/new` · `/dashboard/articles/:id/edit` | `ArticleEditPage` | `articles.update` + staff |
| `/dashboard/projects` | `ProjectsWorkspacePage` | `projects.view` + staff |
| `/dashboard/projects/new` · `/dashboard/projects/:id/edit` | `ProjectEditPage` | `projects.update` + staff |
| `/dashboard/media` | `MediaWorkspacePage` | `media.upload` OR `media.manage` + staff |
| `/dashboard/contact` | `ContactWorkspacePage` | staff |
| `/dashboard/newsletter` | `NewsletterWorkspacePage` | staff |
| `/dashboard/editorial` | `EditorialWorkspaceHub` | `editorial.view` |
| `/dashboard/editorial/:workflowId` | `WorkflowDetailWorkspacePage` | `editorial.view` |

Routes intentionally **not** added (no fake management UI, per phase rule): services
(API is read-only), pages/page-builder (API is read-only), analytics (surfaced as the
dashboard engagement section for `analytics.view` roles), company content (API is
read-only), `settings`. Those surfaces remain dashboard/widget or Django-admin concerns.

Helpers: `canAccessWorkspaceRoute(user, meta)`, `workspaceRouteHref(meta)`,
`workspaceNavForUser(user)` (sidebar items grouped by section).

## Role-aware dashboard

`DashboardPage` (`features/dashboard/pages/DashboardPage.tsx`):

- Role-aware workspace title/description from `ROLE_CATALOG` → `dashboard.host.role.*`.
- Left rail: `ProfileCard` (Part O) + workspace quick-links.
- Staff (is_staff): `OperationalDashboardSection` using the existing
  `GET /api/v1/admin/dashboard/` hook (`useOperationalDashboard`) with widgets gated by
  capabilities (content / editorial / engagement / operations / system). No dashboard
  aggregation is duplicated in the frontend.
- Non-staff (Editor/Viewer): `OverviewSection` — read-only links to surfaces their
  permissions allow (editorial, articles, projects, services), no management actions.

## Workspaces

### Articles (`features/articles/workspace/` + `hooks/staff.ts` + `api/staff.ts`)

- `ArticlesWorkspacePage`: search, status tabs (all/draft/review/published/archived),
  per-row workflow integration (start review, submit for review) reusing the Phase 8C
  editorial hooks, edit/view actions.
- `ArticleEditPage`: trilingual title/body/slug, status, featured/public flags through the
  existing article CMS API (create draft/PATCH). Publishing transitions run through the
  editorial workflow, never a second CMS.
- Permission-aware: create/edit only when `CONTENT_ARTICLES_WRITE`.

### Projects (`features/projects/workspace/` + `hooks/staff.ts` + `api/staff.ts`)

- `ProjectsWorkspacePage`: search, status tabs, list with client/year, case-study link.
- `ProjectEditPage`: trilingual fields + client/location/dates/live URL, featured/public.
- Project publishing goes through the shared editorial workflow.

### Media (`features/media/workspace/MediaWorkspacePage.tsx` + `hooks/index.ts`)

- Reuses the existing media API (`MediaFile` not duplicated).
- Grid library: search, image/document filter, reference counts, upload dialog,
  metadata editor (title/alt/public), soft-delete confirmation. Staff-only gate.
- `media.manage` capability is enforced at the backend for PATCH/delete; the workspace is
  only reachable by staff who can upload or manage.

### Contact (`features/contact/workspace/` + `admin.ts`/`adminHooks.ts`)

- List/search, status filter (new/in_progress/resolved/closed/spam), inspect dialog with
  source/phone/company/service/budget/message, status updates, mark-handled action.
- Staff-only; the detail dialog renders exactly the staff API record contract.

### Newsletter (`features/newsletter/workspace/` + `api.ts`/`hooks.ts`/`types.ts`)

- List/search, active/inactive filter, activate/deactivate, CSV export.
- Staff-only. `unsubscribe_token` is never referenced or exposed; the export never
  includes tokens (backend guarantee + frontend privacy test).

### Editorial (`features/editorial/pages/` + existing Phase 8C hooks/components)

- `EditorialWorkspaceHub`: review queue (workflows with pending approvals), all workflows,
  schedule, locks, audit trail.
- `WorkflowDetailWorkspacePage`: workflow state, approvals (decide), threaded comments
  (+resolve), publish/schedule, revision history + diff viewer, audit timeline.
- All action buttons are capability-gated (review/manage/approve/schedule); the backend
  state machine remains authoritative.

## Profile / session (Part O)

`ProfileCard` (`features/dashboard/components/ProfileCard.tsx`) shows display name,
`@username`/email, role badge, session status, a permission-module summary (badges per
module, never raw internals), and a logout action. Tokens/JWTs are never rendered. The
staff sidebar and top bar additionally surface the display name, email and role label.

## Localization & RTL

All workspace copy (nav, dashboard host titles, widget labels, every workspace page) lives
under EN/FA/AR locale files (`src/i18n/locales/{en,fa,ar}/translation.json`), enforced by
the locale-parity test. Layout uses logical properties (`start/end`, `ps-*`, `ms-*`) so
RTL rendering stays correct; email/URL/date cells are kept LTR (`dir="ltr"`).

## Accessibility

- Staff layout: semantic `<nav>` landmarks, labelled menu buttons, focusable drawer
  (Escape + overlay close), reduced-motion via existing `MotionConfig reducedMotion`.
- Workspace pages: labelled search inputs, live tables with hover states, dialog
  (Radix) with proper focus trap/aria wiring, icon-only actions carry `sr-only` labels.
- No colour-only status signals: status badges pair colour with text labels.

## No duplication

The workspace reuses: the existing `MediaPicker`/media API, the Phase 8C editorial
hooks/components, the Phase 8H dashboard API, the single auth system, the single
permission catalog. No second dashboard API, article CMS, media system, analytics
system, editorial workflow or Page Builder was created.

## Verification

Frontend typecheck/lint/test/build/build-storybook and backend check/makemigrations/
migrate/bootstrap/pytest are green; the live six-role HTTP verification passes all 69
checks. See `docs/reports/phase-09G-report.md`.