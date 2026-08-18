"""Content snapshotting + diffing for the editorial versioning system."""
from django.forms.models import model_to_dict


def snapshot_content(obj) -> dict:
    """Serialize a content object into a JSON-safe snapshot.

    Handles FK fields as primary keys and M2M relations as pk lists. Audit /
    internal fields are excluded so diffs stay meaningful.
    """
    exclude = (
        "created_by",
        "updated_by",
        "created_at",
        "updated_at",
        "is_deleted",
        "deleted_at",
        "is_active",
    )
    data = model_to_dict(obj, exclude=exclude)
    # M2M relationships are already pk lists from model_to_dict; keep them.
    return data


def restore_snapshot(obj, data: dict) -> None:
    """Apply a snapshot back onto a content object (used for rollback)."""
    m2m_fields = {}
    for field in obj._meta.many_to_many:
        if field.name in data:
            m2m_fields[field.name] = data.pop(field.name)

    editable = {
        field.name for field in obj._meta.fields if field.editable and not field.primary_key
    }
    for key, value in data.items():
        if key in editable and key not in ("id",):
            setattr(obj, key, value)

    obj.save()

    for name, pks in m2m_fields.items():
        manager = getattr(obj, name)
        manager.set(pks)


def diff_snapshots(old: dict | None, new: dict | None) -> list[dict]:
    """Return a structured field-level diff between two snapshots.

    Each entry: ``{field, kind: added|removed|changed, old, new}``.
    """
    old = old or {}
    new = new or {}
    changes: list[dict] = []

    all_fields = sorted(set(old.keys()) | set(new.keys()))
    for field in all_fields:
        before = old.get(field)
        after = new.get(field)
        if before is None and after is None:
            continue
        if field not in old:
            changes.append({"field": field, "kind": "added", "old": None, "new": after})
        elif field not in new:
            changes.append({"field": field, "kind": "removed", "old": before, "new": None})
        elif before != after:
            changes.append({"field": field, "kind": "changed", "old": before, "new": after})
    return changes
