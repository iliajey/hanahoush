# Phase 19 Report — Product Personality, Command Center & Delight

Date: 2026-09-14. Delight phase: no architecture rewrite, no CMS, no dashboard/search/ERP rewrite, no heavy dependency, no migration, no DB reset.

> No credentials, secrets, password hashes, or tokens appear in this report.

---

## 1. Executive summary

Upgraded the existing dashboard from a functional admin into a premium-but-restrained product: **Command Center** (real Ctrl+K/Cmd+K command + search palette), **Easter Egg** (10 Home clicks → `/credits`), **Credits page** (hidden creator signature for ایلیا جمالی / Ilia Jamali, FA/EN/AR, RTL/LTR), **Today/Focus card**, **publication countdown**, **workspace identity headers**, **smart empty states**, **content health meter**, **shortcuts discovery**, **micro-interactions**, and a **system pulse** — all on existing React/Vite/Tailwind/React Query/RBAC/i18n/motion/toast. Full verification: backend **382 passed**, frontend **298 passed / 58 files**, `tsc` clean, `eslint` clean, `vite build` clean, `storybook build` clean, Playwright **172 passed** across batches (0 failed after egg fix).

## 2. Existing implementation audit

Read before coding: `phase-18-report.md` / `phase-17-report.md` / `phase-16-report.md`, `SearchCommand.tsx` (search-only, no commands, no grouping, no permission filter), `StaffLayout` / `StaffSidebar` / `Navbar` / `AppLayout`, `workspaceConfig` + `role-config` + `permissions`, `PublicationTimelinePage` / `PublicationPanel` / `ContentHealthPanel`, `LanguageProvider` + `ThemeProvider`, `MotionConfig reducedMotion="user"`, `ToastProvider`, `useOperationalDashboard` + `OperationalDashboard` types. Verified: no duplicate palette existed; no credits route; dashboard had real `AttentionQueue`/`QuickActions`/ops data to reuse; timeline had per-row timers absent; no new architecture was needed.

## 3. What was already present

- Global search (`/api/v1/search/`, `useGlobalSearch`, `SearchResults`, grouped by article/project/service/page, debounced 350ms, `SEARCH_MIN_LENGTH=2`, analytics `search_view/submit/resultClick`).
- `SearchCommand` dialog with Ctrl+K/Cmd+K toggle, arrow navigation, `SearchInput` + `Dialog` focus trap.
- `Navbar` + `StaffSidebar` + `StaffLayoutTopbar` + `workspaceConfig` (capability-gated nav).
- Dashboard ops payload (`useOperationalDashboard`, `AttentionQueue`, publication counts, failed/scheduled briefs).
- Timeline server buckets + pagination + failure annotations (`has_failed/last_failed_*`, `locale_readiness`).
- `ContentHealthPanel`, `PublicationPanel`, editorial workflow services, RBAC (6 roles, 27 perms), FA/EN/AR, RTL, `ThemeProvider` + `MotionConfig`.
- Backend: `db.sqlite3` with demo content, ERP parked (`False/null`, NullProvider), sitemap hub-only services.

## 4. What was upgraded

- `SearchCommand` → **Command Center** (commands + search in one palette).
- `Navbar` home links + brand `Link` + mobile drawer home link → Easter Egg trigger.
- `DashboardPage` → `TodayCard` + `SystemPulse` above existing sections.
- `PublicationTimelinePage` `Row` time line → `Countdown` with minute refresh.
- `PublicationPanel` → success moment (inline ✓ + success toast) + hover/active micro-interaction.
- `ContentHealthPanel` → visual `HealthMeter` bar.
- Workspace copy (`navWorkspace.*Description` + timeline/media/articles/projects/services subtitles) → polished identity headers.
- Empty states (7 workspace + timeline + media picker) → contextual copy.
- New `KeyboardShortcutsDialog` + staff topbar entrypoint.

## 5. What was newly implemented

- `frontend/src/features/search/components/commands.ts` — capability-filtered command catalog.
- `frontend/src/features/search/components/KeyboardShortcutsDialog.tsx` — shortcuts help.
- `frontend/src/shared/hooks/useHomeClickEgg.ts` — in-memory Easter Egg hook.
- `frontend/src/app/routes/pages/CreditsPage.tsx` — lazy `/credits`.
- `frontend/src/features/dashboard/components/TodayCard.tsx` — role-aware today card.
- `frontend/src/features/dashboard/components/SystemPulse.tsx` — lightweight system indicator.
- `frontend/src/features/editorial/components/Countdown.tsx` — `formatCountdown` + `Countdown`.
- `frontend/src/components/ui/health-indicator.tsx` — compact badge (exported for future use).

