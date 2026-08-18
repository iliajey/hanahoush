"""Editorial workflow service layer.

Encapsulates every state change so the API, admin and tests share one
implementation: transitions, revisions, rollback, approval, scheduling,
publishing (incl. soft publish), locking, comments and the audit log.
"""
import logging

from django.utils import timezone

from apps.core.models import Status

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
from .snapshots import diff_snapshots, restore_snapshot, snapshot_content

logger = logging.getLogger(__name__)

LOCK_TTL_SECONDS = 15 * 60  # auto-unlock timeout


class WorkflowError(Exception):
    """Raised on invalid workflow operations."""


def _get_ip(request=None, ip=None) -> str | None:
    if ip:
        return ip
    if request is not None:
        meta = getattr(request, "META", {})
        return meta.get("REMOTE_ADDR")
    return None


class AuditService:
    """Writes the immutable audit trail."""

    @staticmethod
    def record(workflow, actor, action, old=None, new=None, details="", ip=None):
        AuditEvent.objects.create(
            workflow=workflow,
            actor=actor,
            action=action,
            old_value=old,
            new_value=new,
            details=details,
            ip_address=_get_ip(ip=ip),
        )


class RevisionService:
    """Version snapshots, rollback and diff."""

    @staticmethod
    def create_revision(workflow, actor, summary="", ip=None):
        # Snapshot a fresh row (GenericForeignKey caches a possibly-stale object).
        obj = workflow.content_object
        if obj is not None:
            fresh = obj._meta.model.objects.filter(pk=workflow.object_id).first()
            obj = fresh or obj
        workflow.version += 1
        revision = ContentRevision.objects.create(
            workflow=workflow,
            version=workflow.version,
            data=snapshot_content(obj),
            summary=summary,
            created_by=actor,
        )
        workflow.current_revision = revision
        workflow.save(update_fields=["version", "current_revision", "updated_at"])
        AuditService.record(
            workflow,
            actor,
            "revision.created",
            old={"version": workflow.version - 1},
            new={"version": workflow.version},
            details=summary,
            ip=ip,
        )
        return revision

    @staticmethod
    def diff(workflow, from_version, to_version):
        revisions = list(
            workflow.revisions.filter(version__in=[from_version, to_version]).order_by("version")
        )
        if len(revisions) != 2:
            raise WorkflowError("Both revisions must exist to compute a diff.")
        older, newer = revisions
        return {
            "from": from_version,
            "to": to_version,
            "changes": diff_snapshots(older.data, newer.data),
        }

    @staticmethod
    def rollback(workflow, revision, actor, ip=None):
        if revision.workflow_id != workflow.id:
            raise WorkflowError("Revision does not belong to this workflow.")
        restore_snapshot(workflow.content_object, revision.data)
        AuditService.record(
            workflow,
            actor,
            "revision.rollback",
            old={"version": workflow.version},
            new={"version": revision.version},
            details=f"Rolled back to revision v{revision.version}",
            ip=ip,
        )
        # Capture the rolled-back state as a new revision (rollback is a change).
        return RevisionService.create_revision(
            workflow,
            actor,
            summary=f"Rollback to v{revision.version}",
            ip=ip,
        )


