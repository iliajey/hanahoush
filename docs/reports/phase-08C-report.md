# Hanahoush — Phase 8C Report — Enterprise Editorial Workflow

**Date:** 2026-08-06
**Scope:** Transform the CMS into a professional editorial platform. No business
pages, no API redesign — the editorial layer extends the existing CMS.

---

## Executive Summary

Phase 8C adds a content-agnostic **editorial workflow layer** (`apps/editorial`)
on top of the existing CMS. Any content object (Article, Project, Service,
Page, …) can be attached to a `ContentWorkflow` and moved through a reviewed,
approved, scheduled pipeline: **Draft → In Review → SEO Review → Approved →
Scheduled → Published → Archived**.

Delivered: version history with **rollback** and structured **diff**, an
**approval chain** with reviewer assignment, **threaded/resolvable review
comments** with mentions, **content locking** with auto-unlock timeout, and a
complete **audit log** (who, when, old value, new value, IP). A premium admin
(workflow board, inline revision history + audit timeline, approval/rollback/
publish actions, compare-revisions view) and a full frontend feature
(`src/features/editorial/`: 8 components, 6 pages, `/dev/editorial` console,
Storybook stories) complete the platform.

**Gates:** `manage.py check` ✅ · `makemigrations --check` ✅ · migrate ✅ ·
bootstrap ✅ · Backend pytest **112** ✅ · TypeScript ✅ · ESLint ✅ · Vitest **80**
✅ · Vite build ✅ · Storybook build ✅ · ruff-clean ✅.

---

## Workflow

State machine (enforced by `WorkflowStage.allowed_transitions` +
`WorkflowService.transition`):

```
Draft ─▶ In Review ─▶ SEO Review ─▶ Approved ─▶ Scheduled ─▶ Published ─▶ Archived
  ▲                                                                    │
  └────────────────────────── reopen ◀─────────────────────────────────┘
```

- `WorkflowService.get_or_create(obj)` attaches a workflow (generic FK) to any
  content object.
- Entering `in_review`/`seo_review` creates a **pending Approval**; forward
  moves are blocked while an approval is pending or rejected (send-back to
  draft always allowed).
- Hard publish flips the content model's `status`; **soft publish** marks the
  workflow `is_soft_published` and keeps content unpublished (editorial-only
  visibility).
- `archive`/`reopen` manage the terminal lifecycle.

Live verification: an article was walked through the entire chain via the API
(reopen → submit → approve → seo → approve → schedule → soft publish).

---

## Revisioning

- Every transition snapshots the content (`snapshot_content()` via
  `model_to_dict`) into an immutable `ContentRevision`; `workflow.version`
  tracks the latest. Snapshots always read a fresh row (GFK caching avoided).
- **Rollback**: `RevisionService.rollback()` restores fields + M2M, records an
  audit event, and captures the restored state as a **new** revision — history
  is never rewritten.
- **Diff**: `diff_snapshots()` returns a structured field-level diff
  (`{field, kind: added|removed|changed, old, new}`); served at
  `GET …/diff/?from=&to=` and rendered by the `DiffViewer`.
- Admin: inline revision history, rollback actions, and a
  **compare-revisions** view (`difflib.HtmlDiff`).
- Verified live: 6 revisions across the flow, v1→v6 diff returned the expected
  `title_en` change; unit tests assert rollback + diff accuracy.

---

## Approval

- `Approval` rows gate `in_review` (review) and `seo_review` (SEO) stages.
  `submit-review`/`transition` accept `assignee_id` (reviewer assignment).
- `ApprovalService.decide(approval, actor, approved, comment)` — approval
  unlocks the next transition; rejection blocks it (send-back allowed).
- Admin bulk actions (approve/reject selected), API
  `POST …/approvals/{id}/decide/`.
- Frontend: `ApprovalQueuePage`, `ReviewPanelPage`, `ApprovalStatus`,
  `WorkflowBadge`, `PublishButton`.

---

## Scheduling

- `WorkflowService.schedule(workflow, when, actor)` (approved-only) creates a
  `PublicationSchedule` and transitions to `scheduled`.
- `manage.py publish_scheduled` / `ScheduleService.publish_due()` publishes due
  schedules (hard publish).
- Frontend `ScheduleCalendarPage` lists schedules; `PublishButton` offers
  publish (soft toggle) + schedule controls.
- Live: schedule created with status `scheduled`; soft publish applied.

---

## Audit

- `AuditEvent` records **actor, action, old_value, new_value, details,
  ip_address, created_at** for every important action: `workflow.transition`,
  `revision.created`, `revision.rollback`, `approval.decided`,
  `schedule.created`, `workflow.publish`, `workflow.archive`,
  `comment.created`, `comment.resolved`, `lock.acquired/refreshed/released`.
- Exposed via `GET /api/v1/editorial/audit/` (filter by workflow/action/actor),
  shown on the workflow change form and the `AuditTimeline` component.
- Live: 16 audit events captured across the QA flow.

---

## Performance

- Revision snapshots use `model_to_dict` (no N+1); workflow list/detail
  `select_related` the stage/content type.
