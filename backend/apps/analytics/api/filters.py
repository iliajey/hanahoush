"""Analytics API filtersets.

``filterset_class`` takes precedence over ``filterset_fields`` in DRF, so
model-specific fields must be declared on a FilterSet instead of relying on
``filterset_fields`` alone (which would be silently ignored).
"""
import django_filters
from django.db.models import Q

from apps.analytics.models import ContactRequest
from config.api.base.filters import BaseFilterSet


class ContactRequestFilterSet(BaseFilterSet):
    """Staff filters for contact requests (status / source / locale / dates)."""

    status = django_filters.ChoiceFilter(choices=ContactRequest.STATUS_CHOICES)
    source = django_filters.CharFilter(lookup_expr="icontains")
    locale = django_filters.ChoiceFilter(choices=ContactRequest._meta.get_field("locale").choices)

    def filter_search(self, queryset, name, value):
        return queryset.filter(
            Q(name__icontains=value)
            | Q(email__icontains=value)
            | Q(subject__icontains=value)
            | Q(message__icontains=value)
            | Q(company__icontains=value)
        )

    class Meta:
        fields = ("status", "source", "locale", "is_active", "created_after", "created_before")
