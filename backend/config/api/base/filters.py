"""Base filter classes for the Hanahoush API.

Provides reusable filter sets with consistent behavior across all endpoints.
"""
import django_filters
from django.db.models import Q

from apps.core.models import Status


class BaseFilterSet(django_filters.FilterSet):
    """Base filter set with common filters.

    Includes:
    - is_active / is_deleted for soft-delete awareness
    - created_at / updated_at range filters
    - search across text fields
    """

    is_active = django_filters.BooleanFilter()
    is_deleted = django_filters.BooleanFilter()
    created_after = django_filters.DateTimeFilter(field_name="created_at", lookup_expr="gte")
    created_before = django_filters.DateTimeFilter(field_name="created_at", lookup_expr="lte")
    updated_after = django_filters.DateTimeFilter(field_name="updated_at", lookup_expr="gte")
    updated_before = django_filters.DateTimeFilter(field_name="updated_at", lookup_expr="lte")

    # Generic search across text fields (to be overridden in subclasses)
    q = django_filters.CharFilter(method="filter_search", label="Search query")

    def filter_search(self, queryset, name, value):
        """Override in subclass to define searchable fields."""
        return queryset

    class Meta:
        fields = ()


class PublishableFilterSet(BaseFilterSet):
    """Filter set for publishable entities.

    Adds status, featured, public, and publish date filters.
    """

    status = django_filters.ChoiceFilter(choices=Status.choices)
    is_featured = django_filters.BooleanFilter()
    is_public = django_filters.BooleanFilter()
    published_after = django_filters.DateTimeFilter(field_name="published_at", lookup_expr="gte")
    published_before = django_filters.DateTimeFilter(field_name="published_at", lookup_expr="lte")

    class Meta:
        fields = ("status", "is_featured", "is_public")


class HierarchicalFilterSet(BaseFilterSet):
    """Filter set for hierarchical models (categories, etc.)."""

    parent = django_filters.NumberFilter(field_name="parent_id")
    has_children = django_filters.BooleanFilter(method="filter_has_children", label="Has children")

    def filter_has_children(self, queryset, name, value):
        if value:
            return queryset.filter(children__isnull=False).distinct()
        return queryset.filter(children__isnull=True)

    class Meta:
        fields = ("parent", "has_children")


class MediaFilterSet(BaseFilterSet):
    """Filter set for MediaFile (staff media library)."""

    mime_type = django_filters.CharFilter(lookup_expr="istartswith")
    min_size = django_filters.NumberFilter(field_name="size", lookup_expr="gte")
    max_size = django_filters.NumberFilter(field_name="size", lookup_expr="lte")
    is_image = django_filters.BooleanFilter(method="filter_is_image")
    created_by = django_filters.NumberFilter(field_name="created_by_id", label="Uploader user id")

    def filter_is_image(self, queryset, name, value):
        if value is True:
            return queryset.filter(mime_type__istartswith="image/")
        if value is False:
            return queryset.exclude(mime_type__istartswith="image/")
        return queryset

    def filter_search(self, queryset, name, value):
        from django.db.models import Q

        return queryset.filter(
            Q(original_name__icontains=value)
            | Q(title_en__icontains=value)
            | Q(title_fa__icontains=value)
            | Q(title_ar__icontains=value)
            | Q(alt_text_en__icontains=value)
            | Q(caption_en__icontains=value)
        )

    class Meta:
        fields = ("mime_type", "is_image", "is_public", "created_by", "is_active", "created_after", "created_before")