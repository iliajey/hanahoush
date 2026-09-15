# Phase 20 Report — Real User Journey, Workflow QA & UX Hardening

Date: 2026-09-14. UX-hardening phase: no new CMS/editor/palette/search/RBAC/API/analytics/publication/SEO system, no migrations, no DB reset, ERP parked.

> No credentials, secrets, password hashes, or tokens appear in this report.

---

## 1. Executive summary

Audited Hanahoush as a real staff user and fixed the reported P0 plus the journey dead ends found: **MediaPicker dialog** now has constrained `max-h-[100dvh]`, internal scroll region (`data-testid="media-picker-scroll"`), sticky footer (`Cancel / Use this image`) reachable at 375/390px RTL/LTR light/dark keyboard; **PublicationPanel** no longer fires false optimistic success toasts — success only after mutation settles without blockers; success states link to `/dashboard/timeline`; **Projects list** gains the missing Preview button (articles/services already had it); all three **preview pages** gain Edit back-link + published-only public verification link (services → `/services` hub, no detail route invented); missing `projectWorkspace.previewLink` key added FA/EN/AR. Full verification: backend **382 passed**, frontend **300 passed / 58 files**, typecheck clean, lint clean, vite build clean, storybook build clean, Playwright **165 passed** across batches (5 new phase-20 specs included).

## 2. Existing workflow audit

Read before coding: `phase-19/18/17/16-report.md`, Article/Project/Service studios, MediaPicker + MediaWorkspace, PublicationPanel + Timeline, Dashboard + Command Center, RBAC/capabilities, e2e specs, i18n, workspaceConfig/routes. Confirmed: single CMS endpoints reused, single Dialog/Radix system, single search palette (Command Center), single RBAC (backend authoritative), single publication system (workflow + schedule + publish_due), hub-only services (no detail route), ERP parked. No duplicates created.

## 3. Media upload bug

Root cause: `MediaPicker` DialogContent had `max-w-3xl` with no height constraint; metadata editor (9 fields) + grid pushed footer off-viewport on small screens, no internal scroll, no sticky footer. Global Dialog also lacked max-height. Fix:
- `MediaPicker.tsx`: `DialogContent flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] flex-col overflow-hidden p-0`, header `shrink-0`, body `min-h-0 flex-1 overflow-y-auto overscroll-contain` with `data-testid="media-picker-scroll"`, new sticky footer `border-t Cancel / Use this image` (disabled until selection).
- `dialog.tsx`: global `max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain` so every dialog stays reachable.
- Verified 375/390/768/1024/1280/1440 via responsive suite + new phase-20 specs (375 LTR light, 390 FA RTL dark), keyboard (Radix trap, Tab/Enter/Esc), no overflow (`horizontalOverflowPx=0`).
- Existing MediaPicker tests preserved (selector updated for duplicated Use button), new regression asserts scroll region + visible footer buttons.

## 4. Article journey

`Dashboard → Articles → New draft (/dashboard/articles/new) → locale dropdown FA/EN/AR → title/slug/excerpt/body → Choose cover → MediaPicker → SEO → Create draft/Save → Preview (/dashboard/articles/:id/preview, public-component parity, locale switcher, Edit back, public link when published) → Submit for review (editorial.manage) → /dashboard/editorial/:id → approvals (editorial.approve) → Schedule/Publish (approved/scheduled stage, editorial.schedule/manage, 422 blockers shown) → Timeline (countdown, reschedule/cancel, Failed fix&retry) → Published → public /articles/:slug`. Refresh keeps `?locale=`; dirty badge + beforeunload + 30s silent autosave; API/media failures surface inline with retry; missing cover/media shows health warning not crash. Publish-now success links to timeline.

## 5. Project journey

Same pipeline via Project Studio 2.0: identity + narrative body + six case-study sections (Challenge/Objectives/Solution/Stages/Architecture/Results, per-locale, hide toggles with health warnings) + cover + gallery (save-first gate explained) + SEO/health → Preview renders hero + body + all six sections + gallery → submit/schedule/publish → Timeline → public `/projects/:slug`. P1 fixed: workspace list lacked Preview button (only edit + public link) — added eye Preview navigating to `/preview`, plus `previewLink` i18n FA/EN/AR. Preview page gains Edit + published-only case-study link.