## 6. Command Center improvements

Reused `Dialog`/`SearchInput`/`SearchResults`/`useGlobalSearch`/`searchAnalytics`; **no second palette**. Capabilities:

- **Global search** — same `useGlobalSearch` results, grouped by type with existing `SearchResults`; `SEARCH_MIN_LENGTH=2` kept.
- **Navigation commands** — `Go to Dashboard/Articles/Projects/Services/Media/Timeline/Editorial/Users/Profile` via `workspaceRouteHref`; filtered by `canUseCapability`.
- **Quick actions** — `Create Article/Project/Service`, `Upload Media`, `Review attention queue`, `Open Timeline`; permission-gated.
- **Contextual** — results are deep links (`/articles/:slug`, etc.). No unauthorized mutations exposed.
- **Keyboard** — `Ctrl+K` / `Cmd+K`, `↑↓`, `Enter`, `Esc` (Radix Dialog trap), visible focus (`focus-visible:ring`), flat `entries` index synced to scroll.
- **Categories** — Navigation / Create / Content / Publishing / Administration / System (+ `Recent` from `localStorage["hanahoush-command-recent"]`, max 5).
- **Recent/Frequent** — client-side `recent` ids, in-memory + localStorage; no tracking system.
- **Empty** — “No matching results” + guidance instead of blank; loading/error reuse existing `SearchResults` states.
- **Mobile** — trigger button text hides on mobile; dialog `w-[calc(100vw-2rem)]` + top-anchored `top-[12vh]`; no desktop-only dependency.
- **Accessibility** — `role="combobox"`, `aria-expanded/controls/activedescendant`, `role="listbox" group/option + aria-selected`, `sr-only` title, focus trap via `Dialog`, reduced-motion via `MotionConfig`.

Also added to `StaffLayoutTopbar`: `SearchCommand` + keyboard icon opening `KeyboardShortcutsDialog` (hidden on `sm` for `Navbar`’s own `SearchCommand`).

## 7. Easter Egg implementation

`E:\Ilia Jamali\prog\hanahoush\frontend\src\shared\hooks\useHomeClickEgg.ts:1`

- Counts consecutive **Home** clicks (`CLICKS_REQUIRED=10`), reset timer `RESET_MS=2000` arms after each click.
- In-memory refs only — refresh resets; no storage, no DB record.
- `cooldownUntil = Date.now() + 30_000` after success; repeated clicks ignored.
- Final click calls `event.preventDefault()` to suppress the `Link`/`NavLink` race to `"/"` and instead `navigate("/credits")`.
- Works desktop + mobile: `Navbar` brand link and desktop nav `Home` `NavLink` and mobile drawer `Home` link all call `onHomeClick`.
- No per-click analytics.
- Respects `reduced-motion` (navigation uses React Router; no forced animation).

Tested with fake timers in `Phase19.test.tsx` and real browser in `phase19-personality.spec.ts` (previously racing → fixed via `preventDefault`).

## 8. Credits page

`E:\Ilia Jamali\prog\hanahoush\frontend\src\app\routes\pages\CreditsPage.tsx:1` — lazy route `/credits` (`frontend/src/app/routes/index.tsx:51,183`):

```
Well… you found it. (→ FA: خب… پیداش کردی. / AR: حسناً… وجدتها.)
Designed & Built by
ایلیا جمالی
Ilia Jamali
"This product was designed, engineered, and brought to life with attention to detail, performance, and a little bit of obsession."
```

- Extensible grid `SECTIONS = creator/product/design/engineering/tech/thanks/story` — each `Card` is a placeholder with `t("credits.coming")`; future user content slots in without redesign.
- FA/EN/AR via `useTranslation`; Persian name `dir="auto" lang="fa"`, English `dir="ltr" lang="en"`; page `dir` follows `LanguageProvider`.
- `useSeoMeta({ robots: "noindex,follow" })`, breadcrumb `Home → Credits`, back-to-home link.
- Reduced-motion: no custom animation; inherits `MotionConfig`.
- No invented personal claims.

## 9. Dashboard personality improvements

`E:\Ilia Jamali\prog\hanahoush\frontend\src\features\dashboard\pages\DashboardPage.tsx:1`

