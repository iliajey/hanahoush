"""Project API filters."""
import django_filters

from apps.projects.models import Project


class ProjectFilterSet(django_filters.FilterSet):
    """Filtering for Project.

    - status: draft / review / published / archived
    - category, technologies (relations)
    - is_featured, is_public
    - date ranges on start_date / end_date / published_at
    """

    category = django_filters.NumberFilter(field_name="category_id")
    category_slug = django_filters.CharFilter(field_name="category__slug", lookup_expr="iexact")
    technologies = django_filters.CharFilter(
        method="filter_technologies",
        label="Technology ids (comma separated) or slug",
    )
    year = django_filters.NumberFilter(method="filter_year", label="Completion year (end_date)")
    status = django_filters.CharFilter()
    is_featured = django_filters.BooleanFilter()
    is_public = django_filters.BooleanFilter()
    start_date_after = django_filters.DateFilter(field_name="start_date", lookup_expr="gte")
    start_date_before = django_filters.DateFilter(field_name="start_date", lookup_expr="lte")
    end_date_after = django_filters.DateFilter(field_name="end_date", lookup_expr="gte")
    end_date_before = django_filters.DateFilter(field_name="end_date", lookup_expr="lte")
    published_after = django_filters.DateTimeFilter(field_name="published_at", lookup_expr="gte")
    published_before = django_filters.DateTimeFilter(field_name="published_at", lookup_expr="lte")

    class Meta:
        model = Project
        fields = [
            "status",
            "category",
            "category_slug",
            "technologies",
            "year",
            "is_featured",
            "is_public",
            "start_date_after",
            "start_date_before",
            "end_date_after",
            "end_date_before",
            "published_after",
            "published_before",
        ]

    def filter_technologies(self, queryset, name, value):
        ids = [token.strip() for token in value.split(",") if token.strip().isdigit()]
        if ids:
            return queryset.filter(technologies__id__in=ids).distinct()
        return queryset.filter(technologies__slug__iexact=value).distinct()

    def filter_year(self, queryset, name, value):
        return queryset.filter(end_date__year=value)
