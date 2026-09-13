# Phase 14 Report — Ultimate Dashboard Experience, Project Studio, Media System & Role UX

Date: 2026-09-13
Scope: P0 image upload/display root-cause fix, Project Studio (parity with
Article Studio), project gallery API, media library upgrade, language
dropdown, role/permission UX, dashboard recents, mobile/RTL/a11y hardening,
full regression. ERP remains parked (`ERP_ENABLED=false`,
`ERP_PROVIDER=null`, `NullProvider`, no ERP network calls). SEO work was NOT
started — it remains the next dedicated phase.

> No credentials, secrets, password hashes, or tokens appear in this report.

---

## 1. Executive summary

The dashboard is now a production-grade management workspace. The headline
P0 — uploaded images rendering blank/broken — was root-caused to a dual
defect and fixed at the root on both sides:

1. **Backend** returned relative `/media/…` URLs while the SPA runs on a
   different origin in development (`:5173` vs `:8000`), so `<img src>`
   resolved against the frontend host and 404'd. All media serializers now
   emit absolute URLs via `request.build_absolute_uri`
   (`backend/apps/core/media.py`).
2. **Frontend** had no URL normalization — every consumer used raw
   `cover_image.file` / `preview_url` strings. A shared
   `resolveMediaUrl`/`resolveMediaFile` helper now joins relative paths onto
   the API origin, and `ResponsiveImage` resolves at render time.

Project management was rebuilt into a real **Project Studio**: two-column
workspace (identity/content/details/gallery left, publishing sidebar right),
rich-text trilingual bodies, MediaPicker cover + gallery, autosave, dirty
guard, category/technology pickers, SEO fields, submit-for-review via the
existing editorial workflow (`projects.project`), and a new staff-only
trilingual preview page (`/dashboard/projects/:id/preview`). A new staff
gallery API (`gallery/`, `gallery/<id>/`, `gallery/reorder/`) drives cover
flags, alt text, ordering and removal on the existing normalized
`ProjectImage` model — no schema changes, no migrations.

Also delivered: language dropdown (FA/EN/AR menu, keyboard + RTL-aware),
human-readable role/permission summaries with restrictions, dashboard
"Recently updated" recents, media grid/list views + preview dialog, Article
Studio content-health panel, mobile drawer focus-trap, mobile overflow fixes,
and an a11y link-color fix.

Verification: backend **242 passed**, frontend **255 passed (46 files)**,
typecheck/lint clean, `build` + `build-storybook` pass, no migrations.
Playwright (Edge/Chromium, dev server): **146/146 passing** — roles 9/9,
workspace + user-admin 10/10, responsive/RTL/smoke/accessibility green.

## 2. Dashboard audit

Pre-code audit (subagents + manual reads) covered: StaffLayout, StaffSidebar,
topbar, DashboardPage, users/articles/projects/media/contact/newsletter
workspaces, Profile, role/permission components, Article Studio, project
forms/detail, all media serializers, upload endpoints, MEDIA config, Vite
config (no dev proxy — split origins), i18n FA/EN/AR, design tokens,
responsive CSS, all dashboard routes, backend + frontend + e2e tests.

Findings: split-origin image bug (P0), ProjectEditPage far behind
ArticleEditPage (plain textareas, no cover/gallery/autosave/preview/
workflow), language cycle-button unscalable at 3 locales, role summaries
showing raw codenames only, media grid without list view or preview, topbar
leaking the raw `{pathname}`, fixed-width filter selects overflowing at
390px, dashboard missing recents, no project preview route.

## 3. Dashboard redesign

- Topbar: raw pathname replaced with the role's workspace description;
  SUPER_ADMIN marker kept.
- Mobile drawer: Escape-to-close + focus trap (Tab cycles inside, initial
  focus into the drawer), `aria-modal` retained.
- Dashboard home: "Recently updated" section (articles + projects, capability
  gated, deep-links to edit pages) backed by two new `_operations_section`
  queries; defensive `?? []` guards so older payload shapes never crash the
  page (this exact crash was caught by the roles e2e during verification).
- All workspace filter selects: `w-full sm:w-48`-style responsive widths.

## 4. Project Studio

`ProjectEditPage.tsx` rewritten (existing API only) as a two-column studio:

- LEFT: identity (trilingual titles, slug with auto-generation, client,
  location, dates, live URL), excerpts, rich-text trilingual bodies
  (shared `RichTextEditor` with image insertion), details (technology
  checkboxes, meta title/description), gallery card.
- RIGHT (sticky): publishing (status select + hint, category, featured/
  public flags, word count, last-updated), cover card (MediaPicker,
  preview, remove), actions (submit-for-review when permitted, save,
  cancel) + save-state badge in the header.
