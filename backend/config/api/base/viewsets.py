"""Base viewset classes for the Hanahoush API.

Provides a complete CRUD viewset with consistent behavior,
pagination, filtering, ordering, search, and standardized responses.
"""
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response

from apps.core.models import Status

from .filters import BaseFilterSet, PublishableFilterSet
from .ordering import DefaultOrderingFilter, MultiFieldSearchFilter
from .pagination import DefaultPagination


def no_versioning(view):
    """Disable URL versioning on a ``@api_view`` function view.

    Versioning is expressed in the URL path (``/api/v1/...``), so every
    endpoint disables DRF's ``NamespaceVersioning`` on the view class. This
    keeps drf-spectacular schema generation working (NamespaceVersioning has
    no ``default_version``, which would otherwise make the schema generator
    skip the endpoint entirely). Mirrors ``versioning_class = None`` on
    ``BaseViewSet`` subclasses.
    """
    if hasattr(view, "cls"):
        view.cls.versioning_class = None
    return view


class BaseViewSet(viewsets.ModelViewSet):
    """Base viewset with enterprise-grade defaults.

    Features:
    - Standard pagination (DefaultPagination)
    - Filtering (django-filter)
    - Ordering (DefaultOrderingFilter)
    - Search (MultiFieldSearchFilter)
    - Consistent response format
    - Soft-delete awareness (excludes is_deleted by default)
    """

    pagination_class = DefaultPagination
    filterset_class = BaseFilterSet
    filter_backends = (DjangoFilterBackend, DefaultOrderingFilter, MultiFieldSearchFilter)

    # Versioning is expressed in the URL path (/api/v1/...). Disabling DRF's
    # NamespaceVersioning on the view keeps drf-spectacular schema generation
    # working (NamespaceVersioning has no default_version, which would make
    # the schema generator skip every endpoint).
    versioning_class = None

    # Override in subclasses
    ordering_fields = []
    ordering = ["-created_at"]
    search_fields = []

    # Soft-delete handling
    include_deleted = False

    def get_queryset(self):
        qs = super().get_queryset()
        if not self.include_deleted and hasattr(qs.model, "is_deleted"):
            # "restore" must be able to find soft-deleted objects.
            if self.action != "restore":
                qs = qs.filter(is_deleted=False)
        return qs

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx

    def list(self, request: Request, *args, **kwargs):
        """List objects with pagination, filtering, ordering, search."""
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return self.build_response(data=serializer.data)

    def retrieve(self, request: Request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return self.build_response(data=serializer.data)

    def create(self, request: Request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return self.build_response(
            data=serializer.data,
            message="Created successfully",
            status_code=status.HTTP_201_CREATED,
        )

    def update(self, request: Request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return self.build_response(data=serializer.data, message="Updated successfully")

    def partial_update(self, request: Request, *args, **kwargs):
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)

    def destroy(self, request: Request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return self.build_response(message="Deleted successfully", status_code=status.HTTP_204_NO_CONTENT)

    # Soft-delete support
    @action(detail=True, methods=["post"], url_path="soft-delete")
    def soft_delete(self, request, pk=None):
        instance = self.get_object()
        if hasattr(instance, "soft_delete"):
            instance.soft_delete()
            return self.build_response(message="Soft deleted successfully")
        return self.build_error("Soft delete not supported", status_code=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"], url_path="restore")
    def restore(self, request, pk=None):
        instance = self.get_object()
        if hasattr(instance, "restore"):
            instance.restore()
            return self.build_response(message="Restored successfully")
        return self.build_error("Restore not supported", status_code=status.HTTP_400_BAD_REQUEST)

    # Response helpers
    def build_response(self, data=None, message="", status_code=status.HTTP_200_OK, pagination=None):
        """Build standardized success response."""
        response_data = {
            "success": True,
            "message": message,
            "data": data,
            "errors": None,
        }
        if pagination:
            response_data["pagination"] = pagination
        return Response(response_data, status=status_code)

    def build_error(self, message, status_code=status.HTTP_400_BAD_REQUEST, errors=None):
        """Build standardized error response."""
        return Response(
            {
                "success": False,
                "message": message,
                "data": None,
                "errors": errors,
            },
            status=status_code,
        )

    def get_paginated_response(self, data):
        """Return paginated response in standard format (handled by pagination class)."""
        return super().get_paginated_response(data)


class PublishableViewSet(BaseViewSet):
    """ViewSet for publishable entities with publishable-specific filters."""

    filterset_class = PublishableFilterSet
    ordering_fields = ["title_en", "created_at", "updated_at", "published_at", "sort_order"]
    ordering = ["-published_at", "-created_at"]
    search_fields = ["title_en", "title_fa", "title_ar", "description_en", "description_fa", "description_ar"]

    def get_queryset(self):
        qs = super().get_queryset()
        # Draft protection: only staff may see non-published content. Every
        # other caller (anonymous or authenticated non-staff) is restricted to
        # published + public records regardless of any `?status=` parameter,
        # so drafts/archives/reviews never leak through the filtersets.
        user = getattr(self.request, "user", None)
        can_view_unpublished = bool(user and user.is_authenticated and user.is_staff)
        if not can_view_unpublished:
            qs = qs.filter(status=Status.PUBLISHED, is_public=True)
        return qs
