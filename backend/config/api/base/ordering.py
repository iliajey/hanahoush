"""Base ordering and search utilities for the Hanahoush API.

Provides consistent ordering and search behavior across all endpoints.
"""
from rest_framework.filters import OrderingFilter, SearchFilter


class DefaultOrderingFilter(OrderingFilter):
    """Ordering filter with safe defaults.

    Only allows ordering on fields explicitly listed in
    `ordering_fields` on the viewset. Default ordering is defined by the
    viewset's `ordering` attribute.
    """

    ordering_param = "ordering"
    ordering_fields = None  # Override in viewset

    def get_valid_fields(self, queryset, view, context):
        if self.ordering_fields:
            return [(f, f) for f in self.ordering_fields]
        return super().get_valid_fields(queryset, view, context)


class MultiFieldSearchFilter(SearchFilter):
    """Search filter with a stable ``q`` query parameter.

    Leverages the DRF ``SearchFilter`` which already supports field
    prefixes (``^`` startswith, ``=`` exact, ``@`` full-text, ``$`` regex).
    """

    search_param = "q"

    def get_search_fields(self, view, request):
        """Allow the view to define search fields dynamically."""
        return getattr(view, "search_fields", [])
