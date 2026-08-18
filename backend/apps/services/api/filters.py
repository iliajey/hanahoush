"""Services API filters."""
import django_filters

from apps.services.models import Service


class ServiceFilterSet(django_filters.FilterSet):
    """Filtering for Service.

    - section / section_slug (grouping)
    - status, is_featured, is_public
    """

    section = django_filters.NumberFilter(field_name="section_id")
    section_slug = django_filters.CharFilter(field_name="section__slug", lookup_expr="iexact")
    status = django_filters.CharFilter()
    is_featured = django_filters.BooleanFilter()
    is_public = django_filters.BooleanFilter()

    class Meta:
        model = Service
        fields = ["section", "section_slug", "status", "is_featured", "is_public"]
