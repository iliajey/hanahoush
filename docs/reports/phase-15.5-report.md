# Phase 15.5 Report — CMS Experience, Services Studio & UI/UX Master Polish

Date: 2026-09-13
Scope: full product UX audit; Article Studio → Pro (Project Studio shell
parity + reading-experience preview parity); Services staff write path +
Services Studio (list/edit/preview) with nav/routes/permissions/i18n;
dashboard services coverage; role-matrix + nav test updates; full
verification. ERP remains parked (`ERP_ENABLED=false`, `NullProvider`, no
ERP network calls, models, migrations, or credentials). SEO work was NOT
started — it remains the next dedicated phase.

> No credentials, secrets, password hashes, or tokens appear in this report.

---

## 1. Executive summary

The single largest CMS gap is closed: **Services are now fully manageable
from the dashboard**. The public Services surface rendered `Service`
records that no Studio surface could write (the API was read-only by
design: `http_method_names = ("get", "head", "options")`). Phase 15.5 adds
a staff write path (`ServiceCreateUpdateSerializer` + full CRUD viewset,
same `IsStaffOrReadOnly` gate as articles/projects), a Services Studio
(list + single-locale edit + trilingual preview), sidebar/nav/routes,
capabilities, EN/FA/AR strings, and dashboard coverage.

Article Studio reaches Project Studio quality: same 2-column editorial
shell (main surface + sticky 320px sidebar), same preview entry pattern,
and a reading-experience preview (progress bar, TOC, tags, CTA,
newsletter) mirroring the public `ArticleDetailPage` composition.

Verification: backend **353 passed** (+6 new service-write tests),
frontend **271 passed / 51 files** (+13 new service tests), typecheck
clean, ESLint clean, production build passes, Storybook build passes,
Playwright services-studio **2/2**, workspace **12/12**, roles **9/9**,
smoke **16/16**, user-admin **2/2**, a11y/RTL/theme/seo/errors suites
pass. Two pre-existing flakes observed (cursor-grid visual threshold,
responsive `/dashboard/articles` mobile overflow — neither file touched
by this phase). No migrations. Database preserved (4 demo services only).

---

## 2. UX audit findings

Audited public (home, articles, article detail, projects, project detail,
services, contact, newsletter, auth) + staff (dashboard, sidebar, shell,
articles, projects, media, users, profile, permissions, previews,
dialogs, forms, tables, cards).

Highest-value findings → actions:

| # | Finding | Action taken |
|---|---|---|
| 1 | Services publicly rendered but **not manageable** — no Studio, no write API, no nav | **Fixed**: full Services Studio (Part C/D) |
| 2 | Article Studio single-column stack vs Project Studio 2-column shell | **Fixed**: Article Studio Pro shell parity |
| 3 | Article preview missed reading experience (no progress, TOC, tags, CTA) | **Fixed**: preview parity |
| 4 | Dashboard had no services workflow data (review queue, drafts, gaps, recent) | **Fixed**: backend + UI services coverage |
| 5 | Design system (Button/Card/Input/Badge/Select/Dialog) already consistent | Left alone (no churn) |
| 6 | Micro-interactions already GPU-friendly (transform/opacity, reduced-motion guard) | Left alone |
| 7 | Mobile overflow on `/dashboard/articles` (pre-existing, untouched file) | Documented, not introduced |

---

## 3. Article Studio improvements (Article Studio 2.0 → Pro)

- `ArticleEditPage.tsx`: restructured from `max-w-4xl` single column to
  the shared editorial shell `grid lg:grid-cols-[minmax(0,1fr)_320px]` —
  main surface (identity, content) + sticky sidebar (publishing, cover,
  health, actions). Matches `ProjectEditPage` / `ServiceEditPage`.
- Cover card moved into the sidebar; duplicate removed.
- `ArticlePreviewPage.tsx`: now renders `ReadingProgress`,
  `ArticleTableOfContents` (derived via `transformArticleContent`),
  tag chips, `ArticleCTA`, `NewsletterCTA` — the same reading
  composition as the public page-builder `articles-article` sections.
