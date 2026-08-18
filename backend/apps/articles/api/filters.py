"""Article API filters."""
import django_filters

from apps.articles.models import Article


class ArticleFilterSet(django_filters.FilterSet):
    """Filtering for Article.

    - status: draft / review / published / archived
    - category, author, tags (relations)
    - is_featured, is_public, is_pinned
    - date ranges on published_at / created_at
    """

    category = django_filters.NumberFilter(field_name="category_id")
    category_slug = django_filters.CharFilter(field_name="category__slug", lookup_expr="iexact")
    author = django_filters.NumberFilter(field_name="author_id")
    tags = django_filters.CharFilter(method="filter_tags", label="Tag ids (comma separated) or slug")
    status = django_filters.CharFilter()
    is_featured = django_filters.BooleanFilter()
    is_public = django_filters.BooleanFilter()
    is_pinned = django_filters.BooleanFilter()
    published_after = django_filters.DateTimeFilter(field_name="published_at", lookup_expr="gte")
    published_before = django_filters.DateTimeFilter(field_name="published_at", lookup_expr="lte")

    class Meta:
        model = Article
        fields = [
            "status",
            "category",
            "category_slug",
            "author",
            "tags",
            "is_featured",
            "is_public",
            "is_pinned",
            "published_after",
            "published_before",
        ]

    def filter_tags(self, queryset, name, value):
        ids = [token.strip() for token in value.split(",") if token.strip().isdigit()]
        if ids:
            return queryset.filter(tags__id__in=ids).distinct()
        return queryset.filter(tags__slug__iexact=value).distinct()