- Autosave (30s silent), dirty snapshot, `beforeunload` guard, field-level
  backend errors preserved in the form — same mechanics as Article Studio.
- Payload extended to the backend's full write surface: category,
  technologies, cover_image, meta fields (previously dropped on save).
- Gallery: add via MediaPicker, reorder (up/down → persisted order),
  cover-flag toggle, remove with soft-delete safety; save-first empty state
  for new projects.
- Workflow: uses the existing `Status` lifecycle (draft/review/published/
  archived) + editorial workflow actions (`projects.project`), permission
  gated; no second workflow invented.

## 5. Article Studio improvements

Untouched mechanically; added a **Content health** card: total words,
reading minutes, heading count, body-image count (all computed from the
three locale bodies), plus actionable notes (missing cover, no headings,
thin locales < 50 words) or a healthy confirmation. Cover preview and
preview page now resolve through `resolveMediaUrl`.

## 6. Image/media root cause

Lifecycle traced end to end. Upload path was healthy (multipart parser,
Pillow verification, FileField storage, 201 with serialized row). The break
was in **URL generation + consumption**:

- Backend: every serializer returned `obj.file.url` (relative). With the
  SPA on `:5173` and the API on `:8000`, the browser requested
  `http://localhost:5173/media/…` → 404 → blank/broken image.
- Frontend: ~20 consumers used raw strings; no normalization helper
  existed (`normalize*|getImageUrl|resolveImage` → 0 hits); mappers passed
  `cover_image.file` straight through to `<img>` and OG tags.

## 7. Image/media fixes

Backend (`apps/core/media.py` + 8 serializers/services):

- `absolute_media_url(request, url)` / `media_file_url(request, field)`:
  absolute/data/blob passthrough, `build_absolute_uri` join, safe `None`
  on missing files, never breaks serialization.
- Applied to: media `preview_url`, project cover/og/gallery, article
  cover/og, company `media_ref` (+ request threading), services cover,
  base `PublishableSerializerMixin.seo.og_image` + `NestedMediaFile`,
  page-builder `og_image`, search `image` (new `request` kwarg).
- Admin `image_preview_html` call sites left as-is (same-origin admin).

Frontend (`shared/lib/resolveMediaUrl.ts` + consumers):

- `resolveMediaUrl` joins relative paths onto the `VITE_API_BASE_URL`
  origin; `resolveMediaFile` prefers `preview_url`, falls back to `file`.
- `ResponsiveImage` resolves at render (covers all marketing/public
  surfaces with zero per-call-site changes); mappers, SEO hooks, search
  thumbnails, navbar/about logos, studio cover previews, media
  library/picker all resolved.

Regression tests: `test_absolute_urls.py` (upload/gallery/article/search
absolute URLs), `resolveMediaUrl.test.ts`, mapper expectation updated.

## 8. Role UX

- `ROLE_CATALOG` kept; EN/FA/AR `roles.*` now carry `responsibilities`
  copy derived from the backend `ROLE_DEFINITIONS` permission sets:
  SUPER_ADMIN (all incl. user/role mgmt), COMPANY_ADMIN (company ops),
  CONTENT_MANAGER (articles/services/company + editorial), PROJECT_MANAGER
  (portfolio + project media/workflow), EDITOR (article writing), VIEWER
  (read-only).
- Dashboard `host.role.*` titles/descriptions already existed per role and
  are surfaced in the sidebar footer + topbar; role badge on the dashboard
  header.

## 9. Permission UX

- `RolePermissionSummary` upgraded: human-readable action labels
  ("Publish articles" primary, `articles.publish` secondary), per-module
  cards with counts, SUPER_ADMIN warning, **restrictions section** listing
  modules the role lacks, authoritative-role note. Used unchanged on user
  create/edit/modal flows.
- `PermissionViewer` (profile) and capability gating untouched; raw
  codenames remain available as secondary info, never the primary UI.

## 10. Language switcher

New `LanguageDropdown` (Radix-free, custom for RTL control): current
language native name visible, FA/EN/AR menu with native + English names,
checkmark on active, Escape/outside-click close, focus return, arrow-key
navigation, logical `end-0` positioning, `aria-haspopup/listbox/option`
semantics. Replaces `LanguageToggle` in the staff sidebar, staff topbar
(desktop) and public navbar. Unit tests: open/menu/active/close-select.

## 11. UI redesign

Worked within the existing Hanahoush tokens (brand `#932990`, ink
`#272161`, near-white) — no new design system. Shared polish: media cards
with real fallbacks (never blank rectangles), gallery hover controls,
preview dialogs, dashboard recents, content-health panels, sticky studio
sidebar, consistent badges/skeletons/empty/error states across workspaces.

