# Editorial Workflow — Workflow

The Enterprise Editorial Workflow turns the CMS into a professional editorial
platform: content moves through a **reviewed, approved, scheduled** pipeline
before it is published — with full audit, versioning, locking and comments.

## State machine

```
Draft ──▶ In Review ──▶ SEO Review ──▶ Approved ──▶ Scheduled ──▶ Published ──▶ Archived
  ▲                                                                                   │
  └────────────────────────────────────── reopen ◀────────────────────────────────────┘
```

| Stage | Entering | Leaving requires |
|---|---|---|
| `draft` | initial / reopened | — |
| `in_review` | submitted for review | the review approval decided |
| `seo_review` | reviewer approved the review | the SEO approval decided |
| `approved` | SEO approval granted | — |
| `scheduled` | approved content scheduled | — |
| `published` | publish action (soft or hard) | — |
| `archived` | published content archived | — |
| `draft` (again) | archived content reopened | — |

Stage definitions live in `WorkflowStage` (rows seeded by
`seed_workflow_stages()`); `allowed_transitions` enforces the machine on every
`transition()` call.

## Services (`apps/editorial/services.py`)

- `WorkflowService.get_or_create(obj)` — attach a workflow to any content
  object (generic FK) in `draft`.
- `WorkflowService.transition(workflow, to_code, actor, …)` — validates the
  transition, snapshots a revision, optionally creates a pending approval for
  gated stages, and writes the audit event.
- `submit_for_review` / `send_to_seo_review` / `approve_to_publish` —
  convenience transitions that assign a reviewer (`assignee_id`).
- `WorkflowService.publish(workflow, actor, soft=False)` — hard publish flips
  the content model's `status` to `published` + `is_public=True`; **soft
  publish** marks the workflow `is_soft_published` and leaves content
  unpublished (visible only to authorized users).
- `archive` / `reopen` — terminal lifecycle + returning to draft.

## Content-agnostic attachment

A workflow is attached via `ContentType` + `object_id` (generic foreign key),
so any model (Article, Project, Service, Page, …) participates without schema
changes to the content models.

## Permissions

The editorial API is gated by the platform ACL:
`editorial.view`, `editorial.manage`, `editorial.approve`, `editorial.review`,
`editorial.schedule`. Superusers bypass. See `apps/editorial/permissions.py`.
