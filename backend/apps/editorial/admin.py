"""Editorial admin — workflow board, revision history, audit timeline, approvals.

Provides:
- Workflow board (list with stage filter + inline audit/revision timelines).
- Approval actions (approve / reject pending approvals in bulk).
- Rollback actions.
- Compare-revisions admin view.
"""
import difflib
import logging

from django.contrib import admin
from django.shortcuts import get_object_or_404, render
from django.urls import path
from django.utils.html import format_html

from apps.core.admin import BaseAdminMixin

from .models import (
    Approval,
    AuditEvent,
    ContentLock,
    ContentRevision,
    ContentWorkflow,
    PublicationSchedule,
    ReviewComment,
    WorkflowStage,
)

logger = logging.getLogger(__name__)


class AuditEventInline(admin.TabularInline):
    model = AuditEvent
    extra = 0
    can_delete = False
    readonly_fields = (
        "action",
        "actor",
        "old_value",
        "new_value",
        "details",
        "ip_address",
        "created_at",
    )
    fields = ("action", "actor", "details", "ip_address", "created_at")
    ordering = ("-created_at",)
    max_num = 30

    def has_add_permission(self, request, obj=None):
        return False


class RevisionInline(admin.TabularInline):
    model = ContentRevision
    extra = 0
    can_delete = False
    readonly_fields = ("version", "summary", "created_by", "created_at")
    fields = ("version", "summary", "created_by", "created_at")
    ordering = ("-version",)
    max_num = 30

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(WorkflowStage)
class WorkflowStageAdmin(BaseAdminMixin):
    list_display = ("code", "name", "order", "is_initial", "is_terminal", "requires_approval")
    list_editable = ("order", "requires_approval", "is_initial", "is_terminal")
    search_fields = ("code", "name")
    ordering = ("order",)


@admin.register(ContentWorkflow)
class ContentWorkflowAdmin(BaseAdminMixin):
    """Workflow board: stage, version, content, approval state + actions."""

    list_display = (
        "id",
        "content_label",
        "stage",
        "version",
        "is_soft_published",
        "pending_approvals",
        "updated_at",
    )
    list_filter = ("stage", "is_soft_published", "is_active", "is_deleted")
    search_fields = ("object_id",)
    inlines = [RevisionInline, AuditEventInline]
    readonly_fields = (
        "content_type",
        "object_id",
        "stage",
        "version",
        "current_revision",
        "created_at",
        "updated_at",
    )
    actions = ["approve_pending", "publish_workflow", "archive_workflow"]

    def pending_approvals(self, obj):
        count = obj.approvals.filter(status="pending").count()
        return format_html(
            '<span style="color:{}">{}</span>',
            "orange" if count else "inherit",
            count,
        )

    pending_approvals.short_description = "Pending approvals"

    @admin.action(description="Approve pending approvals (selected)")
    def approve_pending(self, request, queryset):
        from django.utils import timezone

        updated = 0
        for workflow in queryset:
            for approval in workflow.approvals.filter(status="pending"):
                approval.status = "approved"
                approval.decided_at = timezone.now()
                approval.save(update_fields=["status", "decided_at", "updated_at"])
                updated += 1
        self.message_user(request, f"{updated} approval(s) approved.")

    @admin.action(description="Publish selected workflows")
    def publish_workflow(self, request, queryset):
        from .services import WorkflowService

        ok = 0
        for workflow in queryset:
            try:
                WorkflowService.publish(workflow, request.user)
                ok += 1
            except Exception as exc:  # noqa: BLE001
                logger.warning("Admin publish failed for %s: %s", workflow.pk, exc)
        self.message_user(request, f"{ok} workflow(s) published.")

    @admin.action(description="Archive selected workflows")
    def archive_workflow(self, request, queryset):
        from .services import WorkflowService

        ok = 0
        for workflow in queryset:
            try:
                WorkflowService.archive(workflow, request.user)
                ok += 1
            except Exception as exc:  # noqa: BLE001
                logger.warning("Admin archive failed for %s: %s", workflow.pk, exc)
        self.message_user(request, f"{ok} workflow(s) archived.")

    # -- Compare revisions -------------------------------------------------
    def get_urls(self):
        urls = super().get_urls()
        custom = [
            path(
                "<path:object_id>/compare/",
                self.admin_site.admin_view(self.compare_view),
                name="editorial_contentworkflow_compare",
            ),
        ]
        return custom + urls

    def compare_view(self, request, object_id):
        workflow = get_object_or_404(ContentWorkflow, pk=object_id)
        from_version = int(request.GET.get("from", 0))
        to_version = int(request.GET.get("to", 0))
        revisions = workflow.revisions.filter(
            version__in=[from_version, to_version]
        ).order_by("version")
        diff_html = None
        if revisions.count() == 2:
            older, newer = list(revisions)
            left = "\n".join(f"{k}: {v}" for k, v in sorted(older.data.items()))
            right = "\n".join(f"{k}: {v}" for k, v in sorted(newer.data.items()))
            differ = difflib.HtmlDiff()
            diff_html = differ.make_table(
                left.splitlines(),
                right.splitlines(),
                fromdesc=f"v{from_version}",
                todesc=f"v{to_version}",
                context=True,
            )
        context = {
            **self.admin_site.each_context(request),
            "workflow": workflow,
            "revisions": workflow.revisions.order_by("-version"),
            "from_version": from_version,
            "to_version": to_version,
            "diff_html": diff_html,
            "opts": self.model._meta,
            "title": f"Compare revisions — {workflow}",
        }
        return render(request, "admin/editorial/compare.html", context)


