"""Editorial API viewsets.

All endpoints require authentication and are gated by the platform ACL
(editorial.view / manage / approve / review / schedule). The response envelope
follows the standard Hanahoush format.
"""
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from config.api.base.pagination import DefaultPagination

from .. import permissions as perms
from ..models import (
    AuditEvent,
    ContentLock,
    ContentWorkflow,
    PublicationSchedule,
)
from ..services import (
    ApprovalService,
    CommentService,
    LockService,
    RevisionService,
    WorkflowError,
    WorkflowService,
)
from .serializers import (
    ApprovalSerializer,
    AuditSerializer,
    CommentInSerializer,
    CommentSerializer,
    DecideSerializer,
    LockInSerializer,
    LockSerializer,
    PublishInSerializer,
    RevisionListSerializer,
    RevisionSerializer,
    ScheduleInSerializer,
    ScheduleSerializer,
    TransitionSerializer,
    WorkflowDetailSerializer,
    WorkflowListSerializer,
)


def _client_ip(request) -> str | None:
    return getattr(request, "META", {}).get("REMOTE_ADDR")


def _require_perm(user, checker, message="You do not have permission to perform this action."):
    if not checker(user):
        raise PermissionDenied(message)


def _resolve_content_type(label: str) -> ContentType:
    if "." in label:
        app_label, model = label.split(".")
        try:
            return ContentType.objects.get(app_label=app_label, model=model.lower())
        except ContentType.DoesNotExist:
            pass
    try:
        return ContentType.objects.get(model=label.lower())
    except ContentType.DoesNotExist as exc:
        raise NotFound("Unknown content type.") from exc


def _get_content_object(ct: ContentType, object_id: int):
    model = ct.model_class()
    if model is None:
        raise NotFound("Content type has no model.")
    return model.objects.filter(pk=object_id).first()


def _error(exc: Exception) -> Response:
    from ..readiness import PublicationBlocked

    if isinstance(exc, PublicationBlocked):
        return Response(
            {
                "success": False,
                "message": "Publication blocked by critical health issues.",
                "data": None,
                "errors": {
                    "code": ["PUBLICATION_BLOCKED"],
                    "blocking": [
                        {"field": b.get("field"), "locale": b.get("locale"), "message": b.get("message")}
                        for b in exc.blocking
                    ],
                },
            },
            status=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )
    return Response(
        {"success": False, "message": str(exc), "data": None, "errors": {"workflow": [str(exc)]}},
        status=status.HTTP_400_BAD_REQUEST,
    )


def _detail(workflow, request) -> Response:
    serializer = WorkflowDetailSerializer(workflow, context={"request": request})
    return Response({"success": True, "message": "", "data": serializer.data, "errors": None})


def _unresolved_failure_map():
    """workflow_id → timestamp of the latest *unresolved* ``publish.failed``.

    A failure clears on the next successful ``workflow.publish`` for the same
    workflow, so a fixed-and-retried item stops being actionable. Two grouped
    ``MAX`` queries — no per-row cost.
    """
    from django.db.models import Max

    failed = dict(
        AuditEvent.objects.filter(action="publish.failed", is_deleted=False)
        .values("workflow_id")
        .annotate(at=Max("created_at"))
        .values_list("workflow_id", "at")
    )
    published = dict(
        AuditEvent.objects.filter(action="workflow.publish", is_deleted=False)
        .values("workflow_id")
        .annotate(at=Max("created_at"))
        .values_list("workflow_id", "at")
    )
    return {
        wid: at
        for wid, at in failed.items()
        if wid is not None and (wid not in published or at > published[wid])
    }


def _failed_schedule_ids():
    """Scheduled rows whose workflow has an unresolved failed publication."""
    unresolved = _unresolved_failure_map()
    if not unresolved:
        return []
    return list(
        PublicationSchedule.objects.filter(
            workflow_id__in=list(unresolved), status="scheduled", is_deleted=False
        ).values_list("pk", flat=True)
    )


def _annotate_failures(qs):
    """Per-row failure state in one query: latest failed/published timestamps
    plus the latest failure details, so the serializer never queries per row."""
    from django.db.models import Max, OuterRef, Q, Subquery

    failed_events = AuditEvent.objects.filter(
        workflow=OuterRef("workflow"), action="publish.failed", is_deleted=False
    ).order_by("-created_at")
    return qs.annotate(
        last_failed_at=Max(
            "workflow__audit_events__created_at",
            filter=Q(workflow__audit_events__action="publish.failed"),
        ),
        last_failed_details=Subquery(failed_events.values("details")[:1]),
        last_published_at=Max(
            "workflow__audit_events__created_at",
            filter=Q(workflow__audit_events__action="workflow.publish"),
        ),
    )





