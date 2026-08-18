"""Editorial domain — Enterprise Editorial Workflow.

A content-agnostic workflow layer attached to any content object (Article,
Project, Service, Page, ...) via Django's generic foreign keys.

Workflow:
    draft → in_review → seo_review → approved → scheduled → published → archived

Key capabilities implemented here (logic in ``services.py``):
- Version history (ContentRevision snapshots) + rollback + diff.
- Approval chain (Approval rows gate transitions into gated stages).
- Reviewer assignment (assignee on pending approvals).
- Publication scheduling + soft publish.
- Threaded, resolvable review comments with mentions.
- Content locking (prevent concurrent editing, auto-unlock timeout).
- Full audit log (actor, action, old/new value, IP).
"""
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models

from apps.core.models import BaseModel

AUTH_USER_MODEL = settings.AUTH_USER_MODEL


class WorkflowStage(BaseModel):
    """A stage definition in the editorial workflow."""

    STAGE_CODES = [
        ("draft", "Draft"),
        ("in_review", "In Review"),
        ("seo_review", "SEO Review"),
        ("approved", "Approved"),
        ("scheduled", "Scheduled"),
        ("published", "Published"),
        ("archived", "Archived"),
    ]

    code = models.CharField(max_length=50, unique=True, choices=STAGE_CODES)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0, db_index=True)
    is_initial = models.BooleanField(default=False)
    is_terminal = models.BooleanField(default=False)
    requires_approval = models.BooleanField(
        default=False,
        help_text="Entering this stage requires a pending approval (approval chain).",
    )
    allowed_transitions = models.JSONField(
        default=list,
        help_text='List of stage codes reachable from here, e.g. ["in_review"].',
    )

    class Meta:
        verbose_name = "Workflow stage"
        verbose_name_plural = "Workflow stages"
        ordering = ["order", "code"]

    def __str__(self) -> str:
        return self.name

    @classmethod
    def get(cls, code: str) -> "WorkflowStage":
        return cls.objects.get(code=code)


class ContentWorkflow(BaseModel):
    """Workflow instance attached to one content object."""

    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveBigIntegerField(db_index=True)
    content_object = GenericForeignKey("content_type", "object_id")

    stage = models.ForeignKey(WorkflowStage, on_delete=models.PROTECT, related_name="workflows")
    version = models.PositiveIntegerField(default=0, help_text="Current revision version.")
    is_soft_published = models.BooleanField(
        default=False,
        help_text="Marked published but not visible on the public site.",
    )
    current_revision = models.ForeignKey(
        "ContentRevision",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )

    class Meta:
        verbose_name = "Content workflow"
        verbose_name_plural = "Content workflows"
        ordering = ["-updated_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["content_type", "object_id"],
                name="editorial_workflow_content_unique",
            )
        ]

    def __str__(self) -> str:
        return f"{self.content_object} — {self.stage.code}"

    @property
    def content_label(self) -> str:
        return str(self.content_object)


class ContentRevision(BaseModel):
    """A versioned snapshot of the content at a point in time."""

    workflow = models.ForeignKey(
        ContentWorkflow,
        on_delete=models.CASCADE,
        related_name="revisions",
    )
    version = models.PositiveIntegerField(db_index=True)
    data = models.JSONField(default=dict, help_text="Serialized content snapshot.")
    summary = models.CharField(max_length=255, blank=True)

    class Meta:
        verbose_name = "Content revision"
        verbose_name_plural = "Content revisions"
        ordering = ["-version"]
        constraints = [
            models.UniqueConstraint(
                fields=["workflow", "version"],
                name="editorial_revision_version_unique",
            )
        ]

    def __str__(self) -> str:
        return f"{self.workflow} — v{self.version}"