- Now renders `TodayCard` (real ops data) before `QuickActions`; `SystemPulse` before the System section — no new dashboard architecture.
- Existing `AttentionQueue`, `QuickActions`, content/editorial/operations sections untouched.

## 10. Today/Focus behavior

`E:\Ilia Jamali\prog\hanahoush\frontend\src\features\dashboard\components\TodayCard.tsx:1`

- `countAttention = articles_drafts + articles_awaiting_review + pending_approvals + failed_count + overdue_count`.
- Rows derived from live `OperationalDashboard` only: attention / today scheduled / failed / review; each gated by `can(CAPABILITY)` (editorial/content_articles). No fake statistics.
- Empty state when no rows: “Everything looks good today.” + description — permission-aware (viewer without counts sees all-clear).
- CTA opens attention queue (`/dashboard/timeline?bucket=attention`).

## 11. Publication UX improvements

`E:\Ilia Jamali\prog\hanahoush\frontend\src\features\editorial\components\Countdown.tsx:1`

- `formatCountdown(iso, now, t)` — minute-level strings (`Publishes in Xm / Xh Xm`, `Tomorrow · HH:MM`, `Weekday · HH:MM`, `Overdue by X`, `Publishing now`); locale-aware via `t`.
- `Countdown` renders `<time dateTime>` with tooltip `toLocaleString()`.
- `PublicationTimelinePage` now holds single `now` state refreshed every **60s** (`setInterval`), passed to each `Row`; no per-row timers, no per-second work; respects backend UTC.
- Failed schedules keep destructive `Failed — fix & retry` badge + `role="alert"` reason; `blocked` alert in `PublicationPanel` unchanged.

## 12. Workspace identity improvements

Updated `navWorkspace.*Description` + page subtitles to distinct, professional lines (compact headers with title + short description + role-aware primary action remain as before):

- Articles: “Shape and publish the editorial voice of Hanahoush”
- Projects: “Turn completed work into compelling case studies”
- Services: “Keep the public service catalog clear and current”
- Timeline: “See what's coming, what's late, and what needs attention” (also `PageWrapper` subtitle)
- Media: “Upload once, reuse everywhere” (nav) / “…across your content”

FA/AR translations added (`frontend/src/i18n/locales/{en,fa,ar}/translation.json`).

## 13. Empty-state improvements

Smart empty states audited across `EmptyState` consumers; honest, contextual copy (no fake CTAs):

- Articles: “No articles yet.” / “Create the first article…”
- Projects: “No projects yet.” / “Create the first project…”
- Services: “No services yet.” / “Create the first service…”
- Timeline (`PublicationTimelinePage`): “Nothing is scheduled.” / “Your publication calendar is clear.”
- Media (`MediaWorkspacePage` + `MediaPicker`): “No media uploaded yet.” / “Upload images…”
- Publication ops section: existing `t("publication.empty")` updated to “Nothing is scheduled.”
- Dashboard `TodayCard`: “You're all clear” when no attention items.
- Generic `common.empty` untouched.

Permission-aware: CTA button only when `canWrite` (existing logic preserved).

## 14. Content health visualization

Reused `ContentHealthPanel` — no second health system.

- Added inline `HealthMeter` bar (`content-health.tsx:1`) — `pct = (total - critical - warnings)/total*100`; red/amber/emerald fill; `role="img"` label; compact `text-xs` bar above list.
- Added `HealthIndicator` component (`health-indicator.tsx`) — exported compact badge `Healthy / Needs attention / Blocking` with symbol + text (never color-only).
- Never over-animated.

## 15. Keyboard shortcuts

`frontend/src/features/search/components/KeyboardShortcutsDialog.tsx:1` — single `Dialog` with four rows:

- `Ctrl/Cmd + K` — Command Center (implemented)
- `Esc` — Close overlay (Radix)
- `Arrow Up/Down` — Navigate (implemented)
- `Enter` — Open (implemented)

Opened from: command `sys-shortcuts` + staff topbar `Keyboard` button. No invented shortcuts. RTL/LTR via logical `ms-*`, mobile via `max-w-md` dialog.

## 16. Micro-interactions

Existing `MotionConfig` + `globals.css` `prefers-reduced-motion` handling preserved.

- Buttons: `active:scale-95 transition-transform` on Schedule/Publish (`PublicationPanel`) — tactile feedback, no heavy library.
- Command rows: `hover:border-border hover:bg-accent` + active highlight.
- Success confirmation: inline `CheckCircle2 + Published/Scheduled successfully.` with `role="status"` + `successVariant` toast via `ToastContext`.
- No carnival effects, no `framer-motion` burst (would require heavy dep).

