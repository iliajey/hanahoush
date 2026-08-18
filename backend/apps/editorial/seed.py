"""Editorial seed data — workflow stage definitions (idempotent)."""
import logging

from .models import WorkflowStage

logger = logging.getLogger(__name__)

STAGES = [
    {
        "code": "draft",
        "name": "Draft",
        "description": "Initial state. Content is being written.",
        "order": 1,
        "is_initial": True,
        "requires_approval": False,
        "allowed_transitions": ["in_review"],
    },
    {
        "code": "in_review",
        "name": "In Review",
        "description": "Content review is requested. A reviewer approval gates the next step.",
        "order": 2,
        "requires_approval": True,
        "allowed_transitions": ["seo_review", "draft"],
    },
    {
        "code": "seo_review",
        "name": "SEO Review",
        "description": "SEO/meta review. A second approval gates approval.",
        "order": 3,
        "requires_approval": True,
        "allowed_transitions": ["approved", "draft"],
    },
    {
        "code": "approved",
        "name": "Approved",
        "description": "Content is approved and can be scheduled.",
        "order": 4,
        "requires_approval": False,
        "allowed_transitions": ["scheduled", "draft"],
    },
    {
        "code": "scheduled",
        "name": "Scheduled",
        "description": "A publication time has been set.",
        "order": 5,
        "requires_approval": False,
        "allowed_transitions": ["published", "draft", "archived"],
    },
    {
        "code": "published",
        "name": "Published",
        "description": "Content is live (or soft-published).",
        "order": 6,
        "is_terminal": True,
        "requires_approval": False,
        "allowed_transitions": ["archived"],
    },
    {
        "code": "archived",
        "name": "Archived",
        "description": "Content is archived; it can be reopened to draft.",
        "order": 7,
        "is_terminal": True,
        "requires_approval": False,
        "allowed_transitions": ["draft"],
    },
]


def seed_workflow_stages() -> int:
    """Create or update the seven workflow stage definitions."""
    created = 0
    for definition in STAGES:
        stage, was_created = WorkflowStage.objects.get_or_create(
            code=definition["code"],
            defaults=definition,
        )
        if not was_created:
            for key, value in definition.items():
                setattr(stage, key, value)
            stage.save()
        created += int(was_created)
    logger.info("Seeded %d workflow stages.", created)
    return created
