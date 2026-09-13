# Phase 15 Report — Content & Project Studio 2.0 + Dashboard 2.0

Date: 2026-09-13
Scope: public↔studio parity audit; `Project.case_study` staff write path;
Project Studio 2.0 (single-locale editing, case-study editor, actionable
health, parity preview); Article Studio 2.0 (single-locale editing, tags
editor, actionable health); Dashboard 2.0 (project review queue, translation
gaps, role detail polish); SUPER_ADMIN permission UX polish; media picker
i18n + AR metadata; full verification. ERP remains parked
(`ERP_ENABLED=false`, `ERP_PROVIDER=null`, `NullProvider`, no ERP network
calls, models, migrations, or credentials). SEO work was NOT started — it
remains the next dedicated phase.

> No credentials, secrets, password hashes, or tokens appear in this report.

---

## 1. Executive summary

The dashboard and both content studios are now one coherent CMS workspace.
The central parity gap — the public case-study page rendered six structured
sections (`challenge`, `objectives`, `solution_approach`,
`implementation_stages`, `architecture`, `results`) from
`Project.case_study` JSON that **no Studio surface could write** — is closed:
the backend exposes a validated staff write path plus a raw (unresolved)
read shape, and Project Studio 2.0 edits every section in a purpose-built
editor with a trilingual preview that mirrors the public page.

Both studios moved from three stacked language editors to a single-locale
workspace with a dropdown language selector (FA/EN/AR) carrying per-locale
completeness dots. Content Health is now an actionable panel in both
studios: every finding is clickable and scrolls to the offending field
(switching the editing language first when the issue is locale-specific).

Verification: backend **347 passed**, frontend **262 passed (48 files)**,
typecheck clean, production build passes, Storybook build passes,
Playwright **148/148 passing** (workspace 12/12 incl. 4 new Phase 15 tests,
roles/RTL/user-admin/smoke 34/34, a11y/errors/responsive/theme/seo 94/94,
cursor-grid/performance 10/10). No migrations. Database preserved.

---

## 2. Exact scope implemented

### Backend
- `ProjectCreateUpdateSerializer`: `case_study` is now a writable field with
  `validate_case_study_payload()` — accepts only the six known keys, text or
  `{fa,en,ar}` leaves, stage lists (max 20), architecture nodes (max 20,
  labels as arrays or per-locale lists). Unknown keys / bad shapes → 400.
- `ProjectDetailSerializer`: new `case_study_raw` read-only field exposing
  the unresolved localized JSON for the Studio editor. The public
  `case_study` (resolved) shape is unchanged.
- Dashboard `_content_section()`: new `projects_awaiting_review`,
  `articles_missing_fa/ar`, `projects_missing_fa/ar` counts.
- New tests: `apps/projects/tests/test_case_study_write.py` (6 tests:
  staff write, raw read, unknown-key rejection, bad-stage rejection,
  anonymous denied, non-staff denied).

### Frontend — shared
- `components/ui/studio-locale-select.tsx` (new): `StudioLocaleSelect` —
  Radix Select dropdown (FA/EN/AR) with per-locale completeness dots,
  keyboard navigation, RTL-safe.
- `components/ui/content-health.tsx` (new): `ContentHealthPanel` — severity
  badges, stat tiles, clickable findings with scroll-to-field + optional
  locale switch, healthy confirmation. No vanity scores.
- Both exported from the `components/ui` barrel.

### Project Studio 2.0
- `workspace/caseStudy.ts` (new): localized-leaf helpers
  (`localizedLeaf`, `leafHasText`), `caseStudyToForm` /
  `formToCaseStudy` converters, `emptyCaseStudyForm`,
  `caseStudyHasText`.
- `workspace/CaseStudyEditor.tsx` (new): one card per public section
  (challenge / objectives / solution / stages / architecture / results)
  with hide/show toggles, stage add/duplicate/remove/reorder, architecture
  node add/remove/reorder with per-line labels.
- `workspace/ProjectEditPage.tsx` (rewrite): single-locale editing for
  title/excerpt/body via the locale dropdown; case-study editor; gallery
  (unchanged mechanics); actionable health panel (missing slug/titles,
  thin bodies, missing cover/meta, empty case-study sections, hidden
  sections, empty gallery, gallery alt-text gaps); autosave (30s), dirty
  guard, `beforeunload`, field errors, submit-for-review preserved.