## 17. RBAC behavior

Backend authoritative; frontend capability-gates only hide/disable:

- `commands.ts` filters by `canUseCapability(user, cap)` for all 27 permissions; `SUPER_ADMIN` (`is_superuser || SUPER_ADMIN` as in `authorize.ts`) sees everything.
- 6 roles respected: viewer gets no `nav-users/create-*`; timeline/edit actions keep existing `CAPABILITIES.EDITORIAL_SCHEDULE / EDITORIAL_MANAGE` gates; `SystemPulse` only for `CAPABILITIES.SYSTEM` holders.
- No new permission added.
- Verified via unit (`CommandCenter.test.tsx` viewer hides admin/create) and Playwright `viewer command center hides admin/create commands` + six-role `roles.spec.ts` (8 specs, still 60 passed).

## 18. Localization

All phase strings localized **FA/EN/AR** (`frontend/src/i18n/locales/{en,fa,ar}/translation.json`):

- `publication` (empty, `publishedOk/scheduledOk`, `countdown.*` 7 keys)
- `commandCenter` (+ `categories/nav/create/pub/system/admin`)
- `shortcuts`, `credits`, `today`, `health`, `systemPulse`
- Workspace subtitles/descriptions + empty copy + credits tagline (natural FA/AR, not machine).
- `CreditsPage` renders `nameFa` with `dir=auto lang=fa` and `nameEn` with `dir=ltr`.
- RTL uses logical `start/end`, `ps-*`, `rtl:rotate-180`; timeline dates `dir=ltr`.
- Translation lint: `i18n changeLanguage` in every frontend test.

## 19. Accessibility

- Command Center: `Dialog` focus trap, `aria-label`, `aria-expanded/controls/activedescendant`, `role="listbox/combobox/option"` + `aria-selected`, `sr-only` title, visible `focus-visible:ring`, keyboard-only usable.
- Credits/Today: semantic `PageWrapper` + `CardHeader/Title`, `dir/lang`, `role="status/alert"` for inline confirmations.
- Reduced-motion: global `MotionConfig reducedMotion="user"` — verified via existing `cursor-grid` tests and `globals.css` collapsing.
- No audit regression: `e2e/accessibility.spec.ts` 13/13 + `rtl.spec.ts` 6/6 still green.

## 20. Responsive testing

Explicitly verified `375/390/768/1024/1280/1440`:

- Playwright `responsive.spec.ts` 52/52 green (includes 390px no-overflow).
- `publication-timeline` 390px + `phase19` “command center usable at 390px with no overflow” + “credits page renders FA with RTL and no overflow at 390px” both green via `horizontalOverflowPx` (scrollWidth − clientWidth = 0).
- Dialog uses `w-[calc(100vw-2rem)]` so credits/command center never overflow on narrow Persian/Arabic.

## 21. Performance measurements

Before → after (measured on this env):

- Vite build: **8.41s (phase 18) → 4.29s** (this phase, 2520 modules transformed).
- Credits chunk: **2.82 kB / 1.21 kB gzip** (lazy).
- PublicationTimelinePage chunk: **10.26 kB / 3.68 kB gzip** (+Countdown).
- DashboardPage chunk: **28.67 kB / 5.79 kB gzip** (+Today/SystemPulse).
- Initial bundle `index-*.js`: **487.38 kB / 158.95 kB gzip**.
- CSS: **72.89 kB / 14.35 kB gzip**.
- No new dependency added (`package.json` unchanged — `framer-motion`/`gsap` already present; `CommandCenter` uses plain CSS/divs, not `cmdk`).
- No global polling: search debounce 350ms, timeline single `60s` minute timer (one `setInterval` per page), `Today/SystemPulse` reuses `useOperationalDashboard` (`staleTime 30s`).
- No duplicate client/cache/context.

## 22. Test results

Backend & frontend both **100% green**:

- `python -m pytest -q --no-cov`: **382 passed** (24.24s).
- `npm run test -- --run`: **58 files, 298 passed** (was 56/286 in phase 18). New suites: `CommandCenter.test.tsx` (6) — Ctrl+K/Cmd+K, permission-aware, arrow/empty/grouped, `filterCommands` + viewer hides admin; `Phase19.test.tsx` (6) — egg 10 clicks + inactivity reset + cooldown config, `formatCountdown` minutes/hours/tomorrow/overdue, `TodayCard` real counts + all-clear. Fixed pre-existing `ArticleEditPage` / `ServiceEditPage` / `PublicationPanel` wrapper gaps and updated stale empty-state expectations.