class WorkflowService:
    """Transitions + publishing."""

    @staticmethod
    def get_or_create(obj) -> ContentWorkflow:
        from django.contrib.contenttypes.models import ContentType

        ct = ContentType.objects.get_for_model(obj)
        workflow, created = ContentWorkflow.objects.get_or_create(
            content_type=ct,
            object_id=obj.pk,
            defaults={"stage": WorkflowStage.get("draft")},
        )
        return workflow

    @staticmethod
    def _set_content_status(workflow, status_code: str, is_public: bool | None = None):
        obj = workflow.content_object
        if obj is None or not hasattr(obj, "status"):
            return
        mapping = {
            "draft": Status.DRAFT,
            "published": Status.PUBLISHED,
            "archived": Status.ARCHIVED,
        }
        if status_code in mapping:
            obj.status = mapping[status_code]
        if is_public is not None and hasattr(obj, "is_public"):
            obj.is_public = is_public
        obj.save(update_fields=[f for f in ("status", "is_public") if hasattr(obj, f)])

    @staticmethod
    def _pending_approvals(workflow):
        return workflow.approvals.filter(status="pending")

    @staticmethod
    def transition(workflow, to_code, actor, ip=None, comment="", assignee_id=None):
        current = workflow.stage
        if to_code not in current.allowed_transitions:
            raise WorkflowError(
                f"Transition {current.code} → {to_code} is not allowed."
            )
        # Approvals gate forward moves; sending back to draft is always allowed.
        if to_code != "draft":
            unresolved = workflow.approvals.filter(
                stage=current,
                status__in=["pending", "rejected"],
            ).exists()
            if current.requires_approval and unresolved:
                raise WorkflowError(
                    f"Unresolved approvals on '{current.name}' block this transition."
                )

        target = WorkflowStage.get(to_code)
        old_stage = current.code

        # Revision snapshot before moving.
        RevisionService.create_revision(workflow, actor, summary=f"→ {target.name}", ip=ip)

        workflow.stage = target
        workflow.is_soft_published = False
        workflow.save(update_fields=["stage", "is_soft_published", "updated_at"])

        if target.requires_approval:
            approver = None
            if assignee_id:
                from django.contrib.auth import get_user_model

                approver = get_user_model().objects.filter(pk=assignee_id).first()
            Approval.objects.create(
                workflow=workflow,
                stage=target,
                requested_by=actor,
                approver=approver,
                order=target.order,
            )

        WorkflowService._set_content_status(workflow, "draft")

        AuditService.record(
            workflow,
            actor,
            "workflow.transition",
            old={"stage": old_stage},
            new={"stage": to_code},
            details=comment,
            ip=ip,
        )
        return workflow

    @staticmethod
    def submit_for_review(workflow, actor, ip=None, comment="", reviewer_id=None):
        return WorkflowService.transition(
            workflow, "in_review", actor, ip=ip, comment=comment, assignee_id=reviewer_id
        )

    @staticmethod
    def send_to_seo_review(workflow, actor, ip=None, comment="", reviewer_id=None):
        return WorkflowService.transition(
            workflow, "seo_review", actor, ip=ip, comment=comment, assignee_id=reviewer_id
        )

    @staticmethod
    def approve_to_publish(workflow, actor, ip=None, comment="", assignee_id=None):
        return WorkflowService.transition(
            workflow, "approved", actor, ip=ip, comment=comment, assignee_id=assignee_id
        )

    @staticmethod
    def schedule(workflow, when, actor, ip=None):
        if workflow.stage.code not in ("approved", "scheduled"):
            raise WorkflowError("Only approved content can be scheduled.")
        old = workflow.stage.code
        schedule = PublicationSchedule.objects.create(
            workflow=workflow,
            scheduled_for=when,
            status="scheduled",
            scheduled_by=actor,
        )
        if workflow.stage.code == "approved":
            WorkflowService.transition(workflow, "scheduled", actor, ip=ip, comment="Scheduled")
        AuditService.record(
            workflow,
            actor,
            "schedule.created",
            old={"stage": old},
            new={"stage": workflow.stage.code, "scheduled_for": str(when)},
            details=f"Schedule {schedule.pk}",
            ip=ip,
        )
        return schedule

    @staticmethod
    def publish(workflow, actor, ip=None, soft=False, schedule=None):
        if workflow.stage.code not in ("scheduled", "approved"):
            raise WorkflowError("Only scheduled or approved content can be published.")
        old = workflow.stage.code
        if not soft:
            WorkflowService._set_content_status(workflow, "published", is_public=True)
        else:
            workflow.is_soft_published = True

        workflow.stage = WorkflowStage.get("published")
        workflow.save(update_fields=["stage", "is_soft_published", "updated_at"])

        if schedule is not None:
            schedule.status = "published"
            schedule.published_at = timezone.now()
            schedule.save(update_fields=["status", "published_at"])

        AuditService.record(
            workflow,
            actor,
            "workflow.publish",
            old={"stage": old, "soft": False},
            new={"stage": "published", "soft": bool(soft)},
            ip=ip,
        )
        return workflow

    @staticmethod
    def archive(workflow, actor, ip=None):
        if workflow.stage.code != "published":
            raise WorkflowError("Only published content can be archived.")
        old = workflow.stage.code
        workflow.stage = WorkflowStage.get("archived")
        workflow.save(update_fields=["stage", "updated_at"])
        WorkflowService._set_content_status(workflow, "archived")
        AuditService.record(
            workflow,
            actor,
            "workflow.archive",
            old={"stage": old},
            new={"stage": "archived"},
            ip=ip,
        )
        return workflow

    @staticmethod
    def reopen(workflow, actor, ip=None):
        if workflow.stage.code != "archived":
            raise WorkflowError("Only archived content can be reopened.")
        return WorkflowService.transition(workflow, "draft", actor, ip=ip, comment="Reopened")


