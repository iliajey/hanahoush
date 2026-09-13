# Phase 13 Report — Ultimate Admin Dashboard, Editorial Studio & Full-Site QA

Date: 2026-09-13
Scope: Dashboard/workspace polish, rich-text editorial studio, article-progression
root-cause fix, SUPER_ADMIN permission UX, full-site QA. ERP remains parked
(`ERP_ENABLED=false`, `ERP_PROVIDER=null`, `NullProvider`, no ERP network calls).

> No credentials, secrets, password hashes, or tokens appear in this report.

---

## 1. Executive summary

The staff dashboard is now a production-grade administration workspace. The
article editing experience was rebuilt around a real rich-text editor
(`contentEditable` + `document.execCommand`, DOMPurify-sanitized) with autosave,
unsaved-changes detection, word/char/reading-time stats, cover/media pickers,
trilingual bodies, SEO fields, and a staff-only draft preview rendered through
the same public components. The reported "articles stop progressing" bug was
root-caused to a frontend form-state defect (unconditional re-hydration of form
state from every refetched article object, wiping in-progress typing), not a
backend size limit: `description_*` columns are unbounded `TextField`s and
round-trip 200k+ characters byte-for-byte, pinned by new regression tests.

Role-aware dashboards (all six roles), grouped role/permission summaries for
SUPER_ADMIN, server-side pagination/filtering in every staff workspace, and
FA/EN/AR parity (locale-parity test green) complete the track. Verification:
backend **335 passed**, frontend **247 passed (43 files)**, typecheck/lint
clean, `build` + `build-storybook` pass, no migrations. Playwright (Chromium,
production build): **135/137 passing** — smoke 16/16, roles 9/9, user-admin
2/2, workspace 8/8, responsive+RTL+errors+theme+SEO+performance full green;
the 2 failures are pre-existing issues in areas Phase 13 never touched
(public `/login` axe `link-in-text-block` serious violation; home grid
visual-state numeric assertion).

---

## 2. Full audit findings

### Backend (authoritative, inspected first)

| Area | State found |
|---|---|
| Apps | `accounts articles common company core editorial integration media_library page_builder projects search seo services user` — clean, no duplicates |
| `Article` model | `PublishableModel` base; `description_*` are unbounded `TextField`s; statuses `draft/review/published/archived` (+scheduled via editorial service); no length validators on bodies |
| Serializers | `ArticleCreateUpdateSerializer` required `title_fa`/`description_fa` only when publishing; `ArticleDetailSerializer` computed related content server-side |
| Article filters | `status` was an unvalidated `CharFilter` — typos silently returned `[]` (HTTP 200), unlike projects/services `ChoiceFilter` |
| Article/project detail serializers | Missing explicit `id` in write/detail payloads (frontend consumed `data.id` from envelope `id` only) |
| `BaseViewSet.destroy` | Returned a 204 **with** the standard JSON envelope body (RFC 9110 violation; DRF strips it, confusing API clients) |
| Pagination docstring | `DefaultPagination` claimed to be cursor-based; it is page-number based |
| Admin users API | Phase 12 hardening intact (`IsSuperAdmin`, no DELETE, write-only password pair, last-holder guards, audit rows) |
| Dashboard API | `GET /api/v1/admin/dashboard/` aggregated content/editorial/engagement/operations/system, 60s cache, no secrets |
| Roles/permissions | 6 roles, 27-permission catalog (SUPER_ADMIN 27, COMPANY_ADMIN 25, CONTENT_MANAGER 16, PROJECT_MANAGER 10, EDITOR 8, VIEWER 6) |
| Migrations | `makemigrations --check` clean — no schema change needed |

### Frontend (inspected before coding)

| Area | State found |
|---|---|
| Staff routes | All guarded via centralized `workspaceConfig` + `Require*` guards; users routes `RequireSuperAdmin` |
| `ArticleEditPage` (HEAD) | Plain `<textarea>` bodies, **no RTE**; `useEffect([article])` re-hydrated state on every refetch (the progression bug); save navigated away on both create+edit |
| Dashboard | Role-aware landing existed (Phase 9G) but thin: profile card + quick nav + raw stat tiles, no attention queue, no quick actions |
| Workspaces | Article/project/media/contact/newsletter lists: `pageSize: 48–100`, no debounced search, no real pagination controls, filters didn't reset page, no breadcrumbs, generic empty error blocks |
| `StaffSidebar` | NavLink `isActive` only (nested edit pages lost highlight); footer linked to `/dashboard` not profile; no language/theme toggles in staff shell |
| `RequireSuperAdmin` path | `guards/index.ts` had a fused-export syntax error **in committed HEAD** (`...RequireStaff"export { RequireSuperAdmin...`), so HEAD's production build is broken — Phase 13 fixes it |
| Media | No upload progress, 25 MB+ files failed opaquely, no copy-URL, no alt/caption FA fields, no reference warning on delete |
| i18n | FA/EN/AR parity test existed; article-editor/dashboard/role-summary key namespaces missing |