## 12. Responsive work

- Root-caused an 80px overflow on `/dashboard/articles` at 390px
  (wrapping `TabsList` + fixed-width selects) → wrapping tabs + responsive
  select widths; same fix applied to users/media/contact/newsletter
  filters.
- Mobile drawer verified at 375/390/430px (width-capped, navigates +
  closes); responsive + RTL + smoke suites green.

## 13. RTL work

All dashboard surfaces use logical properties (`ps-/ms-/start-/end-`,
`rtl:rotate-180` on directional icons). Studio inputs use `dir="auto"`,
URLs/slugs `dir="ltr"`. Gallery/preview/dialogs verified in FA/AR/EN via
the RTL Playwright suite (updated for the dropdown widget). No
language-specific hacks.

## 14. Accessibility

- Full axe sweep green after one genuine fix: auth inline links
  (`/register`, `/login`, `/forgot-password`, shell footer) were
  color-only → now underlined with offset.
- Drawer focus-trap, listbox semantics on the language menu, labelled
  dialogs/tables/forms, `aria-live` save states, preserved living cursor
  (untouched).

## 15. Performance

No new bundles beyond route-level code-splitting that already existed:
`ProjectEditPage` (20.8 kB) and `ProjectPreviewPage` (lazy) ride the same
`manualChunks` setup; gallery/media queries are paginated; filters/search
debounced (350ms); dashboard payload cached 60s server-side; images keep
native lazy loading.

## 16. Full bug audit

Fixed, not just documented: P0 image bug, project payload field drops
(category/technologies/cover/meta), missing gallery API (404 on any
gallery write), missing project preview route, topbar pathname leak,
mobile overflow, dashboard crash on stale payloads, duplicate register
link, auth link contrast, stale RTL specs. Public/auth/staff sweeps ran
via the full Playwright matrix (146/146).

## 17. Security/RBAC

Backend authoritative throughout: gallery actions inherit
`IsStaffOrReadOnly` + draft protection from `PublishableViewSet`;
`IsSuperAdmin` on user management untouched; frontend gates are UX-only
(route guards + capability filtering mirror the backend catalog). No
passwords/tokens/hashes exposed in UI or reports; destructive actions keep
confirmation dialogs.

## 18. Database status

Intact, no resets, no migration edits: `makemigrations --check` → "No
changes detected". Counts after verification: 38 articles, 5 projects, 0
gallery rows (seed data has none), 28 media files (incl. e2e uploads),
9 users. Gallery endpoints are pure CRUD on the existing `ProjectImage`
table.

## 19. Backend tests

`python manage.py test` → **242 passed** (includes 4 new absolute-URL
tests + 2 new gallery API tests). `manage.py check` clean.

## 20. Frontend tests

`vitest run` → **255 passed (46 files)** (includes resolver tests,
language-dropdown tests, project-preview test, mapper/dashboard updates).
`typecheck` + `eslint` clean; `vite build` + `build-storybook` pass.

## 21. Browser tests

Playwright + Edge/Chromium against the live stack: **146/146 passed** —
roles 9/9 (all six roles + guest + session-expiry), workspace 8/8 +
user-admin 2/2, responsive (overflow matrix + drawers), RTL FA/EN/AR,
smoke, accessibility (axe 9 pages, 0 critical/serious), errors, theme,
SEO, performance. Notable debugging: failures mid-phase traced to a stale
`--noreload` backend + a dead Vite server during a git stash round-trip,
not code regressions; fixed by restarting both servers, which also caught
the dashboard stale-payload crash (now guarded).

## 22. Remaining issues

None blocking. Minor: `import_export` admin template warnings in Django
output (pre-existing, unrelated); Playwright HTML/line reporter output is
noisy on Windows shells (encoding), JSON reporter recommended.

## 23. Deferred items

- SEO track (explicitly out of scope — next phase).
- Project gallery drag-and-drop: safe up/down ordering shipped instead;
  DnD would need a sortable library for marginal gain.
- Project category/technology *creation* from Studio (reads existing
  taxonomies; creation stays in Django admin).
- Media `file` replacement in place (immutable by design; re-upload flow).

## 24. Phase 15 recommendation

**Phase 15: SEO & Search Visibility** (per `NEXT_PHASE.md`/`next-phase.md`
pointers): build on the Phase 13 meta fields + Phase 14 absolute image
URLs (OG/Twitter cards now resolve correctly) — technical SEO, metadata
architecture, JSON-LD, multilingual slugs, image SEO, redirects/404,
Core Web Vitals, Search Console readiness.