## 6. Service journey

Section-based, hub-only (Option A, no `/services/:slug`). `Dashboard → Services → New service → title/slug + section picker + icon + order + cover + excerpt/body per locale → Save → Preview (/dashboard/services/:id/preview, ServiceCard + body + hub breadcrumb, Edit back, published-only /services link) → submit/schedule/publish → Timeline → public `/services` hub`. No detail route invented. Guide documents hub verification explicitly.

## 7. Navigation issues found

- P1: Projects list missing Preview (fixed, §5).
- P1: Previews had only `Back to list` — no Edit return, no public proof (fixed all three previews, §4–6).
- P1: Publication success showed toast even on backend rejection, no next step (fixed: settle-gated success + Open timeline link, §8).
- P2: `beforeunload` only guards tab close, not in-app nav — documented, not rebuilt (dirty badge + autosave mitigate).
- Verified: breadcrumbs, workspace nav, Preview↔Edit, Save→list, Submit→editorial detail, Schedule/Publish→timeline link, Cancel→safe list, refresh/locale param, back/forward (smoke), direct URL guards → /unauthorized|/login, mobile drawer (responsive suite).

## 8. UX issues found

- P0 media footer trap (fixed §3).
- P0 false success toast on publish/schedule failure (fixed: `awaitingRef` + `useEffect` on `[pending, failed]`; toast + inline ✓ only when no blockers/errors).
- P1 dead ends above (fixed).
- P2: service `icon` free-text (pre-existing, deferred since phase 19).
- P2: `publishing` schedule-status dead value (pre-existing, harmless).
- No new charts/animations/routes added.

## 9. Bugs fixed

1. MediaPicker footer unreachable on small viewports (P0).
2. Global Dialog lacked viewport height bound (P0 hardening).
3. False optimistic Published/Scheduled toast on failure (P0).
4. Projects list missing Preview button (P1).
5. Previews missing Edit return + public verification links (P1).
6. Missing `projectWorkspace.previewLink` FA/EN/AR (P1).
7. Success states missing next-step link (P1 — Open timeline).

## 10. Bugs intentionally deferred

- In-app unsaved-changes blocker (React Router blocker) — beforeunload + dirty badge + autosave suffice; needs design, not quick patch.
- Service icon picker with Lucide preview (phase-19 deferred).
- Dead `publishing` schedule status cleanup.
- Timeline virtualization (20/page, unneeded).
- Dashboard charts (out of scope since phase 17).
- Per-locale SEO-difference tooltips.

## 11. Role/RBAC verification

Backend authoritative; frontend gates only hide/disable. Unit: navigation.test (6 roles), CommandCenter viewer test. E2E: roles.spec 8/8 (login → dashboard → nav → backend 401/403 probes → forbidden routes → logout), workspace restricted-role tests (projectmanager no New/Edit, editor denied writes 403), timeline viewer read-only, anonymous 401. Six roles matrix documented in user guide. No backend auth weakened.

## 12. FA/EN/AR verification

Studios edit one locale at a time with completeness dots; `?locale=` preselect from timeline dots; previews switch FA/EN/AR with EN fallback; new keys (`previewLink` project, existing publication keys) in all three locales; RTL suite 6/6; phase-20 RTL dark FA picker spec green; translation parity enforced by frontend suite.

## 13. RTL/LTR verification

Logical `start/end`, `ps-*`, `rtl:rotate-180` preserved; timeline dates `dir=ltr`; case-study `dir` per locale; dialogs `w-[calc(100vw-2rem)]`; 375/390 RTL specs green, no overflow.

## 14. Responsive verification

375/390/768/1024/1280/1440: responsive suite 52/52, publication specs assert 375/390 no-overflow, phase-20 picker specs assert footer reachable + zero overflow. No horizontal overflow introduced; `prefers-reduced-motion` untouched (MotionConfig + CSS).

## 15. Accessibility verification