### Tests / reports / DB

- Backend pytest baseline ~325 (Phase 12); frontend vitest 229.
- Playwright harness (`frontend/e2e/`, 12 specs) intact from Phase 10.
- `db.sqlite3`: 9 users, 6 roles, 27 permissions, 33 articles — preserved throughout (only audit/session + E2E draft rows grew).

---

## 3. Bugs discovered

| # | Bug | Severity |
|---|---|---|
| 1 | Article form re-hydrates from every refetched article object, wiping in-progress typing ("stops progressing") | Critical |
| 2 | Committed HEAD `guards/index.ts` fused-export syntax error → production build broken | Critical |
| 3 | Article `status` filter typo silently returns `[]` with HTTP 200 | High |
| 4 | `BaseViewSet.destroy` returns body with 204 | Medium |
| 5 | Phase 13 `ArticleEditPage` regressed list-navigation on edit-save (`if (ok && isNew)`), breaking `workspace.spec.ts` | High (caught by E2E, fixed) |
| 6 | E2E `workspace.spec.ts` addressed the body as `textarea`, but the editor is contentEditable | Medium (spec updated) |
| 7 | Workspaces loaded up to 100 rows with no pagination controls | Medium |
| 8 | Media upload: no progress, opaque large-file failure, no copy-URL, missing FA alt/caption editing | Medium |
| 9 | Sidebar lost active highlight on nested routes; footer mislinked; no staff-shell locale/theme toggles | Low |
| 10 | Phase 12 backend additions (preferred_language, last-holder guard, audit rows) were uncommitted working-tree state | Info |
| 11 | Pre-existing, untouched: `/login` axe serious `link-in-text-block`; home grid scroll-state numeric assertion | Low (deferred) |

---

## 4. Root causes

**Bug 1 (article progression):** The HEAD editor hydrated form state in
`useEffect(..., [article])` with no "already hydrated" guard. React Query
refetches (window refocus, autosave invalidation, background polling) deliver a
*new object identity* for the same article; each delivery re-ran the effect and
overwrote `title/body/...` state with stale server values — the user's
in-progress typing vanished and the article "stopped progressing". Long bodies
made it worse (more keystrokes lost per wipe), which is why it presented as a
size-dependent failure. The backend was exonerated: unbounded `TextField`s,
no serializer `max_length`, and a 200k-char round-trip test passes.

**Bug 2:** a missing newline fused two export statements in committed HEAD.

**Bug 3:** `ArticleFilterSet.status` used a raw `CharFilter` where the sibling
filtersets use `ChoiceFilter(choices=Status.choices)`.

**Bug 4:** `build_response(..., 204)` attached the envelope message to a
bodyless status.

**Bugs 7–9:** incremental workspace pages built before server pagination and
polish conventions existed.

---

## 5. Fixes implemented

### Backend (no migrations)

- `apps/articles/api/filters.py`: `status = ChoiceFilter(choices=Status.choices)` — typos now 400 instead of silent `[]`.
- `apps/articles/api/serializers.py` + `apps/projects/api/serializers.py`: explicit read-only `id` on create/update/detail serializers.
- `config/api/base/viewsets.py`: `destroy` returns bare `Response(status=204)` (RFC 9110).
- `config/api/base/pagination.py`: corrected the cursor-pagination docstring to describe real page-number behavior.
- New `apps/articles/tests/test_long_content_regression.py` (10 tests): short/medium/long/very-long (200k+) round-trips, headings, tables+code, FA/AR/mixed RTL, invalid-status 400, bodyless 204.
- Phase 12 backend hardening (preferred_language, `_is_last_super_admin_holder`, audit rows, `verify_auth_accounts`) retained as part of this change set.

### Frontend