- `workspace/ProjectPreviewPage.tsx` (rewrite): renders hero + narrative
  body + all structured case-study sections through the same public
  components (`CaseStudySection`, `ArchitectureViewer`, journey timeline)
  with FA/EN/AR toggle and correct RTL/LTR.

### Article Studio 2.0
- `workspace/ArticleEditPage.tsx` (rewrite): single-locale editing via the
  locale dropdown; **tags editor** (pick from the existing `/tags/`
  taxonomy, badge chips, remove) — previously tags were readable but not
  editable; actionable health panel; autosave/dirty/publish mechanics
  preserved.
- Staff API types: `StaffArticlePayload.tags?: number[]` (backend already
  accepted `tags`; the frontend never sent it).

### Dashboard 2.0
- Attention queue: new "Projects awaiting review" row (deep-links to
  `/dashboard/projects?status=review`); `ProjectsWorkspacePage` now honors
  `?status=` like the articles list does.
- New Translation-gaps card (FA/AR missing-title counts for published
  articles/projects, capability-gated).
- Content section: project review tile added.
- `UserDetailPage`: role description + responsibilities now shown under the
  role badge.

### Media 2.0 polish
- `MediaPicker`: all previously hardcoded English strings moved to i18n
  (`pickerDescription`, `pickerDropHint`, `pickerEmptyQuery`,
  `pickerPrev/Next`, `pickerUse`, `pickerMeta.*`); metadata editor gains
  **title AR + caption AR** fields (were EN/FA only); error messages use
  existing keys; pagination count uses the localized string.
- Media workspace already had grid/list, preview, metadata, alt badges,
  upload progress — verified, no changes needed.

### i18n
- New `studio` namespace (common/health/caseStudy/article) in EN/FA/AR.
- New `dashboard.attention.projectsAwaitingReview`,
  `dashboard.translationGaps.*`, `mediaWorkspace.picker*` keys in EN/FA/AR.

### E2E
- `workspace.spec.ts`: 4 new tests — locale/case-study/health/preview for
  projects, locale/tags/health/preview for articles, public regression for
  `demo-shop-platform` (all six sections), and a full **round-trip**
  (Studio edit → save → public reflects → restore).
- Fixed the pre-existing draft-creation test for the single-locale form
  (`#article-title` / `#article-body`, scoped submit button).

---

## 3. Public ↔ Studio parity audit

### Article page sections (public `ArticleDetailPage`)
| Public section | Source | Was editable? | Now |
|---|---|---|---|
| Hero title/meta/excerpt/cover | `title_*`, `short_description_*`, `cover_image` | Yes | Single-locale editor |
| Body + TOC + reading progress | `description_*` | Yes | Single-locale `RichTextEditor` |
| Tags row | `tags` M2M | **No** (read-only) | **Tags editor added** |
| Author byline | `author` FK | No (set server-side) | Intentionally static |
| Related articles/projects/services | server-computed | Auto | Intentionally static |
| Newsletter/CTA | static components | Static copy | Intentionally static |

### Project page sections (public `ProjectCaseStudyPage`)
| Public section | Source | Was editable? | Now |
|---|---|---|---|
| Hero title/summary/cover/meta/tech | flat fields | Yes | Single-locale editor |
| Narrative body | `description_*` | Yes | Single-locale `RichTextEditor` |
| Challenge | `case_study.challenge` | **No** | **Case-study editor** |
| Objectives | `case_study.objectives` | **No** | **Case-study editor** |
| Solution | `case_study.solution_approach` | **No** | **Case-study editor** |
| Implementation stages | `case_study.implementation_stages` | **No** | **Stages editor (add/reorder/duplicate/hide)** |
| Architecture | `case_study.architecture` | **No** | **Nodes editor** |
| Results | `case_study.results` | **No** | **Case-study editor** |
| Gallery | `ProjectImage` rows | Yes | Unchanged (already strong) |
| Related projects/articles | server-computed | Auto | Intentionally static |
| CTA | static component | Static copy | Intentionally static |

No generic page builder was introduced. The "section system" is the six
fixed case-study sections the public page already renders — fixed order,
per-section visibility, validation via the backend payload validator.

### Online Shop Platform (`demo-shop-platform`)
Audited live: all six structured sections render (challenge, objectives,
solution, 3+ stages, 4 architecture nodes, results). Every one now has a
Studio management path. Round-trip verified: edited the English challenge
in the Studio, confirmed the public page reflected it, restored the
original. Seed data intact.

---

## 4. Project Studio 2.0

