"""Services API viewsets.

Public read access to published services and service sections. Mutations are
excluded on purpose — the CMS admin remains the write surface.
"""
from django.db.models import Count, Q
from rest_framework import mixins, viewsets
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.accounts.api.permissions import IsStaffOrReadOnly
from apps.services.models import Service, ServiceSection
from config.api.base.viewsets import PublishableViewSet

from .filters import ServiceFilterSet
from .serializers import ServiceDetailSerializer, ServiceListSerializer, ServiceSectionSerializer


class ServiceViewSet(PublishableViewSet):
    """List/retrieve published services.

    Supports:
    - Filtering: section, section_slug, status, is_featured, is_public
    - Searching: title/description/slug (fa/en/ar)
    - Ordering: title_en, created_at, updated_at, published_at, sort_order
    - Pagination: page, page_size
    """

    queryset = Service.objects.all()
    filterset_class = ServiceFilterSet
    permission_classes = [IsStaffOrReadOnly]
    http_method_names = ("get", "head", "options")

    def get_serializer_class(self):
        if self.action == "list":
            return ServiceListSerializer
        if self.action in ("retrieve",):
            return ServiceDetailSerializer
        return ServiceListSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        return qs.select_related("section", "cover_image").filter(is_active=True)


class ServiceSectionViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """Public read-only access to service sections (with published count)."""

    serializer_class = ServiceSectionSerializer
    permission_classes = [AllowAny]
    pagination_class = None

    def get_queryset(self):
        return (
            ServiceSection.objects.filter(is_active=True)
            .annotate(
                services_count=Count(
                    "services",
                    filter=Q(services__status="published", services__is_active=True),
                )
            )
            .order_by("sort_order", "title_en")
        )

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({"success": True, "message": "", "data": serializer.data, "errors": None})

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({"success": True, "message": "", "data": serializer.data, "errors": None})