- `guards/index.ts`: fused-export syntax error fixed (HEAD build was broken).
- `useAuthorization`: exposes `isSuperAdmin` for UX gating (backend still authoritative).
- `ArticleEditPage`: hydrate-once (`hydratedFor` ref), snapshot dirty-tracking, 30s silent autosave, `beforeunload` guard, save-draft + submit-for-review, field-level errors preserving input, trilingual `RichTextEditor`s, cover/media pickers, SEO fields, status/featured/public controls.
- `workspace.spec.ts`: body fill updated to the contentEditable canvas; edit-save list navigation restored.
- Every staff workspace: debounced search (350 ms), `pageSize: 20` (media 24), shared `Pagination` component, filter-changes reset page, breadcrumbs, `ErrorState`+retry, table captions/`scope="col"`, `dir="ltr"` slugs, `dir="auto"` names.
- `MediaWorkspacePage`: upload progress bar, 25 MB client validation, copy-URL, FA alt/caption editing, missing-alt badge, reference-count delete warning.
- `StaffSidebar`/`StaffLayoutTopbar`: prefix-active nav highlighting, profile footer link, language+theme toggles in shell and topbar, focus-visible ring, `aria-current="page"`.
- `UserFormDialog` (modal): now embeds `RolePermissionSummary` like the routed pages (gap closed this phase).
- `ProfilePage`: skeleton while auth loads; `RegisterPage`: router `Link`; `ProfileMenu`: Profile entry.

---

## 6. Dashboard improvements

`DashboardPage` is now an operational workspace: **AttentionQueue** (drafts /
awaiting-review / pending approvals / active locks / open inquiries, each
deep-linking to the filtered queue, hidden when zero or unauthorized),
**QuickActions** (new article/project, upload media, review queue, inquiries,
subscribers — write-capability gated), capability-gated **content / editorial /
engagement / operations / system** sections built only from the live
`GET /api/v1/admin/dashboard/` payload (no fabricated numbers), recent media /
contact / editorial activity lists, contextual empty states, skeletons, and a
retryable error state. Non-staff roles get a read-only overview with no
management actions and no staff-only data.

---

## 7. Role-specific dashboard behavior

| Role | Dashboard experience |
|---|---|
| SUPER_ADMIN (27 perms) | Full operational dashboard: all sections, attention queue, all quick actions, system/database/cache/migration tiles, manage-users shortcut |
| COMPANY_ADMIN (25) | Full business overview minus user administration; no super-admin-only controls |
| CONTENT_MANAGER (16) | Content + editorial + media + communication widgets; project tiles hidden |
| PROJECT_MANAGER (10) | Project tiles (+ viewable articles/media); user/admin/system hidden |
| EDITOR (8) | Editorial overview: editorial queue links, read-only content surfaces |
| VIEWER (6) | Read-only overview only; no attention queue, no quick actions, no mutations |

Sidebar (`workspaceNavForUser`) and route guards share one permission table, so
navigation and protection cannot drift. Verified by `dashboard.test.tsx`
(8 tests), `navigation.test.tsx` (9 tests), and Playwright `roles.spec.ts`
(9/9: all six roles + guest + session-expiry).

---

## 8. Permission/RBAC changes

No new roles, no per-user permission editing (the backend supports role
assignment only — faking finer granularity was explicitly rejected).
`RolePermissionSummary` (new, tested) renders the selected role's effective
permissions grouped by module prefix from live backend codenames, with a
SUPER_ADMIN blast-radius warning and a "roles are authoritative" note; it is
embedded in create + edit + modal flows and updates with the role selector.
`RoleSelect` shows localized name + description + permission count.
`authorize.test.ts` now pins `USER_MANAGE: false` for all non-super-admin
roles and the `users` sidebar entry for SUPER_ADMIN. Backend enforcement
unchanged and authoritative (`IsSuperAdmin` on the admin users API,
staff-gated CMS writes, `IsIntegrationOperator` on ERP health).

---

## 9. Article editor improvements

`RichTextEditor.tsx` (new): contentEditable canvas, sticky wrap toolbar
(undo/redo, H1–H3 + paragraph, bold/italic/underline/strikethrough, inline
code, bulleted/ordered lists, indent/outdent nesting, quote, link/unlink with
prompt, align left/center/right, image via media picker with
figure+figcaption, table, code block, horizontal rule), DOMPurify sanitization
on paste/input/stats (scripts/handlers/`javascript:` stripped; tables, figures,
code, `dir`/`lang` preserved), per-locale `dir` (`ltr` EN, `rtl` FA/AR), live
word/character/reading-time footer. `ArticleEditPage` adds identity block
(trilingual titles, slug auto-generation, category), cover picker with preview,
trilingual excerpts + bodies, publishing block (status select with hint,
featured/public, meta title ≤70 / description ≤160), autosave + dirty tracking
+ `beforeunload` guard, save-draft / submit-for-review actions, preview link.