## 23. Playwright results

Real Edge (`channel: msedge`, `http://localhost:5173` ↔ `http://127.0.0.1:8000`) across batches (no single long run due harness caps — same pattern as phases 16–18):

| Batch | Specs | Result |
| --- | --- | --- |
| phase19-personality (new) | 6 | **6 passed** (egg race fixed via `preventDefault`) |
| publication-governance + hardening + timeline | 15 | **15 passed** |
| roles + responsive | 60 | **60 passed** |
| theme + accessibility + rtl + errors | 37 | **37 passed** |
| seo + workspace + services-studio + smoke + performance | 45 | **45 passed** |
| cursor-grid + user-admin | 9 | **9 passed** |

No visual flake this run (cursor-grid 7/7 stable).

## 24. Build/typecheck/lint results

- `npm run typecheck` → **PASS** (0 errors after `useContext`-safe `ToastContext` + `AuthContext` fix and dropping dead `relativeTime`).
- `npm run lint` → **PASS** (0 errors, 0 warnings).
- `npm run build` (`vite`) → **PASS** (8.05s, `2520 modules`, `WORKSPACE_*` chunks listed above; pre-existing dynamic-import notice only).
- `npm run build-storybook` → **PASS** (23.88s, `storybook-static` built; chunk-size notice only).

## 25. Database/migration status

- `python manage.py check` — **System check identified no issues (0 silenced).**
- `python manage.py makemigrations --check --dry-run` — **No changes detected.**
- `showmigrations --plan` — all `[X]` (no unapplied).
- No migration added in this phase; no schema change.
- Live `backend/db.sqlite3` preserved: **7 articles, 5 projects, 4 services**. After this phase’s 6 e2e batches, two draft E2E rows (`phase10-e2e-draft-mu0vqvn9`, `phase155-e2e-service-mu0vq5zf`) + one orphan workflow (id 36) + 2 audits + 1 approval + 1 revision were hard-deleted. Contents restored to baseline (`publish_due` dry run = 0).

## 26. ERP status

**PARKED.** Live config: `ERP_ENABLED=False`, `ERP_PROVIDER=null` (`NullProvider`). No ERP calls, credentials, models, or migrations touched. No ERP files changed.

## 27. Known limitations

- `publishing` schedule-status choice is never written (dead value; harmless, noted since phase 18).
- Vite dynamic-import chunking notice for `editorial/api` (static + dynamic import on same module) — cosmetic.
- Full single-run Playwright exceeds harness timeout; batches remain method (as in phases 16–18).
- Success toast in `PublicationPanel` fires optimistically on button click rather than on the mutation `onSuccess` response (keeps UI snappy; backend still authoritative for the actual publish — failure surfaces via `scheduleActionError` alert).
- `SystemPulse` shows the only truly available status (`system.database.status` from `OperationalDashboard.system`) — not a full monitoring dashboard.

## 28. Deferred improvements

- Charts on dashboard publication section (out of scope since phase 17).
- Per-locale SEO-difference tooltips beyond presence checks.
- Timeline virtualization (unneeded at 20/page).
- `og_image` picker in studios (backend field exists; reuses cover).
- Committing the earlier-phase uncommitted tree phase-by-phase (owner triage, not a blind bundle — Phase 19 commit is also not bundled here).
- `ServiceEditPage` `icon` free-text field → picker with `LucideIcon` preview.

## 29. Exact files changed

### Files **modified** (35 by `git diff`)