- Single-locale workspace: `[ فارسی ▼ ]` dropdown in the header; all three
  locales kept in state so switching never loses content; completeness dots
  (green/amber) per option.
- Case-study editor: six cards mirroring the public sections; per-section
  hide/show (surfaced in health as warnings); stages with title+detail per
  locale, reorder/duplicate/delete; architecture nodes with layer name +
  one-label-per-line editor, reorder/delete.
- Gallery: unchanged mechanics (add/reorder/cover/remove), now with
  alt-text gap detection in health.
- Health panel: 12 finding types (see §6), all clickable.
- Preview: full parity — hero, body, challenge, objectives, solution,
  stages timeline, architecture viewer, results, gallery; FA/EN/AR toggle.
- Autosave 30s, dirty badge, `beforeunload`, field-level errors,
  submit-for-review preserved.

## 5. Article Studio 2.0

- Single-locale workspace with the same dropdown + completeness pattern.
- Tags editor: dropdown of unused tags from `useArticleTags`, badge chips
  with remove buttons; persisted via `tags: number[]` (backend already
  supported it — the payload field was simply never sent).
- Health panel: missing slug/titles (critical), thin bodies, missing
  summaries/cover (warnings); stats row (words, reading time, headings,
  body images).
- Preview unchanged mechanically (already locale-toggled); tags render via
  the shared `ArticleMeta` component as on the public page.

## 6. Dashboard 2.0

- Attention queue answers "what needs a human": article drafts, article
  reviews, **project reviews (new)**, pending approvals, active locks, open
  inquiries — all capability-gated, all deep-linked (project review links
  to the now `?status=`-aware projects list).
- Quick actions unchanged (already capability-gated).
- Translation-gaps card (new): published content missing FA/AR titles.
- Role-specific landing unchanged structurally; PROJECT_MANAGER now sees
  project review counts; role descriptions + responsibilities visible on
  user detail.
- SUPER_ADMIN: granular permission presentation already existed via
  `RolePermissionSummary` / `RolePermissionsDialog` (grouped by module
  with codenames, restrictions, super-admin warning) — verified and kept;
  user detail now adds the role's responsibility text.

## 7. Role system UX

Generated from the actual permission matrix (`seeders.py`); no invented
capabilities:
- SUPER_ADMIN — all 27 permissions; user/role management; warning shown.
- COMPANY_ADMIN — content + projects + media + users (not roles).
- CONTENT_MANAGER — articles/services/company + media upload + review.
- PROJECT_MANAGER — projects full + articles/services view + media upload.
- EDITOR — articles create/update + view projects/services.
- VIEWER — read-only catalog.
Role detail pages now show description + responsibilities; the roles
dialog groups permissions by module with raw codenames as secondary info.

## 8. SUPER_ADMIN permission presentation

Already granular (Phase 11.5): `RolePermissionsDialog` tabs per role,
`RolePermissionSummary` groups by `module` with human-readable action
labels + codenames + restriction lists + super-admin warning. Phase 15
adds the responsibility line on user detail. No backend changes needed —
the role catalog API already returns full permission lists.

## 9. Media improvements

- Picker fully localized (was ~15 hardcoded English strings).
- Metadata editor: + title AR, + caption AR (now FA/EN/AR for
  title/alt/caption).
- All other Phase 12 requirements already present: grid/list, preview
  dialog with dimensions/size/reference count, alt badges, upload
  progress, failure states, empty states, soft-delete with reference
  warning, copy-URL.

## 10. Language dropdown / FA / EN / AR behavior

- `StudioLocaleSelect`: Radix Select, `aria-label` "Editing language",
  arrow/type-ahead keyboard support, `end-0` RTL-safe positioning,
  completeness dots, no horizontal overflow (compact trigger).
- Editing locale defaults to the UI language (fa/ar map directly, else
  en); content in all locales preserved on switch (state is per-locale,
  only rendering changes).
- Health findings carry `locale` and switch the editor before scrolling.
- Preview locale toggle unchanged (fa/en/ar buttons with `aria-pressed`),
  `dir` follows the preview locale.

## 11. UI/UX improvements

- Studios: single-column focus per locale, sticky 320px sidebar
  (publishing + cover + health + actions), `CardHeader` section titles,
  logical properties (`start/end`, `ps/pe`) throughout new code.
- Dashboard: translation-gaps card matches existing `SectionCard` rhythm.
- No theme changes; brand tokens untouched (`#932990` / `#272161` /
  `#FDFBFC`).