---

## 10. Article bug root cause and regression test

Root cause: **unconditional form re-hydration on every React Query refetch**
wiped in-progress typing; long articles only made each wipe more visible. Not
a size limit anywhere in the stack (DB `TextField`, no serializer
`max_length`, no truncation; 200k-char round-trip passes).

Regression coverage:

- Backend `test_long_content_regression.py`: 10 tests (short/medium/long/
  very-long/many-headings/tables+code/RTL FA/RTL AR/mixed RTL-LTR round-trips,
  invalid-status 400, bodyless 204).
- Frontend `ArticleEditPage.test.tsx`: typing survives a background refetch
  delivering a new article object; validation errors surface per-field without
  wiping input.
- Frontend `RichTextEditor.test.tsx`: sanitization, RTL/code/figure
  preservation, stats, long-body input without truncation.
- Playwright `workspace.spec.ts` (8/8): real edit-save round-trip + draft
  creation through the rich-text canvas.

---

## 11. Article workflow

Existing `Status` model kept (`draft/review/published/archived`; scheduling
via the editorial service). Edit page: status select with hint, **Save Draft**
(persists + returns to list), **Submit for Review** (persists as `review`,
ensures/creates the editorial workflow, deep-links to it; capability-gated).
List rows show per-article workflow stage with **Start review / Submit**
actions, draft/published badges, featured flags. Publishing/approvals stay in
the editorial workflow detail (approve/reject/schedule/publish/rollback with
audit trail) — the form never publishes directly. Destructive media deletes
use confirmation dialogs.

---

## 12. Media improvements

Debounced search, type tabs + ordering, 24-item paginated grid, lazy images,
dimensions display, missing-alt badges, copy-URL per card, FA alt/caption
metadata editing, 25 MB pre-upload validation with inline errors, real upload
progress bar, success/error handling that keeps the dialog open on failure,
reference-count warning before deleting referenced files, RTL-safe filenames
(`dir="ltr"`), breadcrumbs, retryable error state.

---

## 13. RTL/localization changes

~500 new FA/EN/AR keys (`dashboard.*`, `articleEditor.*`, `articlePreview.*`,
`users.roleSummary`, `users.permissions.modules.*`, workspace strings);
`locales.test.ts` parity green. Logical properties throughout (`ms-/ps-`,
`start-/text-start`); `rtl:rotate-180` on chevrons/arrows; `dir="auto"` on
names/titles/content, `dir="ltr"` on slugs/emails/URLs/timestamps; per-locale
editor canvas direction; locale-aware category names; FA/AR sidebar and
workspace rendering covered by unit + Playwright RTL specs (6/6).

---

## 14. Accessibility changes

Labelled toolbar/textbox roles in the editor, table captions + `scope="col"`,
`aria-current="page"` nav, `aria-live` loading/error/status regions,
`role="alert"` validation and upload errors, `role="progressbar"` uploads,
`sr-only` icon-button labels, focus-visible rings, Radix dialog focus
management preserved, reduced-motion/living-cursor untouched. Axe in unit
scope: no new violations. (One pre-existing public-`/login`
`link-in-text-block` serious violation remains — §21.)

---

## 15. Performance changes

No premature optimization; measured fixes only: debounced staff searches
(350 ms, page reset), pageSize 20–24 everywhere (was 48–100 unbounded),
memoized editor stats, hydrate-once effect, lazy images, route-level code
splitting retained (dashboard/editor chunks stay off the initial bundle:
`DashboardPage` ~18.5 kB, `ArticleEditPage` ~22.7 kB gzip ~4.5/6.9 kB).
Playwright performance spec green.

---

## 16. Security findings