class ReviewComment(BaseModel):
    """Threaded, resolvable review comment with mention support."""

    workflow = models.ForeignKey(ContentWorkflow, on_delete=models.CASCADE, related_name="comments")
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="replies",
    )
    body = models.TextField()
    resolved = models.BooleanField(default=False, db_index=True)
    resolved_by = models.ForeignKey(
        AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="editorial_comments_resolved",
    )
    resolved_at = models.DateTimeField(null=True, blank=True)
    mentions = models.JSONField(
        default=list,
        blank=True,
        help_text="List of user ids mentioned in the comment.",
    )

    class Meta:
        verbose_name = "Review comment"
        verbose_name_plural = "Review comments"
        ordering = ["created_at"]

    def __str__(self) -> str:
        return f"Comment on {self.workflow}"


class Approval(BaseModel):
    """A single approval step in the chain."""

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    ]

    workflow = models.ForeignKey(
        ContentWorkflow,
        on_delete=models.CASCADE,
        related_name="approvals",
    )
    stage = models.ForeignKey(WorkflowStage, on_delete=models.PROTECT, related_name="approvals")
    requested_by = models.ForeignKey(
        AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="editorial_approvals_requested",
    )
    approver = models.ForeignKey(
        AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="editorial_approvals",
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending",
        db_index=True,
    )
    comment = models.TextField(blank=True)
    decided_at = models.DateTimeField(null=True, blank=True)
    order = models.PositiveIntegerField(default=0, db_index=True)

    class Meta:
        verbose_name = "Approval"
        verbose_name_plural = "Approvals"
        ordering = ["order", "created_at"]

    def __str__(self) -> str:
        return f"{self.workflow} — {self.stage.code} ({self.status})"


class PublicationSchedule(BaseModel):
    """A scheduled publish for a workflow."""

    STATUS_CHOICES = [
        ("scheduled", "Scheduled"),
        ("publishing", "Publishing"),
        ("published", "Published"),
        ("cancelled", "Cancelled"),
    ]

    workflow = models.ForeignKey(
        ContentWorkflow,
        on_delete=models.CASCADE,
        related_name="schedules",
    )
    scheduled_for = models.DateTimeField(db_index=True)
    published_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="scheduled",
        db_index=True,
    )
    scheduled_by = models.ForeignKey(
        AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="editorial_schedules",
    )
    cancelled_by = models.ForeignKey(
        AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="editorial_schedules_cancelled",
    )

    class Meta:
        verbose_name = "Publication schedule"
        verbose_name_plural = "Publication schedules"
        ordering = ["scheduled_for"]

    def __str__(self) -> str:
        return f"{self.workflow} @ {self.scheduled_for}"


class AuditEvent(BaseModel):
    """Immutable audit trail for every important editorial action."""

    workflow = models.ForeignKey(
        ContentWorkflow,
        on_delete=models.CASCADE,
        related_name="audit_events",
        null=True,
        blank=True,
    )
    actor = models.ForeignKey(
        AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="editorial_audit_events",
    )
    action = models.CharField(max_length=100, db_index=True)
    old_value = models.JSONField(null=True, blank=True)
    new_value = models.JSONField(null=True, blank=True)
    details = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        verbose_name = "Audit event"
        verbose_name_plural = "Audit events"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.action} — {self.workflow_id}"


class ContentLock(BaseModel):
    """An optimistic lock preventing concurrent editing of a content object."""

    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveBigIntegerField(db_index=True)
    content_object = GenericForeignKey("content_type", "object_id")

    locked_by = models.ForeignKey(
        AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="editorial_locks",
    )
    session_key = models.CharField(max_length=100, blank=True)
    expires_at = models.DateTimeField()
    note = models.CharField(max_length=255, blank=True)

    class Meta:
        verbose_name = "Content lock"
        verbose_name_plural = "Content locks"
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["content_type", "object_id"],
                name="editorial_lock_content_unique",
            )
        ]

    def __str__(self) -> str:
        return f"Lock on {self.content_object} by {self.locked_by}"

    @property
    def is_active(self) -> bool:
        from django.utils import timezone

        return self.expires_at > timezone.now()

    def expired(self, at=None) -> bool:
        from django.utils import timezone

        return self.expires_at <= (at or timezone.now())