- New i18n key `articlePreview.tagsLabel` (EN/FA/AR).

Public ↔ Studio parity re-audit (articles):

| Public section | Source | Editable? |
|---|---|---|
| Hero title/meta/excerpt/cover | `title_*`, `short_description_*`, `cover_image` | Yes (single-locale) |
| Body + TOC + reading progress | `description_*` | Yes (`RichTextEditor`) |
| Tags row | `tags` M2M | Yes (Phase 15 tags editor) |
| Author byline | `author` FK | Intentionally static (server-side) |
| Related articles/projects/services | server-computed | Intentionally static |
| Newsletter/CTA | static components | Preview parity added (read-only render) |

---

## 4. Project Studio improvements

No structural changes (already the reference implementation). Verified:
single-locale editing, case-study editor (6 sections), gallery,
actionable health, trilingual preview, autosave/dirty guard,
submit-for-review. Workspace E2E 12/12 incl. round-trip still green.

---

## 5. Services audit

Public implementation: `/services` is a **page-builder composition** —
`ServicesSection` renders either curated `config.items` (icon + tags +
CTA) or the CMS API (`GET /api/v1/services/` → `ServiceCard` grid).
Backend model: `Service(PublishableModel)` — full trilingual
title/short/description, `section` FK, `icon`, `cover_image`,
status/featured/public/sort + SEO — all fields already existed.

Gap: `ServiceViewSet` was read-only (`http_method_names` get/head/options
only). No staff serializer, no Studio, no nav entry, no dashboard
coverage. Authorized users could **not** manage any service content.

Fix: reused every existing field — zero schema changes. Added:
- `ServiceCreateUpdateSerializer` (Persian title+description required
  for publishing, mirroring article/project serializers).
- Full CRUD viewset (removed method restriction; added
  `search_fields`/`ordering_fields` mirroring projects).
- `by_slug` intentionally NOT added — services have no public detail
  route (`mapService.href` is `/services`); preview renders the card +
  body in-Studio instead.

---

## 6. Services Studio implementation

New files (all under existing architecture, no new deps):

- `frontend/src/features/services/api/staff.ts` — `listStaffServices`,
  `fetchStaffService`, `createStaffService`, `updateStaffService`,
  `fetchServiceSectionsStaff` via shared `apiClient` (same endpoints,
  staff token). Types: `StaffService`, `StaffServiceDetail`,
  `ServiceSectionSummary`, `StaffServiceListParams/Payload`.
- `frontend/src/features/services/hooks/staff.ts` — React Query hooks
  (`staffServiceKeys`, list/detail/sections, create/update with CMS
  cache invalidation), mirroring article/project staff hooks.
- `workspace/ServicesWorkspacePage.tsx` — search (debounced) + status
  tabs (`?status=` honored like articles/projects) + section filter +
  server pagination (20/page) + capability-gated write buttons +
  edit/preview/public row actions.
- `workspace/ServiceEditPage.tsx` — single-locale editing via
  `StudioLocaleSelect` + completeness dots; slug auto-derive; section
  picker; icon key; sort order; cover via `MediaPicker`; body via shared
  `RichTextEditor` (body image insert reuses picker); actionable
  `ContentHealthPanel` (slug/titles/summaries/bodies/cover/section);
  autosave 30s + dirty guard + `beforeunload`; field errors; save state.
- `workspace/ServicePreviewPage.tsx` — FA/EN/AR toggle; draft + status +
  featured + section badges; public breadcrumb; `ServiceCard` (same
  component as public) + cover + sanitized body + word stats; read-only.
- Barrel exports extended (`api/staff`, `hooks/staff`, `workspace`).

Wiring:

- `workspaceConfig.ts`: `services` route (`Briefcase` icon, content
  section, `CONTENT_SERVICES` capability) → sidebar shows
  Dashboard → Content → Articles / Projects / **Services** / Media.