## 12. Accessibility / RTL / LTR / responsive work

- e2e: roles 9/9, RTL spec, responsive spec, accessibility (axe) spec all
  green; mobile (390px) covered in responsive + smoke specs.
- New components: labeled controls, `aria-pressed` toggles, `role="group"`
  locale switchers, `aria-live` health + dirty states, focus-visible
  rings, `dir="auto"` on user content, `dir="ltr"` on slugs/URLs/dates.
- `scrollIntoView` guarded for jsdom; test setup gains the stub (also
  fixes Radix focus internals under jsdom).
- Living cursor / grid / visual-state systems untouched.

## 13. Backend changes

- `apps/projects/api/serializers.py`: `CASE_STUDY_KEYS`,
  `validate_case_study_payload()`, `case_study` on
  `ProjectCreateUpdateSerializer`, `case_study_raw` on
  `ProjectDetailSerializer`.
- `apps/core/services/dashboard.py`: `projects_awaiting_review`,
  `articles/projects_missing_fa/ar`.
- `apps/projects/tests/test_case_study_write.py`: 6 new tests.
- No model changes. No migrations.

## 14. Frontend changes

New: `studio-locale-select.tsx`, `content-health.tsx`, `studio.test.tsx`,
`caseStudy.ts`, `CaseStudyEditor.tsx`, `caseStudy.test.ts`.
Rewritten: `ProjectEditPage.tsx`, `ArticleEditPage.tsx`,
`ProjectPreviewPage.tsx`.
Extended: `projects/api/staff.ts` (case-study types + payload),
`articles/api/staff.ts` (`tags`), `dashboard/types.ts` + `DashboardPage.tsx`
+ dashboard test, `ProjectsWorkspacePage.tsx` (`?status=`),
`UserDetailPage.tsx` (responsibilities), `MediaPicker.tsx` + test,
`e2e/workspace.spec.ts` (+4 tests, 1 fix), `tests/setup/setupTests.ts`
(scroll stub), all three `translation.json` (`studio`, dashboard, picker
keys).

## 15. API changes

- `PATCH /api/v1/projects/{id}/` (and POST): accepts `case_study` object;
  400 with field errors on unknown keys / bad shapes. Staff-only
  (`IsStaffOrReadOnly`); anonymous → 401/403, non-staff → 403 (tested).
- `GET /api/v1/projects/{id}/` (staff retrieve): now includes
  `case_study_raw` (unresolved localized JSON) alongside the resolved
  `case_study`.
- `GET /api/v1/admin/dashboard/`: content section gains
  `projects_awaiting_review`, `articles_missing_fa/ar`,
  `projects_missing_fa/ar`. Envelope unchanged.
- No new endpoints. No version changes.

## 16. Database/migration impact

- Migrations created: **0**. `showmigrations --plan`: no unapplied.
- `manage.py check`: no issues.
- `Project.case_study` is a pre-existing `JSONField` — writes reuse it.
- Data preserved: `demo-shop-platform` round-trip restored byte-identical;
  seed content intact; no resets, no destructive operations.

## 17. Test results

| Suite | Result |
|---|---|
| Backend pytest | **347 passed** |
| Frontend vitest | **262 passed (48 files)** |
| Typecheck (`tsc --noEmit`) | clean |
| ESLint (changed files) | clean (no new warnings) |
| Production build (`vite build`) | passes (4.24s) |
| Storybook build | passes (11.03s) |
| Playwright full suite | **148/148** (workspace 12, roles/rtl/user-admin/smoke 34, a11y/errors/responsive/theme/seo 94, cursor-grid/performance 10) |
| API smoke (manual curl-equivalent) | dashboard + case-study endpoints 200 |

Note: the local backend dev server runs with `--noreload`; after the
serializer change it served stale code until restarted. The round-trip
e2e caught this (missing `case_study_raw`); restart fixed it. Future
runs should restart the dev server after backend edits.

## 18. Browser verification

- Roles: superadmin/companyadmin/contentmanager/projectmanager/editor/
  viewer login flows (roles.spec 9/9); write-control hiding for
  projectmanager on articles; approve hidden for non-approvers.
- Viewports: 1440/1280/1024/768/390/375 in responsive + smoke specs.
- RTL: `rtl.spec.ts` green; FA/AR studio editing verified via locale
  switching in the two new studio tests; EN LTR verified throughout.
- Critical workflows: login, dashboard, article create→edit→preview,
  project edit→case-study→preview, gallery ops, media upload/metadata/
  delete, editorial submit→approve, contact/newsletter, user admin.