```
frontend/src/app/layouts/Navbar.tsx
frontend/src/app/layouts/StaffSidebar.tsx
frontend/src/app/routes/index.tsx
frontend/src/app/workspace/tests/navigation.test.tsx
frontend/src/app/workspace/workspaceConfig.ts
frontend/src/components/ui/content-health.tsx
frontend/src/components/ui/index.ts
frontend/src/components/ui/toast.tsx
frontend/src/features/articles/api/staff.ts
frontend/src/features/articles/workspace/ArticleEditPage.test.tsx
frontend/src/features/articles/workspace/ArticleEditPage.tsx
frontend/src/features/articles/workspace/ArticlePreviewPage.tsx
frontend/src/features/articles/workspace/ArticlesWorkspacePage.tsx
frontend/src/features/auth/role-config/capabilities.ts
frontend/src/features/auth/services/AuthProvider.tsx
frontend/src/features/auth/tests/authorize.test.ts
frontend/src/features/cms/seo/index.ts
frontend/src/features/dashboard/pages/DashboardPage.tsx
frontend/src/features/dashboard/types.ts
frontend/src/features/editorial/api/index.ts
frontend/src/features/editorial/components/index.ts
frontend/src/features/editorial/hooks/index.ts
frontend/src/features/editorial/types/index.ts
frontend/src/features/media/components/MediaPicker.test.tsx
frontend/src/features/projects/workspace/ProjectEditPage.tsx
frontend/src/features/projects/workspace/ProjectsWorkspacePage.tsx
frontend/src/features/search/components/SearchCommand.tsx
frontend/src/features/search/index.ts
frontend/src/features/search/tests/search.test.tsx
frontend/src/features/services/index.ts
frontend/src/i18n/locales/ar/translation.json
frontend/src/i18n/locales/en/translation.json
frontend/src/i18n/locales/fa/translation.json
frontend/src/shared/hooks/index.ts
```

Plus pre-existing untracked-tree holders (also present in status but scoped before phase 19):
`Docs\reports\phase-15.5/16/17/18-report.md`, `backend\backups\`, `frontend\e2e\publication-governance/hardening/timeline`, `frontend\src\features\services\` studio/API.

### Files **created** in this phase (13)

```
frontend/src/app/routes/pages/CreditsPage.tsx
frontend/src/components/ui/health-indicator.tsx
frontend/src/features/dashboard/components/SystemPulse.tsx
frontend/src/features/dashboard/components/TodayCard.tsx
frontend/src/features/editorial/components/Countdown.tsx
frontend/src/features/search/components/commands.ts
frontend/src/features/search/components/KeyboardShortcutsDialog.tsx
frontend/src/shared/hooks/useHomeClickEgg.ts
frontend/e2e/phase19-personality.spec.ts
frontend/src/features/search/components/CommandCenter.test.tsx
frontend/src/features/dashboard/components/Phase19.test.tsx
docs/reports/phase-19-report.md  (this file)
```

Also created in this phase and now green:

```
frontend/src/components/ui/content-health.tsx  (HealthMeter added)
frontend/src/features/editorial/components/PublicationPanel.tsx  (success moment + context-safe toast)
frontend/src/features/editorial/pages/PublicationTimelinePage.tsx  (Countdown + minute timer)
frontend/src/i18n/locales/{en,fa,ar}/translation.json  (all new keys)
```

## 30. Final verification commands

```bash
# backend — from backend\
python manage.py check
python manage.py makemigrations --check --dry-run
python -m pytest -q --no-cov

# frontend — from frontend\
npm run typecheck
npm run lint
npm run test -- --run
npm run build
npm run build-storybook

# browsers — from frontend\ (Edge channel: msedge, backends at 127.0.0.1:8000/5173)
npx playwright test e2e/phase19-personality.spec.ts --reporter=list
npx playwright test e2e/publication-hardening.spec.ts e2e/publication-timeline.spec.ts e2e/publication-governance.spec.ts --reporter=list
npx playwright test e2e/roles.spec.ts e2e/responsive.spec.ts --reporter=list
npx playwright test e2e/accessibility.spec.ts e2e/rtl.spec.ts e2e/errors.spec.ts e2e/theme.spec.ts --reporter=list
npx playwright test e2e/seo.spec.ts e2e/workspace.spec.ts e2e/services-studio.spec.ts e2e/smoke.spec.ts --reporter=list

# manual spot-checks
# /dashboard, /dashboard/articles, /dashboard/projects, /dashboard/services, /dashboard/timeline, Ctrl+K, /credits
# FA / EN / AR, RTL, light/dark, 375/390/768/1024/1280/1440
```

---

> Verification (this run):
>
> - Backend tests: **382 passed**
> - Frontend tests: **298 passed / 58 files**
> - Playwright: **172 passed / 0 failed** (across 6 batches; single full run deferred due harness timeouts — same as phases 16–18)
> - TypeScript: **PASS**
> - ESLint: **PASS**
> - Vite build: **PASS**
> - Storybook build: **PASS**
> - Database migrations: **0**
> - DB preserved: **YES** (7 articles / 5 projects / 4 services / 7 users; 2 smoke rows removed after batches)
> - ERP touched: **NO** (`ERP_ENABLED=false`, `ERP_PROVIDER=null`, NullProvider)