- `routes/index.tsx`: lazy `services`, `services/new`
  (`SERVICES_UPDATE`), `services/:id/edit` (`SERVICES_UPDATE`),
  `services/:id/preview` (`SERVICES_VIEW`), all `staffOnly`.
- `capabilities.ts`: `CONTENT_SERVICES` (view + staff),
  `CONTENT_SERVICES_WRITE` (`services.update` + staff). Backend
  permission catalog unchanged — `services.*` codenames already seeded
  for SUPER_ADMIN / COMPANY_ADMIN / CONTENT_MANAGER (+view for
  PROJECT_MANAGER / EDITOR / VIEWER).
- i18n: full `serviceWorkspace` + `servicePreview` trees + nav +
  dashboard + `services.learnMore` in EN/FA/AR (locale-parity tests pass).

Permissions verified: projectmanager sees list, no write buttons,
`/services/new` → `/unauthorized`, backend POST with non-staff token →
403. `IsStaffOrReadOnly` semantics identical to articles/projects
(any staff may write; capability layer hides UI for read-only staff).

---

## 7. Dashboard improvements

- `backend/apps/core/services/dashboard.py`: `_content_section()` gains
  `services_drafts`, `services_awaiting_review`, `services_missing_fa/ar`;
  `_operations_section()` gains `recent_services`. Cached payload, same
  TTL; no secrets.
- `DashboardPage.tsx`: services attention-queue row (`→
  /dashboard/services?status=review`), New-service quick action,
  published/drafts/review content tiles, FA/AR translation-gap tiles,
  recent-services card. All capability-gated (`CONTENT_SERVICES*`).
- `types.ts`: optional new fields (old backends degrade gracefully).

Dashboard answers "what matters": drafts/reviews/inquiries queue,
one-click creation, content/editorial/operations/system sections kept
small (no card explosion).

---

## 8. Role UX improvements

- Role catalog, descriptions, responsibilities: already strong
  (`ROLE_CATALOG` + `RolePermissionSummary` + `UserDetailPage` role
  block). Left alone.
- `authorize.test.ts` matrix extended for the two new capabilities:
  COMPANY_ADMIN +CONTENT/CONTENT_WRITE, CONTENT_MANAGER
  +CONTENT/CONTENT_WRITE, PROJECT_MANAGER +CONTENT (view only),
  EDITOR/VIEWER none (non-staff gate). Nav expectations extended
  (`services` link for SUPER_ADMIN, PROJECT_MANAGER).
- Fixtures already mirrored backend seeders (incl. `services.*`) — no
  fixture change needed.

---

## 9. Permission UX

- `PermissionViewer` + `RolePermissionSummary` (grouped human-readable
  labels, codename secondary, restrictions, SUPER_ADMIN warning): already
  polished. Left alone.
