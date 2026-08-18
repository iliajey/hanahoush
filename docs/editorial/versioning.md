# Editorial Workflow — Versioning

## Snapshots

Every important action (workflow transition, rollback) creates a
`ContentRevision`: a JSON **snapshot** of the content object
(`snapshot_content()`), stored with an incrementing `version` on the workflow.
`model_to_dict` serializes scalar fields, FK ids and M2M pk-lists — audit and
internal fields are excluded so diffs stay meaningful.

Snapshots always read a **fresh row** (the generic foreign key caches an
instance, which can go stale after a save).

## Revision chain

```
v1 (snapshot: draft content)  ──transition──▶  v2 (snapshot: in_review content)
   │                                                │
   └────────────────── rollback to v1 ───────────────┘
                                                        └─▶ v3 (snapshot of rolled-back state)
```

- `workflow.version` = latest revision number.
- `ContentRevision` rows are immutable; rollback creates a **new** revision
  capturing the rolled-back state (the history is never rewritten).
- Unique `(workflow, version)` prevents collisions.

## Rollback

`RevisionService.rollback(workflow, revision, actor)`:
1. Validates the revision belongs to the workflow.
2. `restore_snapshot(obj, data)` applies fields back onto the content object
   (only editable, non-pk fields) and re-syncs M2M relations.
3. Writes an audit event (`revision.rollback` with old/new version).
4. Captures the restored state as a new revision.

## Diff

`RevisionService.diff(workflow, from, to)` compares two snapshots and returns a
**structured, field-level** diff:

```json
{
  "from": 1,
  "to": 2,
  "changes": [
    { "field": "title_en", "kind": "changed", "old": "Old Title", "new": "New Title" },
    { "field": "is_featured", "kind": "added", "old": null, "new": true },
    { "field": "tags", "kind": "removed", "old": ["django"], "new": null }
  ]
}
```

The API exposes it at `GET /api/v1/editorial/workflows/{id}/diff/?from=&to=`,
and the frontend `DiffViewer` renders it (added / removed / changed rows).
Diff accuracy is covered by tests (e.g. `test_revisions_rollback_and_diff`).

## Admin

- `RevisionInline` on the workflow change form — read-only revision history.
- Rollback via the API, or the admin's bulk actions.
- **Compare revisions** view: `…/editorial/contentworkflow/{id}/compare/?from=1&to=2`
  renders a `difflib.HtmlDiff` table between two selected versions.
