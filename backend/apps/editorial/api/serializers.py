"""Editorial API serializers."""
from rest_framework import serializers

from ..models import (
    Approval,
    AuditEvent,
    ContentLock,
    ContentRevision,
    ContentWorkflow,
    PublicationSchedule,
    ReviewComment,
    WorkflowStage,
)


class UserBriefSerializer(serializers.Serializer):
    id = serializers.IntegerField(source="pk", read_only=True)
    username = serializers.CharField(read_only=True)

    def to_representation(self, instance):
        return {"id": instance.pk, "username": getattr(instance, "username", str(instance))}


class StageBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkflowStage
        fields = ("code", "name", "order", "requires_approval", "allowed_transitions")


class WorkflowListSerializer(serializers.ModelSerializer):
    stage = StageBriefSerializer(read_only=True)
    content_label = serializers.CharField(read_only=True)
    pending_approvals_count = serializers.SerializerMethodField()

    class Meta:
        model = ContentWorkflow
        fields = (
            "id",
            "content_type",
            "object_id",
            "content_label",
            "stage",
            "version",
            "is_soft_published",
            "pending_approvals_count",
            "created_at",
            "updated_at",
        )

    def get_pending_approvals_count(self, obj):
        return obj.approvals.filter(status="pending").count()


class RevisionSerializer(serializers.ModelSerializer):
    created_by = UserBriefSerializer(read_only=True)

    class Meta:
        model = ContentRevision
        fields = ("id", "version", "summary", "data", "created_by", "created_at")


class RevisionListSerializer(RevisionSerializer):
    class Meta(RevisionSerializer.Meta):
        fields = ("id", "version", "summary", "created_by", "created_at")


class CommentSerializer(serializers.ModelSerializer):
    created_by = UserBriefSerializer(read_only=True)
    resolved_by = UserBriefSerializer(read_only=True)
    replies = serializers.SerializerMethodField()

    class Meta:
        model = ReviewComment
        fields = (
            "id",
            "parent",
            "body",
            "resolved",
            "resolved_by",
            "resolved_at",
            "mentions",
            "created_by",
            "created_at",
            "replies",
        )
        read_only_fields = ("resolved", "resolved_by", "resolved_at")

    def get_replies(self, obj):
        replies = obj.replies.filter(is_deleted=False).order_by("created_at")
        return CommentSerializer(replies, many=True, context=self.context).data


class ApprovalSerializer(serializers.ModelSerializer):
    stage = StageBriefSerializer(read_only=True)
    approver = UserBriefSerializer(read_only=True)
    requested_by = UserBriefSerializer(read_only=True)

    class Meta:
        model = Approval
        fields = (
            "id",
            "stage",
            "status",
            "approver",
            "requested_by",
            "comment",
            "decided_at",
            "order",
            "created_at",
        )


class ScheduleSerializer(serializers.ModelSerializer):
    scheduled_by = UserBriefSerializer(read_only=True)
    cancelled_by = UserBriefSerializer(read_only=True)

    class Meta:
        model = PublicationSchedule
        fields = (
            "id",
            "scheduled_for",
            "published_at",
            "status",
            "scheduled_by",
            "cancelled_by",
            "created_at",
        )


class AuditSerializer(serializers.ModelSerializer):
    actor = UserBriefSerializer(read_only=True)

    class Meta:
        model = AuditEvent
        fields = (
            "id",
            "action",
            "actor",
            "old_value",
            "new_value",
            "details",
            "ip_address",
            "created_at",
        )


class LockSerializer(serializers.ModelSerializer):
    locked_by = UserBriefSerializer(read_only=True)
    content_label = serializers.SerializerMethodField()

    class Meta:
        model = ContentLock
        fields = ("id", "content_label", "locked_by", "expires_at", "note", "created_at")

    def get_content_label(self, obj):
        return str(obj.content_object)


class WorkflowDetailSerializer(WorkflowListSerializer):
    """Full workflow: stages (state machine), approvals, schedules, lock, audit."""

    revisions = serializers.SerializerMethodField()
    approvals = serializers.SerializerMethodField()
    schedules = serializers.SerializerMethodField()
    comments = serializers.SerializerMethodField()
    audit = serializers.SerializerMethodField()
    lock = serializers.SerializerMethodField()
    stages = serializers.SerializerMethodField()

    class Meta(WorkflowListSerializer.Meta):
        fields = WorkflowListSerializer.Meta.fields + (
            "stages",
            "revisions",
            "approvals",
            "schedules",
            "comments",
            "audit",
            "lock",
        )

    def get_stages(self, obj):
        return StageBriefSerializer(WorkflowStage.objects.all(), many=True).data

    def get_revisions(self, obj):
        qs = obj.revisions.filter(is_deleted=False).order_by("-version")[:10]
        return RevisionListSerializer(qs, many=True, context=self.context).data

    def get_approvals(self, obj):
        qs = obj.approvals.filter(is_deleted=False).order_by("-created_at")[:10]
        return ApprovalSerializer(qs, many=True, context=self.context).data

    def get_schedules(self, obj):
        qs = obj.schedules.filter(is_deleted=False).order_by("-scheduled_for")[:10]
        return ScheduleSerializer(qs, many=True, context=self.context).data

    def get_comments(self, obj):
        qs = obj.comments.filter(is_deleted=False, parent__isnull=True).order_by("created_at")
        return CommentSerializer(qs, many=True, context=self.context).data

    def get_audit(self, obj):
        qs = obj.audit_events.filter(is_deleted=False).order_by("-created_at")[:15]
        return AuditSerializer(qs, many=True, context=self.context).data

    def get_lock(self, obj):
        from django.contrib.contenttypes.models import ContentType

        lock = ContentLock.objects.filter(
            content_type=ContentType.objects.get_for_model(obj.content_object),
            object_id=obj.object_id,
        ).first()
        if lock and lock.is_active:
            return LockSerializer(lock, context=self.context).data
        return None


class TransitionSerializer(serializers.Serializer):
    to_stage = serializers.CharField()
    comment = serializers.CharField(required=False, allow_blank=True)
    assignee_id = serializers.IntegerField(required=False, allow_null=True)


class ScheduleInSerializer(serializers.Serializer):
    scheduled_for = serializers.DateTimeField()


class PublishInSerializer(serializers.Serializer):
    soft = serializers.BooleanField(default=False)


class DecideSerializer(serializers.Serializer):
    approved = serializers.BooleanField()
    comment = serializers.CharField(required=False, allow_blank=True)


class CommentInSerializer(serializers.Serializer):
    body = serializers.CharField()
    parent = serializers.IntegerField(required=False, allow_null=True)
    mentions = serializers.ListField(child=serializers.IntegerField(), required=False, default=list)


class LockInSerializer(serializers.Serializer):
    content_type = serializers.CharField(help_text='e.g. "articles.article" or "articles.Article"')
    object_id = serializers.IntegerField()
    note = serializers.CharField(required=False, allow_blank=True)