- Services permissions were already in `PERMISSION_MODULES.services` —
  now they actually gate a visible workspace (previously dead strings
  from the UI's perspective).
- No authorization logic changed; backend remains authoritative.

---

## 10. Media UX

No new media system. Verified integration chain
Media Workspace → MediaPicker → Article/Project/**Service** Studio:
cover pick/remove, body image insert signal, localized alt text, lazy
previews, pagination preserved. Service Studio reuses the exact picker
contract (`open/onOpenChange/onSelect/title`).

---

## 11. Language UX

- `StudioLocaleSelect` reused unchanged in Service Studio (FA/EN/AR,
  completeness dots, Radix keyboard nav, RTL-safe).
- Single-locale mounting preserved (only active locale editor mounted;
  all three locales kept in state across switches — no data loss).
- Health findings carry `locale` → click switches editing language then
  scrolls to field (same as article/project studios).
- i18n locale-parity tests pass (FA/AR cover every EN key incl. all new
  `serviceWorkspace`/`servicePreview` keys).

---

## 12. Global design system polish

Deliberately minimal per Part S (do-not-overbuild): Button, Card,
Input, Badge, Select, Dialog, Tabs already consistent on Hanahoush
tokens (PRIMARY #932990, DEEP INK #272161, NEAR WHITE #FDFBFC). No theme
change, no new animation library, no gradient/glass additions. Polish
came from layout consistency (shared editorial shell) + preview parity,
not token churn.

---

## 13. Responsive improvements

- All three studios share `grid lg:grid-cols-[minmax(0,1fr)_320px]`:
  sidebar stacks below surface on mobile, sticky on desktop; tables use
  `overflow-x-auto` with hidden low-priority columns (`md:`/`lg:`);
  action bars wrap (`flex-wrap`); touch targets ≥ 32px (`size="sm"`).
- Mobile drawer suites pass (tablet_portrait/mobile/mobile_small).
- Known pre-existing: `responsive dashboard + workspace pages at mobile
  width` fails on `/dashboard/articles` overflow — that file was NOT
  modified in this phase (verified via diff); documented below.

---

## 14. Accessibility improvements

- Preserved patterns: skip-free labeled controls (`Label htmlFor`),
  `aria-label`/`aria-pressed` on locale toggles, `role="status"` on
  save-state/skeletons, `aria-live` on health/stats/counts,
  `aria-expanded`/`aria-controls` on TOC toggle, focus-visible rings
  from tokens, dialog focus-trap in `StaffLayout` drawer (Esc + Tab
  cycle), table captions (`sr-only`), `dir="auto"`/`dir="ltr"` on
  mixed-locale content.
- a11y Playwright suite passes.

---

## 15. RTL/LTR improvements

- Logical properties throughout (`ms-`/`me-`/`ps-`/`pe-`/`start-`/`end-`,
  `text-start`, `rtl:rotate-180` on directional icons).
- Studios set editor `dir` from editing locale (`en → ltr`, else rtl);
  slug/icon/order fields pinned `dir="ltr"`.
- RTL Playwright suite passes (FA/AR/EN).

---

## 16. Micro-interactions

No new animation systems. Existing GPU-friendly patterns reused:
`transition-colors` on buttons/cards/rows, `transition-transform` on
card images, `animate-spin` only for pending spinners, save-state
check transition, health badge updates, drawer transitions. Respects
`prefers-reduced-motion` (global CSS collapses durations). No infinite
decorative loops, no blur/filter effects, no canvas, no JS loops.

---

## 17. Performance work

- Route-level code splitting preserved: new Studio pages are lazy
  chunks (`ServiceEditPage` 14.63 kB / gzip 4.60 kB — smallest Studio).
- Only active locale editor mounted; paginated lists (20/page);
  debounced search (350ms); React Query caching + CMS invalidation on
  mutations; lazy images (`loading="lazy"`); no new dependencies
  (`package.json` untouched).
- Bundle total unchanged in shape: `index-*` 462.32 kB (gzip 150.46 kB),
  react 207.14 kB, motion 114.66 kB — no growth attributable to this
  phase beyond one ~15 kB lazy chunk.

---

## 18. Bundle/chunk observations

`npm run build` (Vite): success in ~4s. Notable chunks:
`ServiceEditPage-D4NhsgF6.js` 14.63 kB, `ArticleEditPage-CVNLQ6Ni.js`
16.19 kB, `ProjectEditPage-DtjQ0kP0.js` 30.15 kB (case-study editor +
gallery), `DashboardPage-CTZlZt_8.js` 21.41 kB. No chunk-size warnings
for new code. Storybook builds clean (~8-9s).

---

## 19. Network/request observations

- Staff list/detail reuse existing REST list + `?status=&section=&q=`
  filtersets (server-side, no over-fetch); sections endpoint unpaginated
  (2 rows) with 5-min `staleTime`.
- Draft protection verified live: `GET /api/v1/services/?q=<draft>`
  anonymous → 200 with **0 rows**; staff token → 200 with the row.
- No duplicate-request regressions introduced (single `useStaffService`
  per page; preview reuses detail query key domain).

---

## 20. Memory/RAM considerations

- No new global stores; no large arrays in state (pageSize 20);
  rich-text strings per-locale (no duplication across locales);
  gallery N/A for services (cover only — lighter than projects);
  preview unmounts editor; pickers mount on demand.
- No profiling regression observed; DevTools not claiming more than
  measured: chunk sizes + request counts above are the evidence.

---

## 21. Backend changes

- `apps/services/api/serializers.py`: +`ServiceCreateUpdateSerializer`
  (existing fields only; FA gate on publish).
- `apps/services/api/viewsets.py`: full CRUD (removed GET-only
  restriction; `get_serializer_class` write branch; search + ordering
  fields).
- `apps/core/services/dashboard.py`: services drafts/review/gaps +
  `recent_services`.
- `apps/services/tests/test_service_write.py` (new, 6 tests).
- No models changed. No migrations. Admin unchanged (already complete).

## 22. Frontend changes

15 modified files + 5 new areas (see §32). No `package.json` change, no
new dependency, no router/query/auth/i18n/media/editor replacement.

## 23. API changes

- `POST /api/v1/services/` (staff) → 201; `PATCH/PUT
  /api/v1/services/:id/` (staff); `DELETE` soft-delete via base viewset
  (staff). Public `GET` list/detail shapes **unchanged**.
- `GET /api/v1/admin/dashboard/` gains optional
  `content.services_drafts/awaiting_review/missing_fa/missing_ar` +
  `operations.recent_services` (additive, backward compatible).

## 24. Database/migration status

- `makemigrations --check` → **No changes detected**.
- `manage.py check` → **no issues**.
- Working tree `backend/db.sqlite3` **unmodified** (restored after test
  runs). Live DB holds exactly the 4 demo services; all E2E drafts
  (`phase155-*`) and probe rows (`x-e2e-denied`) deleted and verified.

## 25. Security/RBAC verification

- Backend: anonymous POST → 401/403; non-staff POST/PATCH → 403
  (covered by new tests); staff CRUD → 200/201; drafts invisible
  publicly (live check).
- Frontend: `RequirePermission(SERVICES_UPDATE)` on edit routes,
  `RequireAnyPermission(SERVICES_VIEW)` on list/preview, all
  `staffOnly`; write buttons hidden without
  `CONTENT_SERVICES_WRITE`; `/services/new` → `/unauthorized` for
  read-only staff (Playwright-verified).
- No secrets in payloads (dashboard secret-scan test still passes).

## 26. Exact tests

| Suite | Result |
|---|---|
| Backend pytest (full) | **353 passed** (was 347; +6 `test_service_write.py`) |
| Frontend Vitest | **271 passed / 51 files** (was 262/48; +13: 3 list + 3 edit + 3 staff-api + i18n parity incl. new keys + updated matrix) |
| `tsc --noEmit` | clean (exit 0) |
| ESLint (touched areas) | clean |
| `vite build` | success (~4s) |
| `build-storybook` | success (~8s) |
| Playwright services-studio (new) | **2/2** |
| Playwright workspace | 12/12 (incl. 4 Phase-15 round-trips) |
| Playwright roles/RTL/user-admin/smoke | 34/34 equivalent (roles 9/9, smoke 16/16, user-admin 2/2) |
| a11y/responsive/theme/seo/errors/perf | pass except 2 pre-existing flakes (§28) |

## 27. Real browser verification (Edge/Chromium, real Django + Postgres-lived DB + Vite)

- SUPER_ADMIN/COMPANY_ADMIN/CONTENT_MANAGER/PROJECT_MANAGER/EDITOR/VIEWER
  login → dashboard → nav → backend → logout (roles.spec 9/9).
- Services (contentmanager): list → search → Published/All tabs →
  section filter → New service → single-locale fill → Create draft →
  list shows row → staff API sees row → public hides row → edit →
  preview (FA/EN/AR toggle) → no page errors.
- Services (projectmanager): list visible, New/Edit hidden, `/new` →
  `/unauthorized`, non-staff POST → 403.
- Articles/projects/media/contact/newsletter/editorial round-trips
  still green (workspace.spec 12/12).
- Mobile drawers (3 viewports) green; public smoke (incl. `/services`)
  green.

## 28. Bugs found and fixed

1. **Services read-only by design** → staff write path + Studio (core
   fix, §5/§6).
2. **Article Studio shell drift** → 2-column editorial shell (§3).
3. **Article preview missing reading experience** → progress/TOC/tags/CTA
   (§3).
4. **Dashboard blind to services workflow** → counts + recent (§7).
5. **Capability matrix/nav tests stale** (new capabilities unasserted) →
   matrix + nav expectations updated (all 63 auth tests pass).
6. **E2E env**: backend process had been killed mid-phase (my own
   `Stop-Process` during DB-state check) → restarted; spec hardened
   (non-staff backend denial via editor token, matching
   `IsStaffOrReadOnly` semantics shared with articles/projects).
7. **Git worktree scare**: an exploratory `git stash` round-trip briefly
   reverted sources; fully restored from stash (verified: 709 insertions
   back), stash dropped, temp files removed, DB restored.

Pre-existing (NOT introduced, NOT fixed — out of scope):
- `cursor-grid` scroll-story visual threshold flake (`gridScale`
  0.91 vs 0.97 expected; file untouched).
- `responsive dashboard + workspace at mobile width` overflow on
  `/dashboard/articles` (file untouched; my new Services pages use the
  same responsive table/shell patterns and pass drawer checks).

## 29. Known issues

- The two flakes above; both reproduce independent of this phase's
  files.
- Playwright full-suite wall time >2 min per file batch (Edge,
  serial workers) — no config change made.

## 30. Deferred work

- SEO phase (canonical/OG/JSON-LD/sitemap architecture) — explicitly
  next, untouched.
- Service detail public route (`/services/:slug`) — does not exist by
  design (page-builder composition); not built.
- Service section management UI (sections assignable via picker;
  section CRUD stays in Django admin) — sufficient for parity.
- Editorial workflow binding for services (submit-for-review button) —
  omitted: articles/projects wire workflows per-content-type; services
  publish via status field like other metadata (statusHint copy says
  so). Can be added in a workflow phase if desired.
- The pre-existing responsive overflow + cursor-grid flake.

## 31. SEO — explicitly NEXT PHASE

Nothing added: no SEO architecture, dashboard, JSON-LD, canonical, or
sitemap work. Only pre-existing `meta_title`/`meta_description` fields
exposed in Studio forms (they were already model fields + public
serializer fields).

## 32. Files changed/created

Modified (15):

- `backend/apps/core/services/dashboard.py`
- `backend/apps/services/api/serializers.py`
- `backend/apps/services/api/viewsets.py`
- `frontend/src/app/routes/index.tsx`
- `frontend/src/app/workspace/workspaceConfig.ts`
- `frontend/src/features/articles/workspace/ArticleEditPage.tsx`
- `frontend/src/features/articles/workspace/ArticlePreviewPage.tsx`
- `frontend/src/features/auth/role-config/capabilities.ts`
- `frontend/src/features/auth/tests/authorize.test.ts`
- `frontend/src/features/dashboard/pages/DashboardPage.tsx`
- `frontend/src/features/dashboard/types.ts`
- `frontend/src/features/services/index.ts`
- `frontend/src/i18n/locales/{en,fa,ar}/translation.json`

Created (5 areas):

- `backend/apps/services/tests/test_service_write.py`
- `frontend/src/features/services/api/staff.ts` (+ `staff.test.ts`)
- `frontend/src/features/services/hooks/staff.ts`
- `frontend/src/features/services/workspace/` (list/edit/preview +
  barrel + 2 test files)
- `frontend/e2e/services-studio.spec.ts`
- `docs/reports/phase-15.5-report.md` (this file)

## 33. Final recommendation

Merge-ready. Suggested next: **SEO dedicated phase** (per plan), with
the two pre-existing flakes (cursor-grid threshold, articles mobile
overflow) as optional drive-bys. Services workflow binding
(submit-for-review) only if editorial requires it — status-field
publishing covers current needs.