@admin.register(ContentRevision)
class ContentRevisionAdmin(BaseAdminMixin):
    list_display = ("id", "workflow", "version", "summary", "created_by", "created_at")
    search_fields = ("summary", "workflow__object_id")
    ordering = ("-created_at",)
    readonly_fields = ("workflow", "version", "data", "summary", "created_by", "created_at")


@admin.register(ReviewComment)
class ReviewCommentAdmin(BaseAdminMixin):
    list_display = ("id", "workflow", "parent", "resolved", "created_by", "created_at")
    list_filter = ("resolved", "is_active", "is_deleted")
    search_fields = ("body",)
    ordering = ("-created_at",)


@admin.register(Approval)
class ApprovalAdmin(BaseAdminMixin):
    list_display = ("id", "workflow", "stage", "status", "approver", "requested_by", "decided_at")
    list_filter = ("status", "stage")
    search_fields = ("workflow__object_id", "comment")
    actions = ["approve_selected", "reject_selected"]

    @admin.action(description="Approve selected")
    def approve_selected(self, request, queryset):
        from .services import ApprovalService

        count = 0
        for approval in queryset.filter(status="pending"):
            ApprovalService.decide(approval, request.user, approved=True)
            count += 1
        self.message_user(request, f"{count} approval(s) approved.")

    @admin.action(description="Reject selected")
    def reject_selected(self, request, queryset):
        from .services import ApprovalService

        count = 0
        for approval in queryset.filter(status="pending"):
            ApprovalService.decide(approval, request.user, approved=False)
            count += 1
        self.message_user(request, f"{count} approval(s) rejected.")


@admin.register(PublicationSchedule)
class PublicationScheduleAdmin(BaseAdminMixin):
    list_display = ("id", "workflow", "scheduled_for", "status", "published_at", "scheduled_by")
    list_filter = ("status",)
    search_fields = ("workflow__object_id",)
    ordering = ("-scheduled_for",)
    actions = ["publish_now"]

    @admin.action(description="Publish due schedules")
    def publish_now(self, request, queryset):
        from .services import ScheduleService

        published = ScheduleService.publish_due()
        self.message_user(request, f"{len(published)} schedule(s) published.")


@admin.register(AuditEvent)
class AuditEventAdmin(BaseAdminMixin):
    list_display = ("id", "action", "workflow", "actor", "ip_address", "created_at")
    list_filter = ("action", "created_at")
    search_fields = ("action", "details", "actor__username")
    ordering = ("-created_at",)
    readonly_fields = (
        "workflow",
        "actor",
        "action",
        "old_value",
        "new_value",
        "details",
        "ip_address",
        "created_at",
    )


@admin.register(ContentLock)
class ContentLockAdmin(BaseAdminMixin):
    list_display = (
        "id",
        "content_type",
        "object_id",
        "locked_by",
        "expires_at",
        "is_active_flag",
        "created_at",
    )
    list_filter = ("created_at",)
    search_fields = ("object_id", "locked_by__username")
    ordering = ("-created_at",)

    def is_active_flag(self, obj):
        return obj.is_active

    is_active_flag.boolean = True
