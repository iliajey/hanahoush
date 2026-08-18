"""Page Builder API viewsets."""
import django_filters

from apps.core.models import Status

from ..models import Page


class PageFilterSet(django_filters.FilterSet):
    is_home = django_filters.BooleanFilter()
    template = django_filters.CharFilter(lookup_expr="iexact")
    status = django_filters.ChoiceFilter(choices=Status.choices)
    q = django_filters.CharFilter(method="filter_search", label="Search query")

    class Meta:
        model = Page
        fields = ["is_home", "template", "status"]

    def filter_search(self, queryset, name, value):
        return queryset.filter(
            django_filters.Q(title_en__icontains=value)
            | django_filters.Q(title_fa__icontains=value)
            | django_filters.Q(slug__icontains=value)
        )