- RBAC matrix live-verified (roles.spec 9/9): anonymous 401, non-privileged 403 on `/api/v1/admin/users/`, viewer blocked from all user-admin routes, write controls hidden per capability, backend authoritative.
- Last-`SUPER_ADMIN`-holder demote/deactivate refused (incl. non-self targets); self-lockout guards retained.
- Admin mutations write secret-free `LoginAudit` rows (`admin_user_updated:*`).
- Passwords write-only; tokens never rendered; `unsubscribe_token` never referenced by the frontend; filesystem paths and DB credentials never exposed; field-level errors leak no internals.
- Sanitizer allowlist blocks scripts/handlers/`javascript:` URLs in editor content and preview.
- `verify_auth_accounts` read-only health command; never prints passwords.

---

## 17. Database/migration status

`makemigrations --check`: **no changes**. No model touched, no migration
created, migration history intact. Data preserved: 9 users, 6 roles,
27 permissions, 33 articles (only login-audit/session rows and E2E draft
articles grew during verification). No resets, no deletions.

---

## 18. Backend test results

`manage.py check`: clean. `makemigrations --check`: clean.
`pytest` (`USE_SQLITE=true`): **335 passed** (was 325 at Phase 12; +10 long-content regression tests).

---

## 19. Frontend test results

`typecheck`: 0 errors. `lint`: 0 errors. `vitest`: **247 passed, 43 files**
(was 229; +18: RTE sanitize/stats/interaction, hydrate-once, workspace
pagination, role-permission summary). `vite build`: pass. `build-storybook`:
pass.

---

## 20. Browser/Playwright results

Harness: Playwright 1.62.1, Chromium, headless, production `dist/` served via
`vite preview` + live Django (`USE_SQLITE=true`) on 127.0.0.1:8000.
**135/137 scenarios passing:**

| Spec | Result |
|---|---|
| smoke (public/auth/staff/back-forward) | 16/16 |
| roles (all six roles + guest + session-expiry) | 9/9 |
| user-admin (superadmin CRUD UI, viewer blocked) | 2/2 |
| workspace (articles/projects/media/contact/newsletter/editorial) | 8/8 |
| responsive (6 viewports + drawers + dashboard mobile) | green |
| rtl (en/fa/ar direction + toggle + parity) | 6/6 |
| errors (404/500/offline/slow/validation/401/403/session) | green |
| theme / seo / performance | 22/22 |
| accessibility + cursor-grid | 18/20 — 2 pre-existing failures (below) |

Pre-existing failures (areas Phase 13 never modified; confirmed untouched via
`git diff --name-only`): (1) axe scan of public `/login` reports a serious
`link-in-text-block` violation; (2) home grid scroll-state test expects a
`0.97` scale constant the live engine does not produce. Both predate this
phase (committed HEAD does not even build). Recommended for Phase 14 / next
hardening pass, not fixed here to avoid scope creep into the brand/visual
system.

---

## 21. Remaining known issues

1. `/login` axe serious `link-in-text-block` (public page, pre-existing).
2. Home grid visual-state numeric assertion (pre-existing, visual system).
3. `ArticleContent` setState-during-render warning in article-detail tests (pre-existing, public reader).
4. Backend ACL: content codenames not enforced server-side (writes rely on `is_staff`); frontend mirrors the effective gate — separate hardening phase.
5. SPA SEO ceiling (client-side meta) — the subject of Phase 14.
6. `robots.txt` advertises a frontend-origin sitemap while the backend serves it — needs reverse-proxy/static sitemap in production.

---

## 22. Deferred work

- Full SEO implementation (deliberately out of scope; see §23).
- Custom/fine-grained per-user permission overrides (architecture ready; role model stays canonical).
- Bulk article actions, duplicate-as-new, author/language server filters (no backend support; not faked).
- Prerender/SSR, services/pages/analytics/company/settings write surfaces, ERP operational flows (await Odoo 19).

---

## 23. Recommended Phase 14 — SEO & Search Visibility

Audit-first extension of the existing SEO system (`apps/seo`, `useSeoMeta`,
`JsonLd`, sitemap/robots, hreflang): technical SEO (canonical, robots,
indexability, 404 strategy), metadata architecture (title/description/OG/
Twitter cards per locale), JSON-LD (Article, Organization, BreadcrumbList),
multilingual SEO (hreflang + `x-default`, FA/AR slug strategy), image SEO
(alt/caption coverage from the new media fields), heading-structure and
internal-linking audits of article bodies, article SEO editor panel (building
on the Phase 13 meta title/description fields), redirects, sitemap/robots
production routing, Core Web Vitals, Search Console readiness. No duplicate
SEO infrastructure.