- React Query hooks cache workflow state and invalidate on mutation
  (workflow, revisions, approvals, comments, audit, schedules, locks).
- Live localhost requests in the tens of ms; no new frontend runtime deps.

---

## Accessibility

- Components use semantic badges, `role="region"`-style containers and clear
  status labels (`ApprovalStatus`, `WorkflowBadge`).
- Diff rows differentiate added/removed/changed with both color and text
  labels (not color-only).
- `LockIndicator` announces the owner and auto-unlock window in text.
- Consistent loading (skeleton), empty and error states across pages.

---

## Visual QA

> Headless DOM-level review (jsdom render tests) + a live end-to-end API flow.
> Mockup: `docs/screenshots/phase-08C/editorial-console.svg`.

**Automated (frontend):**
- Components render correctly: `WorkflowBadge`, `ApprovalStatus` (pending/
  approved/rejected), `DiffViewer` (changed/added rows + empty message),
  `LockIndicator` (owner, empty state) — `components.test.tsx`.
- Hooks fetch + mutate: `useWorkflows`, `useWorkflow` (detail by id), lock
  acquire — `hooks.test.tsx`.
- All 9 editorial tests pass.

**Live end-to-end (via the running API):**
- Full chain: submit → in_review (200); blocked forward while pending (400);
  approve review → seo_review; approve seo → approved; schedule → scheduled;
  soft publish → published + `is_soft_published:true`.
- Comments: created (201) + resolved (200). Revisions: 6 versions; diff
  returned 1 expected change.
- Locks: acquire (201); owner refresh (201); backend test confirms a true
  conflict between two different users is rejected.
- Audit: 16 events with actor/IP/old/new.
- Permissions: anonymous 401; insufficient-role 403 (backend tests).

**Quality gate:**
- Version rollback ✅ (test) · Diff accuracy ✅ (test) · Workflow transitions ✅
  (tests + live) · Scheduling ✅ (tests + live) · Approval chain ✅ (tests +
  live) · Concurrent editing ✅ (lock tests) · Audit log ✅ · Permissions ✅
  (401/403 tests) · No regressions ✅ (full suites green).

---

## Verification

| Check | Result |
|---|---|
| `manage.py check` | ✅ |
| `makemigrations --check` | ✅ no changes |
| `migrate` | ✅ |
| `bootstrap` | ✅ (stages seeded, idempotent) |
| `pytest` | ✅ **112 passed** (96 + 16 editorial) |
| `ruff` | ✅ all checks passed |
| `tsc --noEmit` | ✅ |
| `eslint .` | ✅ |
| `vitest run` | ✅ **80 passed** (71 + 9 editorial) |
| `vite build` | ✅ |
| `build-storybook` | ✅ |

---

## Known Issues

1. **Notifications** — mentions/approvals are recorded but not dispatched
   (no email/websocket yet); planned for Phase 9 workers.
2. **Publish side-effects** — publishing only flips the content `status`;
   cache invalidation on publish is not wired (recommended next).
3. **In-app editor** — locks and revisions are exposed via API/UI, but the
   actual in-app content editor that holds a lock while editing does not exist
   yet (Phase 8D).
4. **Demo data** — no workflow is auto-seeded for demo content; workflows are
   created on demand via the admin/API.

---

## Recommendations

1. **Phase 8D:** wire the editorial workspace routes (revision history,
   workflow timeline, approval queue, review panel, diff viewer, schedule
   calendar) and add an in-app editor that acquires locks, saves revisions and
   transitions workflows.
2. Add mention/approval notifications (email/websocket) in Phase 9.
3. Invalidate page/cache keys on publish; use workflow revisions for ETag /
   conditional publishing.
4. Consider a Celery beat task for `publish_scheduled` in Phase 9.

---

## Suggested Git Commit

```
phase-08C: enterprise editorial workflow

- Add apps/editorial: WorkflowStage, ContentWorkflow, ContentRevision,
  ReviewComment, Approval, PublicationSchedule, AuditEvent, ContentLock
- Workflow service layer: transitions, rollback, diff, approval chain,
  scheduling, soft publish, locking, audit
- Editorial APIs under /api/v1/editorial/ (ACL-gated, standard envelope)
- Premium admin: workflow board, revision history, audit timeline,
  approval/rollback/publish actions, compare-revisions view
- Frontend src/features/editorial: hooks, components, 6 pages, dev console,
  Storybook stories
- 16 backend + 9 frontend tests; docs (workflow/versioning/review-process)
  + 3 diagrams
```

The repository is not under version control in this environment and no `git`
binary is available, so no commit was created — the message above is the
intended commit.

---

## Phase 8C completion checklist

- ✔ Workflow (7 stages, transitions, soft publish)
- ✔ Revisions (version history, rollback, diff)
- ✔ Approval (chain, reviewer assignment)
- ✔ Scheduling (publication schedules + publish_due)
- ✔ Audit (who/when/old/new/IP)
- ✔ Report path: `docs/reports/phase-08C-report.md`
- ✔ Ready for Phase 8D
