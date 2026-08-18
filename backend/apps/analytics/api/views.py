"""Contact/inquiry + analytics ingestion API views.

- ``POST /api/v1/contact/``      — public submission (throttled, honeypot).
- ``GET/PATCH /api/v1/admin/contact/`` — staff-only management (no enumeration
  for visitors; no private data leak).
- ``POST /api/v1/analytics/events/`` — public, throttled event ingestion
  (persists the platform analytics stream; batch supported).
"""
import uuid

from django.utils import timezone
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle, ScopedRateThrottle
from rest_framework.views import APIView

from apps.analytics.models import AnalyticsEvent, ContactRequest
from config.api.base.viewsets import BaseViewSet

from .filters import ContactRequestFilterSet
from .serializers import (
    AnalyticsEventInSerializer,
    ContactAdminSerializer,
    ContactStatusUpdateSerializer,
    ContactSubmitSerializer,
)

MAX_EVENTS_PER_BATCH = 50


class ContactRateThrottle(AnonRateThrottle):
    scope = "contact"


class AnalyticsRateThrottle(ScopedRateThrottle):
    """Per-IP / per-user cap on analytics ingestion (scope: ``analytics``)."""

    scope = "analytics"


@extend_schema(
    request=ContactSubmitSerializer,
    responses={
        201: OpenApiResponse(description="Contact request received (request_id returned)."),
        400: OpenApiResponse(description="Validation error."),
        429: OpenApiResponse(description="Too many requests."),
    },
    tags=["contact"],
)
class ContactSubmitView(APIView):
    """Accept a public contact submission.

    Throttled per IP; a honeypot ``website`` field silently flags spam without
    revealing the decision. The visitor only ever receives a request id.
    """

    permission_classes = [AllowAny]
    throttle_classes = [ContactRateThrottle]
    versioning_class = None  # versioning lives in the URL path (/api/v1/)

    def post(self, request: Request) -> Response:
        serializer = ContactSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        contact = ContactRequest.objects.create(
            name=data["name"],
            email=data["email"].strip().lower(),
            phone=data.get("phone", ""),
            company=data.get("company", ""),
            subject=data.get("subject", ""),
            service_category=data.get("service_category", ""),
            project_type=data.get("project_type", ""),
            budget_range=data.get("budget_range", ""),
            preferred_contact=data.get("preferred_contact", "any"),
            message=data["message"],
            consent=data["consent"],
            locale=data.get("locale", "en"),
            source=data.get("source", ""),
            website=data.get("website", ""),
            status="spam" if data.get("website") else "new",
            request_id=uuid.uuid4(),
        )
        return Response(
            {
                "success": True,
                "message": "Contact request received.",
                "data": {"request_id": str(contact.request_id), "status": contact.status},
                "errors": None,
            },
            status=status.HTTP_201_CREATED,
        )


class ContactAdminViewSet(BaseViewSet):
    """Staff-only management of contact requests."""

    serializer_class = ContactAdminSerializer
    permission_classes = [IsAdminUser]
    queryset = ContactRequest.objects.filter(is_deleted=False).select_related("handled_by")
    filterset_class = ContactRequestFilterSet
    search_fields = ["name", "email", "subject", "message", "company"]
    ordering_fields = ["created_at", "status"]
    ordering = ["-created_at"]
    http_method_names = ["get", "patch", "post", "head", "options"]

    def get_serializer_class(self):
        if self.action == "partial_update":
            return ContactStatusUpdateSerializer
        return ContactAdminSerializer

    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)

    def partial_update(self, request, *args, **kwargs):
        """Update status, record the handler, and return the full record."""
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        if instance.status in ("in_progress", "resolved", "closed"):
            instance.handled_by = self.request.user
            instance.save(update_fields=["handled_by", "updated_at"])
        out = ContactAdminSerializer(instance, context=self.get_serializer_context()).data
        return self.build_response(data=out, message="Updated successfully")

    @action(detail=True, methods=["post"], url_path="mark-handled")
    def mark_handled(self, request, pk=None):
        contact = self.get_object()
        contact.mark_handled(request.user)
        return Response(
            {
                "success": True,
                "message": "Marked in progress",
                "data": {"id": contact.pk},
                "errors": None,
            }
        )


def _client_ip(request) -> str | None:
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


@extend_schema(
    request=AnalyticsEventInSerializer,
    responses={
        202: OpenApiResponse(description="Events accepted for recording."),
        400: OpenApiResponse(description="Invalid payload / batch too large."),
        429: OpenApiResponse(description="Too many requests."),
    },
    tags=["analytics"],
)
class AnalyticsEventIngestView(APIView):
    """Persist analytics events (single or batched) without blocking the client.

    Throttled per IP/user. Invalid events within a batch are dropped and the
    accepted count returned; a fully invalid payload returns 400.
    """

    permission_classes = [AllowAny]
    throttle_classes = [AnalyticsRateThrottle]
    versioning_class = None  # versioning lives in the URL path (/api/v1/)

    def post(self, request: Request) -> Response:
        payload = request.data
        if isinstance(payload, dict) and isinstance(payload.get("events"), list):
            raw_events = payload["events"]
        elif isinstance(payload, list):
            raw_events = payload
        elif isinstance(payload, dict):
            raw_events = [payload]
        else:
            return Response(
                {"success": False, "message": "Invalid payload.", "data": None, "errors": None},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not raw_events or len(raw_events) > MAX_EVENTS_PER_BATCH:
            return Response(
                {"success": False, "message": "Batch size out of range.", "data": None, "errors": None},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = request.user if request.user.is_authenticated else None
        user_agent = (request.META.get("HTTP_USER_AGENT") or "")[:2000]
        ip = _client_ip(request)

        rows = []
        invalid = 0
        for raw in raw_events:
            if not isinstance(raw, dict):
                invalid += 1
                continue
            serializer = AnalyticsEventInSerializer(data=raw)
            if not serializer.is_valid():
                invalid += 1
                continue
            data = serializer.validated_data
            rows.append(
                AnalyticsEvent(
                    event_name=data["event_name"],
                    timestamp=data.get("timestamp") or timezone.now(),
                    session_key=data.get("session_key", "")[:255],
                    client_id=data.get("client_id", "")[:255],
                    user=user,
                    locale=data.get("locale", "")[:5],
                    path=data.get("path", "")[:500],
                    referrer=data.get("referrer", ""),
                    metadata=data.get("metadata") or {},
                    request_id=getattr(request, "request_id", "")[:64],
                    user_agent=data.get("user_agent") or user_agent,
                    ip_address=ip,
                )
            )

        if not rows:
            return Response(
                {"success": False, "message": "Invalid event payload.", "data": None, "errors": None},
                status=status.HTTP_400_BAD_REQUEST,
            )

        AnalyticsEvent.objects.bulk_create(rows)
        return Response(
            {
                "success": True,
                "message": "Events recorded.",
                "data": {"accepted": len(rows), "dropped": invalid},
                "errors": None,
                "request_id": getattr(request, "request_id", None),
            },
            status=status.HTTP_202_ACCEPTED,
        )