class ApprovalService:
    """Approval chain decisions."""

    @staticmethod
    def decide(approval: Approval, actor, approved: bool, comment="", ip=None):
        if approval.status != "pending":
            raise WorkflowError("Approval has already been decided.")
        old = approval.status
        approval.status = "approved" if approved else "rejected"
        approval.comment = comment
        approval.decided_at = timezone.now()
        approval.save(update_fields=["status", "comment", "decided_at", "updated_at"])
        AuditService.record(
            approval.workflow,
            actor,
            "approval.decided",
            old={"approval": approval.pk, "status": old},
            new={"approval": approval.pk, "status": approval.status},
            details=comment,
            ip=ip,
        )
        return approval


class ScheduleService:
    """Scheduled publishing."""

    @staticmethod
    def publish_due():
        now = timezone.now()
        due = PublicationSchedule.objects.filter(
            status="scheduled",
            scheduled_for__lte=now,
        ).select_related("workflow", "workflow__content_type")
        published = []
        for schedule in due:
            try:
                actor = schedule.scheduled_by
                WorkflowService.publish(schedule.workflow, actor, schedule=schedule, soft=False)
                published.append(schedule)
            except WorkflowError as exc:
                logger.warning("Scheduled publish failed for %s: %s", schedule.pk, exc)
        return published


class LockService:
    """Content locking with auto-unlock timeout."""

    @staticmethod
    def acquire(
        obj,
        user,
        ip=None,
        ttl_seconds=LOCK_TTL_SECONDS,
        note="",
        session_key="",
    ) -> ContentLock:
        from django.contrib.contenttypes.models import ContentType

        ct = ContentType.objects.get_for_model(obj)
        now = timezone.now()
        existing = ContentLock.objects.filter(content_type=ct, object_id=obj.pk).first()
        if existing and not existing.expired(now):
            if existing.locked_by_id == user.pk:
                # Refresh own lock.
                existing.expires_at = now + timezone.timedelta(seconds=ttl_seconds)
                existing.save(update_fields=["expires_at", "updated_at"])
                AuditService.record(
                    None,
                    user,
                    "lock.refreshed",
                    new={"content": str(obj)},
                    ip=ip,
                )
                return existing
            raise WorkflowError(f"Content is locked by {existing.locked_by}.")

        if existing:
            existing.delete()
        lock = ContentLock.objects.create(
            content_type=ct,
            object_id=obj.pk,
            locked_by=user,
            session_key=session_key,
            expires_at=now + timezone.timedelta(seconds=ttl_seconds),
            note=note,
            created_by=user,
        )
        AuditService.record(None, user, "lock.acquired", new={"content": str(obj)}, ip=ip)
        return lock

    @staticmethod
    def release(obj, user, ip=None):
        from django.contrib.contenttypes.models import ContentType

        ct = ContentType.objects.get_for_model(obj)
        lock = ContentLock.objects.filter(content_type=ct, object_id=obj.pk).first()
        if not lock:
            return None
        if lock.locked_by_id != user.pk and not getattr(user, "is_superuser", False):
            raise WorkflowError("You do not hold this lock.")
        lock.delete()
        AuditService.record(None, user, "lock.released", new={"content": str(obj)}, ip=ip)
        return lock

    @staticmethod
    def get(obj) -> ContentLock | None:
        from django.contrib.contenttypes.models import ContentType

        ct = ContentType.objects.get_for_model(obj)
        return ContentLock.objects.filter(content_type=ct, object_id=obj.pk).first()

    @staticmethod
    def release_expired():
        count = 0
        for lock in ContentLock.objects.filter(expires_at__lte=timezone.now()):
            lock.delete()
            count += 1
        return count


class CommentService:
    """Threaded review comments with mention + resolution support."""

    @staticmethod
    def add(workflow, actor, body, parent=None, mentions=None, ip=None) -> ReviewComment:
        comment = ReviewComment.objects.create(
            workflow=workflow,
            parent=parent,
            body=body,
            mentions=list(mentions or []),
            created_by=actor,
        )
        AuditService.record(
            workflow,
            actor,
            "comment.created",
            new={"comment": comment.pk, "mentions": comment.mentions},
            ip=ip,
        )
        return comment

    @staticmethod
    def resolve(comment: ReviewComment, actor, ip=None):
        if comment.resolved:
            return comment
        comment.resolved = True
        comment.resolved_by = actor
        comment.resolved_at = timezone.now()
        comment.save(update_fields=["resolved", "resolved_by", "resolved_at", "updated_at"])
        AuditService.record(
            comment.workflow,
            actor,
            "comment.resolved",
            new={"comment": comment.pk},
            ip=ip,
        )
        return comment
