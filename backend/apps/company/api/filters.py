"""Company API filters."""
import django_filters
from django.db.models import Q

from apps.company.models import FAQ, TeamMember, Testimonial


class TestimonialFilterSet(django_filters.FilterSet):
    """Filtering for testimonials."""

    is_featured = django_filters.BooleanFilter()
    is_active = django_filters.BooleanFilter(field_name="is_active")

    class Meta:
        model = Testimonial
        fields = ["is_featured", "is_active"]


class FAQFilterSet(django_filters.FilterSet):
    """Filtering for FAQ entries."""

    category = django_filters.CharFilter(lookup_expr="iexact")
    is_featured = django_filters.BooleanFilter()
    q = django_filters.CharFilter(method="filter_search", label="Search query")

    class Meta:
        model = FAQ
        fields = ["category", "is_featured"]

    def filter_search(self, queryset, name, value):
        return queryset.filter(
            Q(question_en__icontains=value)
            | Q(question_fa__icontains=value)
            | Q(answer_en__icontains=value)
            | Q(answer_fa__icontains=value)
        )


class TeamMemberFilterSet(django_filters.FilterSet):
    """Filtering for team members."""

    is_active = django_filters.BooleanFilter(field_name="is_active")

    class Meta:
        model = TeamMember
        fields = ["is_active"]