def _attention_ids(now):
    """IDs of scheduled rows needing action: overdue, failed publication,
    or blocking health on the current content. Blocking-health uses the same
    ``blocking_issues`` gate as schedule/publish, so the server stays
    authoritative."""
    from ..readiness import blocking_issues

    ids = set(
        PublicationSchedule.objects.filter(
            status="scheduled", scheduled_for__lt=now, is_deleted=False
        ).values_list("pk", flat=True)
    )
    ids.update(_failed_schedule_ids())
    rows = (
        PublicationSchedule.objects.filter(status="scheduled", is_deleted=False)
        .select_related("workflow", "workflow__content_type")
        .exclude(pk__in=ids)
    )
    for schedule in rows:
        try:
            content = schedule.workflow.content_object
        except Exception:  # noqa: BLE001
            content = None
        if content is not None and blocking_issues(content):
            ids.add(schedule.pk)
    return list(ids)


class WorkflowViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """Editorial workflows attached to any content object."""

    serializer_class = WorkflowListSerializer
    permission_classes = [IsAuthenticated]
    queryset = ContentWorkflow.objects.filter(is_deleted=False).select_related(
        "stage", "content_type"
    )
    # `content_type` is handled as a label ("articles.article") in get_queryset,
    # so it must NOT be declared here as an FK filterset field (DjangoFilter
    # would reject the label as an invalid primary key with a 400).
    filterset_fields = ["stage", "object_id"]
    ordering_fields = ["created_at", "updated_at", "version"]
    ordering = ["-updated_at"]

    def get_serializer_class(self):
        return WorkflowDetailSerializer if self.action == "retrieve" else WorkflowListSerializer

    def get_queryset(self):
        _require_perm(self.request.user, perms.can_view)
        qs = super().get_queryset()
        ct_label = self.request.query_params.get("content_type")
        if ct_label:
            qs = qs.filter(content_type=_resolve_content_type(ct_label))
        return qs

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx

    def retrieve(self, request, *args, **kwargs):
        """Workflow detail uses the standard envelope (like every other
        endpoint) so the frontend client can unwrap `data.data`."""
        workflow = self.get_object()
        return _detail(workflow, request)

    # -- workflow creation ----------------------------------------------
    @action(detail=False, methods=["post"], url_path="ensure")
    def ensure(self, request, pk=None):
        """Return the workflow for a content object, creating it if absent.

        Additive helper for the staff workspace: content created through the
        CMS may not have a workflow yet; this lazily attaches the standard
        draft workflow so the editorial pipeline (submit/review/approve/
        schedule/publish) can run without leaving the API.
        """
        _require_perm(request.user, perms.can_manage)
        serializer = LockInSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ct = _resolve_content_type(serializer.validated_data["content_type"])
        obj = _get_content_object(ct, serializer.validated_data["object_id"])
        if obj is None:
            raise NotFound("Content object not found.")
        workflow = WorkflowService.get_or_create(obj)
        return _detail(workflow, request)

    # -- workflow transitions -------------------------------------------
    @action(detail=True, methods=["post"], url_path="transition")
    def transition(self, request, pk=None):
        _require_perm(request.user, perms.can_manage)
        workflow = self.get_object()
        serializer = TransitionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            WorkflowService.transition(
                workflow,
                serializer.validated_data["to_stage"],
                request.user,
                ip=_client_ip(request),
                comment=serializer.validated_data.get("comment", ""),
                assignee_id=serializer.validated_data.get("assignee_id"),
            )
        except WorkflowError as exc:
            return _error(exc)
        return _detail(workflow, request)

    @action(detail=True, methods=["post"], url_path="submit-review")
    def submit_review(self, request, pk=None):
        _require_perm(request.user, perms.can_manage)
        workflow = self.get_object()
        try:
            WorkflowService.submit_for_review(
                workflow,
                request.user,
                ip=_client_ip(request),
                comment=request.data.get("comment", ""),
                reviewer_id=request.data.get("reviewer_id"),
            )
        except WorkflowError as exc:
            return _error(exc)
        return _detail(workflow, request)

    @action(detail=True, methods=["post"], url_path="publish")
    def publish(self, request, pk=None):
        _require_perm(request.user, lambda u: perms.can_manage(u) or perms.can_schedule(u))
        workflow = self.get_object()
        serializer = PublishInSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            WorkflowService.publish(
                workflow,
                request.user,
                ip=_client_ip(request),
                soft=serializer.validated_data["soft"],
            )
        except Exception as exc:  # WorkflowError + PublicationBlocked → structured error
            return _error(exc)
        return _detail(workflow, request)

    @action(detail=True, methods=["post"], url_path="archive")
    def archive(self, request, pk=None):
        _require_perm(request.user, lambda u: perms.can_manage(u) or perms.can_schedule(u))
        workflow = self.get_object()
        try:
            WorkflowService.archive(workflow, request.user, ip=_client_ip(request))
        except WorkflowError as exc:
            return _error(exc)
        return _detail(workflow, request)

    @action(detail=True, methods=["post"], url_path="reopen")
    def reopen(self, request, pk=None):
        _require_perm(request.user, lambda u: perms.can_manage(u) or perms.can_schedule(u))
        workflow = self.get_object()
        try:
            WorkflowService.reopen(workflow, request.user, ip=_client_ip(request))
        except WorkflowError as exc:
            return _error(exc)
        return _detail(workflow, request)

    # -- revisions -------------------------------------------------------
    @action(detail=True, methods=["get"], url_path="revisions")
    def revisions(self, request, pk=None):
        workflow = self.get_object()
        qs = workflow.revisions.filter(is_deleted=False).order_by("-version")
        serializer = RevisionListSerializer(qs, many=True, context=self.get_serializer_context())
        return Response({"success": True, "message": "", "data": serializer.data, "errors": None})

    @action(detail=True, methods=["get"], url_path=r"revisions/(?P<revision_id>[0-9]+)")
    def revision_detail(self, request, pk=None, revision_id=None):
        workflow = self.get_object()
        revision = workflow.revisions.filter(pk=revision_id, is_deleted=False).first()
        if revision is None:
            raise NotFound("Revision not found.")
        serializer = RevisionSerializer(revision, context=self.get_serializer_context())
        return Response({"success": True, "message": "", "data": serializer.data, "errors": None})

    @action(detail=True, methods=["get"], url_path="diff")
    def diff(self, request, pk=None):
        workflow = self.get_object()
        try:
            data = RevisionService.diff(
                workflow,
                int(request.query_params.get("from")),
                int(request.query_params.get("to")),
            )
        except (WorkflowError, ValueError, TypeError) as exc:
            return _error(exc)
        return Response({"success": True, "message": "", "data": data, "errors": None})

    @action(detail=True, methods=["post"], url_path=r"revisions/(?P<revision_id>[0-9]+)/rollback")
    def rollback(self, request, pk=None, revision_id=None):
        _require_perm(request.user, perms.can_manage)
        workflow = self.get_object()
        revision = workflow.revisions.filter(pk=revision_id, is_deleted=False).first()
        if revision is None:
            raise NotFound("Revision not found.")
        try:
            RevisionService.rollback(workflow, revision, request.user, ip=_client_ip(request))
        except WorkflowError as exc:
            return _error(exc)
        return _detail(workflow, request)

    # -- comments --------------------------------------------------------
    @action(detail=True, methods=["get", "post"], url_path="comments")
    def comments(self, request, pk=None):
        workflow = self.get_object()
        if request.method == "GET":
            qs = workflow.comments.filter(
                is_deleted=False,
                parent__isnull=True,
            ).order_by("created_at")
            serializer = CommentSerializer(qs, many=True, context=self.get_serializer_context())
            return Response(
                {"success": True, "message": "", "data": serializer.data, "errors": None}
            )
        _require_perm(request.user, lambda u: perms.can_review(u) or perms.can_manage(u))
        serializer = CommentInSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        parent = workflow.comments.filter(pk=serializer.validated_data.get("parent")).first()
        comment = CommentService.add(
            workflow,
            request.user,
            serializer.validated_data["body"],
            parent=parent,
            mentions=serializer.validated_data.get("mentions", []),
            ip=_client_ip(request),
        )
        return Response(
            {"success": True, "message": "", "data": {"id": comment.pk}, "errors": None},
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"], url_path=r"comments/(?P<comment_id>[0-9]+)/resolve")
    def comment_resolve(self, request, pk=None, comment_id=None):
        _require_perm(request.user, lambda u: perms.can_review(u) or perms.can_manage(u))
        workflow = self.get_object()
        comment = workflow.comments.filter(pk=comment_id).first()
        if comment is None:
            raise NotFound("Comment not found.")
        CommentService.resolve(comment, request.user, ip=_client_ip(request))
        return Response(
            {
                "success": True,
                "message": "Comment resolved",
                "data": {"id": comment.pk},
                "errors": None,
            }
        )

    # -- approvals -------------------------------------------------------
    @action(detail=True, methods=["get"], url_path="approvals")
    def approvals(self, request, pk=None):
        workflow = self.get_object()
        qs = workflow.approvals.filter(is_deleted=False).order_by("order", "created_at")
        serializer = ApprovalSerializer(qs, many=True, context=self.get_serializer_context())
        return Response({"success": True, "message": "", "data": serializer.data, "errors": None})

    @action(detail=True, methods=["post"], url_path=r"approvals/(?P<approval_id>[0-9]+)/decide")
    def approval_decide(self, request, pk=None, approval_id=None):
        _require_perm(request.user, perms.can_approve)
        workflow = self.get_object()
        approval = workflow.approvals.filter(pk=approval_id, is_deleted=False).first()
        if approval is None:
            raise NotFound("Approval not found.")
        serializer = DecideSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            ApprovalService.decide(
                approval,
                request.user,
                approved=serializer.validated_data["approved"],
                comment=serializer.validated_data.get("comment", ""),
                ip=_client_ip(request),
            )
        except WorkflowError as exc:
            return _error(exc)
        out = ApprovalSerializer(approval, context=self.get_serializer_context())
        return Response(
            {"success": True, "message": "Approval decided", "data": out.data, "errors": None}
        )

    # -- scheduling ------------------------------------------------------
    @action(detail=True, methods=["post"], url_path="schedule")
    def schedule(self, request, pk=None):
        _require_perm(request.user, lambda u: perms.can_schedule(u) or perms.can_manage(u))
        workflow = self.get_object()
        serializer = ScheduleInSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            sched = WorkflowService.schedule(
                workflow,
                serializer.validated_data["scheduled_for"],
                request.user,
                ip=_client_ip(request),
            )
        except Exception as exc:  # WorkflowError + PublicationBlocked → structured error
            return _error(exc)
        return Response(
            {
                "success": True,
                "message": "Scheduled",
                "data": ScheduleSerializer(sched).data,
                "errors": None,
            }
        )


class AuditEventViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    """Audit trail (list + filter by workflow/action/actor)."""

    serializer_class = AuditSerializer
    permission_classes = [IsAuthenticated]
    queryset = AuditEvent.objects.filter(is_deleted=False).select_related("actor", "workflow")
    filterset_fields = ["workflow", "action", "actor"]
    ordering_fields = ["created_at"]
    ordering = ["-created_at"]

    def get_queryset(self):
        _require_perm(self.request.user, perms.can_view)
        return super().get_queryset()

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx


class ContentLockViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    viewsets.GenericViewSet,
):
    """Content locks (acquire on create; release via action)."""

    serializer_class = LockSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        _require_perm(self.request.user, perms.can_view)
        return ContentLock.objects.filter(
            is_deleted=False,
            expires_at__gt=timezone.now(),
        ).select_related(
            "locked_by",
            "content_type",
        )

    def create(self, request, *args, **kwargs):
        _require_perm(request.user, perms.can_manage)
        serializer = LockInSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ct = _resolve_content_type(serializer.validated_data["content_type"])
        obj = _get_content_object(ct, serializer.validated_data["object_id"])
        if obj is None:
            raise NotFound("Content object not found.")
        try:
            lock = LockService.acquire(
                obj,
                request.user,
                ip=_client_ip(request),
                note=serializer.validated_data.get("note", ""),
            )
        except WorkflowError as exc:
            return _error(exc)
        return Response(
            {
                "success": True,
                "message": "Lock acquired",
                "data": LockSerializer(lock).data,
                "errors": None,
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"], url_path="release")
    def release(self, request, pk=None):
        _require_perm(request.user, perms.can_manage)
        lock = self.get_object()
        obj = lock.content_object
        if obj is None:
            raise NotFound("Locked object not found.")
        try:
            LockService.release(obj, request.user, ip=_client_ip(request))
        except WorkflowError as exc:
            return _error(exc)
        return Response(
            {
                "success": True,
                "message": "Lock released",
                "data": {"id": lock.pk},
                "errors": None,
            }
        )


class ScheduleViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    """All publication schedules (calendar view).

    Server-side buckets (Phase 18): ``upcoming`` / ``today`` / ``overdue`` /
    ``attention`` / ``published`` / ``cancelled`` / ``done``. ``attention`` is
    the actionable set: overdue OR failed-publication OR blocking-health
    items. List is paginated with the project-default pagination; use
    ``GET /schedules/counts/`` for header badges without fetching rows.
    """

    serializer_class = ScheduleSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = DefaultPagination
    filterset_fields = ["status", "workflow"]
    ordering_fields = ["scheduled_for", "created_at"]
    ordering = ["scheduled_for"]

    def list(self, request, *args, **kwargs):
        """Paginated schedule list using the project-default pagination."""
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response({"success": True, "message": "", "data": serializer.data, "errors": None})

    def get_queryset(self):
        from django.utils import timezone as _tz

        _require_perm(self.request.user, perms.can_view)
        qs = PublicationSchedule.objects.filter(is_deleted=False).select_related(
            "scheduled_by", "cancelled_by", "workflow", "workflow__stage", "workflow__content_type"
        )
        qs = _annotate_failures(qs)
        bucket = self.request.query_params.get("bucket")
        now = _tz.now()
        if bucket == "upcoming":
            qs = qs.filter(status="scheduled", scheduled_for__gte=now)
        elif bucket == "overdue":
            qs = qs.filter(status="scheduled", scheduled_for__lt=now)
        elif bucket == "today":
            start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            end = start + _tz.timedelta(days=1)
            qs = qs.filter(scheduled_for__gte=start, scheduled_for__lt=end)
        elif bucket == "published":
            qs = qs.filter(status="published")
        elif bucket == "cancelled":
            qs = qs.filter(status="cancelled")
        elif bucket == "done":
            qs = qs.filter(status__in=["published", "cancelled"])
        elif bucket == "attention":
            qs = qs.filter(pk__in=_attention_ids(now))
        return qs

    @action(detail=False, methods=["get"], url_path="counts")
    def counts(self, request):
        """Lightweight header counts for the timeline (no row payload)."""
        from django.utils import timezone as _tz

        _require_perm(request.user, perms.can_view)
        now = _tz.now()
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end = start + _tz.timedelta(days=1)
        base = PublicationSchedule.objects.filter(is_deleted=False)
        scheduled = base.filter(status="scheduled")
        failed_ids = _failed_schedule_ids()
        data = {
            "total": base.count(),
            "scheduled": scheduled.count(),
            "upcoming": scheduled.filter(scheduled_for__gte=now).count(),
            "overdue": scheduled.filter(scheduled_for__lt=now).count(),
            "today": base.filter(scheduled_for__gte=start, scheduled_for__lt=end).count(),
            "attention": len(_attention_ids(now)),
            "published": base.filter(status="published").count(),
            "cancelled": base.filter(status="cancelled").count(),
            "failed": scheduled.filter(pk__in=failed_ids).count(),
        }
        return Response({"success": True, "message": "", "data": data, "errors": None})

    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel(self, request, pk=None):
        from ..services import ScheduleService

        _require_perm(request.user, lambda u: perms.can_schedule(u) or perms.can_manage(u))
        schedule = self.get_object()
        try:
            sched = ScheduleService.cancel(schedule, request.user, ip=_client_ip(request))
        except WorkflowError as exc:
            return _error(exc)
        return Response(
            {"success": True, "message": "Cancelled", "data": ScheduleSerializer(sched).data, "errors": None}
        )

    @action(detail=True, methods=["post"], url_path="reschedule")
    def reschedule(self, request, pk=None):
        from ..services import ScheduleService

        _require_perm(request.user, lambda u: perms.can_schedule(u) or perms.can_manage(u))
        schedule = self.get_object()
        serializer = ScheduleInSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            sched = ScheduleService.reschedule(
                schedule, serializer.validated_data["scheduled_for"], request.user, ip=_client_ip(request)
            )
        except WorkflowError as exc:
            return _error(exc)
        return Response(
            {"success": True, "message": "Rescheduled", "data": ScheduleSerializer(sched).data, "errors": None}
        )

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx
