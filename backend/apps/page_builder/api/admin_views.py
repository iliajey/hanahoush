"""Newsletter admin API (staff-only).

Operational subscriber management: search, filter (locale / status / date),
activate/deactivate and a safe CSV export. Privacy rules:

- Only staff (``IsAdminUser``) may access ANY of these endpoints.
- The one-click ``unsubscribe_token`` is never exposed.
- No public surface lists or enumerates subscribers.
"""
import csv

import django_filters
from django.db.models import Q
from django.http import HttpResponse
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAdminUser
from rest_framework.request import Request
from rest_framework.response import Response

from config.api.base.filters import BaseFilterSet
from config.api.base.viewsets import BaseViewSet

from ..models import NewsletterSubscription
from .serializers import NewsletterSubscriptionAdminSerializer

LOCALE_CHOICES = [
    ("fa", "Persian"),
    ("en", "English"),
    ("ar", "Arabic"),
]


class NewsletterFilterSet(BaseFilterSet):
    """Staff filters for the subscriber list."""

    locale = django_filters.ChoiceFilter(choices=LOCALE_CHOICES)
    is_active = django_filters.BooleanFilter()

    def filter_search(self, queryset, name, value):
        return queryset.filter(Q(email__icontains=value) | Q(source__icontains=value))

    class Meta:
        fields = ("locale", "is_active", "created_after", "created_before")


class NewsletterSubscriptionViewSet(BaseViewSet):
    """Staff-only subscriber management (list/search/filter/export/state)."""

    serializer_class = NewsletterSubscriptionAdminSerializer
    permission_classes = [IsAdminUser]
    queryset = NewsletterSubscription.objects.filter(is_deleted=False)
    filterset_class = NewsletterFilterSet
    search_fields = ["email", "source"]
    ordering_fields = ["created_at", "updated_at", "email", "locale"]
    ordering = ["-created_at"]
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)

    def create(self, request, *args, **kwargs):
        # Subscribers are created by the public subscribe endpoint only.
        return Response(
            {
                "success": False,
                "message": "Subscribers are created via the public subscribe endpoint.",
                "data": None,
                "errors": None,
            },
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    @action(detail=True, methods=["post"], url_path="deactivate")
    def deactivate(self, request: Request, pk=None):
        """Unsubscribe a subscriber (respects the unsubscribe state)."""
        subscriber = self.get_object()
        was_active = subscriber.is_active
        subscriber.unsubscribe()
        return Response(
            {
                "success": True,
                "message": "Subscriber deactivated." if was_active else "Already inactive.",
                "data": {"id": subscriber.pk, "is_active": False},
                "errors": None,
            }
        )

    @action(detail=True, methods=["post"], url_path="activate")
    def activate(self, request: Request, pk=None):
        """Re-activate a subscriber (clears the unsubscribe timestamp)."""
        subscriber = self.get_object()
        subscriber.is_active = True
        subscriber.unsubscribed_at = None
        subscriber.save(update_fields=["is_active", "unsubscribed_at", "updated_at"])
        return Response(
            {
                "success": True,
                "message": "Subscriber activated.",
                "data": {"id": subscriber.pk, "is_active": True},
                "errors": None,
            }
        )

    @extend_schema(
        responses={200: OpenApiResponse(description="CSV export of subscribers (staff only).")},
        description="Stream a CSV export. Staff only; never returns the unsubscribe token.",
    )
    @action(detail=False, methods=["get"], url_path="export")
    def export(self, request: Request):
        """Stream a safe CSV export of the current filtered subscriber set."""
        queryset = self.filter_queryset(self.get_queryset()).order_by("-created_at")
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="newsletter-subscribers.csv"'
        writer = csv.writer(response)
        writer.writerow(["email", "locale", "source", "is_active", "unsubscribed_at", "created_at"])
        for sub in queryset:
            writer.writerow(
                [
                    sub.email,
                    sub.locale,
                    sub.source,
                    "1" if sub.is_active else "0",
                    sub.unsubscribed_at.isoformat() if sub.unsubscribed_at else "",
                    sub.created_at.isoformat() if sub.created_at else "",
                ]
            )
        return response
