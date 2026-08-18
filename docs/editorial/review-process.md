# Editorial Workflow — Review Process

## Approval chain

Entering `in_review` and `seo_review` creates a **pending `Approval`** (the
stage's `requires_approval`). A workflow cannot advance past a stage while an
approval for it is pending **or rejected** — send-back to `draft` is always
allowed.

```
draft ──submit──▶ in_review [Approval: review] ──approve──▶ seo_review [Approval: seo] ──approve──▶ approved
                      ▲                                    ▲
                      └── send back to draft ──────────────┘
```

- **Reviewer assignment**: `submit-review` / `transition` accept an
  `assignee_id`; the pending approval records `approver`.
- **Decision**: `ApprovalService.decide(approval, actor, approved, comment)`
  flips the status and writes the audit event. Rejected approvals must be
  re-requested (send to draft and resubmit).

## Review comments

`ReviewComment` are **threaded** (`parent` FK → replies), **resolvable**
(`resolved`/`resolved_by`/`resolved_at`) and support **mentions**
(`mentions` = list of user ids).

- `POST /workflows/{id}/comments/` — create (body, optional parent, mentions).
- `POST /workflows/{id}/comments/{cid}/resolve/` — resolve a thread.
- `GET /workflows/{id}/comments/` — top-level threads with nested replies.

## Scheduling + soft publish

- **Scheduling**: `WorkflowService.schedule(workflow, when, actor)` requires
  the `approved` (or `scheduled`) stage, creates a `PublicationSchedule` and
  transitions to `scheduled`. Due schedules are published by
  `python manage.py publish_scheduled` (or `ScheduleService.publish_due()`).
- **Publishing**: `publish(workflow, actor, soft=False)`.
  - Hard publish flips the content model's `status` → `published`,
    `is_public=True`.
  - **Soft publish** sets `is_soft_published` and leaves the content
    unpublished — visible only to authorized users (editorial preview).
- `archive` / `reopen` handle the terminal lifecycle.

## Content locking

`LockService` prevents concurrent editing:

- `acquire(obj, user, ttl_seconds=900)` — one lock per content object; a second
  acquisition by a different user raises `WorkflowError` ("Content is locked
  by …"). The owner may refresh their own lock.
- `release(obj, user)` — owner (or superuser) only.
- **Auto-unlock timeout** — `expires_at`; expired locks are ignored and can be
  re-acquired. `release_expired()` cleans them up.
- Locks are created/deleted through `/api/v1/editorial/locks/` and surfaced by
  `LockIndicator` on the frontend.

## Audit log

`AuditEvent` records **who, when, old value, new value, IP** for every
important action: `workflow.transition`, `revision.created`,
`revision.rollback`, `approval.decided`, `schedule.created`, `workflow.publish`,
`workflow.archive`, `comment.created`, `comment.resolved`, `lock.acquired`,
`lock.refreshed`, `lock.released`. The workflow change form and the
`AuditTimeline` component render the trail.

## Permissions

| Action | Required permission |
|---|---|
| View workflows / audit / revisions / locks | `editorial.view` |
| Transition / submit / rollback / archive / reopen | `editorial.manage` |
| Approve / reject approvals | `editorial.approve` |
| Comment / resolve | `editorial.review` (or manage) |
| Schedule / publish | `editorial.schedule` (or manage) |
| Lock / unlock | `editorial.manage` |

Superusers bypass all checks. The API returns 401 for anonymous and 403 for
insufficient permissions.