Axe 13/13; dialogs Radix trap + labels; picker dropzone keyboard (Enter/Space), grid `aria-pressed`, metadata labels, footer buttons; panel alerts `role=alert`, success `role=status`; locale dots symbol + text (never color-only); focus-visible rings; reduced-motion respected.

## 16. Browser/E2E results

Real Edge/Chromium (`channel: msedge` config, headless) against `localhost:5173 ↔ 127.0.0.1:8000`, batched (harness timeouts, same as phases 16–19):

| Batch | Result |
|---|---|
| phase20-workflow (new, 5) | 5 passed |
| workspace + services-studio (14) | 14 passed |
| publication timeline/governance/hardening (15) | 15 passed |
| roles + responsive (60) | 60 passed |
| accessibility + rtl + errors + theme (37) | 37 passed |
| seo + smoke + phase19-personality (34) | 34 passed |
| **Total** | **165 passed, 0 failed** |

## 17. Backend/frontend test results

- `python -m pytest -q --no-cov`: **382 passed**.
- `npm run test -- --run`: **58 files, 300 passed** (was 58/298; +2 net: MediaPicker scroll regression + PublicationPanel timeline-link test).
- `npm run typecheck`: PASS. `npm run lint`: PASS. `npm run build`: PASS (3.83s, pre-existing dynamic-import notice only). `npm run build-storybook`: PASS.

## 18. Database/migration status

- `manage.py check`: clean. `makemigrations --check --dry-run`: No changes detected. No migration added.
- No reset. Baseline preserved: 6 demo published articles + `t1` (review) + pre-existing probe `a` (id 50, draft, predates session — left untouched); 5 projects; 4 services (after cleanup); 3 workflows (ids 1,2,37); 1 far-future schedule (id 1).
- This phase's E2E residue cleaned: article 51 (`phase10-e2e-draft-mu0y22b1`) + workflow 38 + 2 audits + 1 approval + 1 revision + tags; service 11 (`phase155-e2e-service-mu0y1wbc`, workflow-less). Soft-deleted media rows (36, from designed soft-delete flows) left intact — not residue to hard-delete.

## 19. ERP status

**PARKED.** Defaults `ERP_ENABLED=False`, `ERP_PROVIDER=null` (`NullProvider`) in `config/settings/base.py`. No ERP calls, credentials, models, or migrations touched. No ERP files changed.

## 20. User-facing publishing guide location

`docs/reports/phase-20-user-workflow-guide.md` — real implemented workflows for Article/Project/Service, roles, draft→publish, media, preview, health, schedule, failure retry, public verification, localization, unavailable-button triage, common mistakes.

## 21. Remaining product gaps

- In-app unsaved-changes navigation guard.
- Service icon picker.
- Dead `publishing` status value.
- og_image picker (backend field exists, reuses cover).
- Earlier-phase uncommitted tree triage/commits (owner decision, not bundled here).

## 22. Recommended next phase

Phase 21 — owner-triaged commits of the accumulated tree + the three small studio papercuts (in-app dirty guard, icon picker, `publishing` cleanup) + production cron wiring for `publish_due()`, re-running this phase's batch matrix on a staging clone. No new domains.

---

## Exact answers

**How does a user publish an Article?** Create draft in Articles workspace (trilingual + cover + SEO) → Save → Preview → Submit for review (editorial.manage) → approvals advance to `approved` → Schedule (datetime) or Publish now (editorial.schedule/manage, readiness 422 enforced) → verify in Timeline (countdown/retry) → public `/articles/:slug`.

**How does a user publish a Project?** Same pipeline in Projects workspace with six case-study sections + gallery (save-first), preview shows all sections, public proof at `/projects/:slug`.

**How does a user publish a Service?** Same pipeline in Services workspace (section picker + hub preview); public proof is the `/services` hub — no detail route exists by architecture decision.

---

> Verification (this run):
>
> - Backend tests: **382 passed**
> - Frontend tests: **300 passed / 58 files**
> - Playwright: **165 passed / 0 failed** (6 batches)
> - TypeScript: **PASS** · ESLint: **PASS** · Vite build: **PASS** · Storybook build: **PASS**
> - Migrations: **0** · DB preserved: **YES** (residue cleaned) · ERP: **PARKED**