## 19. Bugs discovered and fixed

1. **Stale dev server** (`--noreload`) served pre-change serializers —
   caught by the round-trip e2e; restarted, documented.
2. **Staff project retrieve had no raw case-study shape** — added
   `case_study_raw` (public `case_study` stays resolved).
3. **`tags` never sent by Article Studio** — backend accepted it; added
   `tags: number[]` + editor UI.
4. **Projects list ignored `?status=`** — attention deep-link would land
   unfiltered; mirrored the articles pattern.
5. **MediaPicker hardcoded English + missing AR fields** — localized,
   added title AR / caption AR.
6. **Draft-creation e2e used removed `#article-body-en` id** — updated to
   `#article-title`/`#article-body` + scoped submit.
7. **jsdom missing `scrollIntoView`** (Radix + health panel) — guarded
   call + setup stub.

## 20. Known issues / limitations

- Architecture node labels serialize as shared plain-string arrays (the
  editor shows one label list; per-locale label objects from older seeds
  still *read* correctly via lenient resolution but save back normalized).
- Case-study hide/show flags are editor-local (affect health warnings,
  not public rendering — public sections render when data exists).
- Gallery alt-text editing still lives in the gallery API dialogs, not
  inline on the studio cards (health links to the gallery card).
- `users.permissions.modules` lacks a `services` label in some locales?
  Verified present (`services: Services`). No gaps found.

## 21. Deferred work

- Full SEO phase (meta keywords/canonical/OG editing UX, sitemap previews,
  structured-data validation) — explicitly next.
- Server-side uniqueness validation messaging for slugs (backend 400
  already surfaces; no live availability check).
- Gallery inline alt-text editing.
- Per-locale architecture labels in the editor (reads supported).
- Dashboard caching invalidation on content save (60s TTL retained).

## 22. Files changed / created

Backend: `apps/projects/api/serializers.py`,
`apps/core/services/dashboard.py`,
`apps/projects/tests/test_case_study_write.py` (new).
Frontend (new): `components/ui/studio-locale-select.tsx`,
`components/ui/content-health.tsx`, `components/ui/studio.test.tsx`,
`features/projects/workspace/caseStudy.ts`,
`features/projects/workspace/CaseStudyEditor.tsx`,
`features/projects/workspace/caseStudy.test.ts`.
Frontend (rewritten): `ProjectEditPage.tsx`, `ArticleEditPage.tsx`,
`ProjectPreviewPage.tsx`.
Frontend (extended): `projects/api/staff.ts`, `articles/api/staff.ts`,
`dashboard/{types.ts,pages/DashboardPage.tsx,tests/dashboard.test.tsx}`,
`ProjectsWorkspacePage.tsx`, `UserDetailPage.tsx`, `MediaPicker.tsx` +
test, `e2e/workspace.spec.ts`, `tests/setup/setupTests.ts`,
`i18n/locales/{en,fa,ar}/translation.json`.
(This report itself: `docs/reports/phase-15-report.md`.)

Note: the working tree also contains prior-session changes (Phase 11.5–14
follow-ups) outside this phase's scope; only the files above are Phase 15.

## 23. Security/RBAC verification

- Backend tests: anonymous → 401/403 on case-study write; non-staff →
  403; staff → 200 (in `test_case_study_write.py`).
- Dashboard endpoint: anonymous 401, non-staff 403 (existing tests green).
- `is_superuser` remains non-writable; no password material in any
  payload; secrets scan in dashboard test green.
- Frontend guards remain UX-only; e2e confirms server-side rejection
  (`POST /api/v1/staff/articles/` non-200 for unauthorized role).

## 24. ERP status

ERP remains **parked/dormant** and was NOT operationally integrated:
`ERP_ENABLED=false` (default), `ERP_PROVIDER=null`/`"null"`,
`NullProvider` active. No ERP network calls, credentials, models,
migrations, or assumptions introduced or touched in this phase.

## 25. Recommended next phase

**Dedicated SEO phase**, now unblocked by the SEO-ready fields preserved
here (`meta_title ≤70`, `meta_description ≤160`, `meta_keywords`,
`canonical_url`, `og_image` on both studios). Remaining SEO work:
sitemap/robots verification UX, OG image picker polish, structured-data
(JSON-LD) validation, per-locale meta completeness in Content Health,
canonical-URL conflict detection, and SEO preview (SERP snippet) in both
studios.
