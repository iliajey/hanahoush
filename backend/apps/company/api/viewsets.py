"""Company API viewsets.

Public read-only access to the company content domain. Mutations are excluded
on purpose — the CMS admin remains the write surface.
"""
from rest_framework import mixins, viewsets
from rest_framework.permissions import AllowAny

from apps.company.models import (
    FAQ,
    AboutPage,
    Office,
    Partner,
    SocialLink,
    TeamMember,
    Testimonial,
    Timeline,
)
from apps.core.models import Status
from config.api.base.filters import PublishableFilterSet

from .filters import FAQFilterSet, TeamMemberFilterSet, TestimonialFilterSet
from .serializers import (
    AboutPageSerializer,
    FAQSerializer,
    OfficeSerializer,
    PartnerSerializer,
    SocialLinkSerializer,
    TeamMemberSerializer,
    TestimonialSerializer,
    TimelineSerializer,
)


class ReadOnlyViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """Base read-only viewset with standard envelope + filters."""

    permission_classes = [AllowAny]
    filterset_class = None
    search_fields = []
    ordering_fields = []


class AboutPageViewSet(ReadOnlyViewSet):
    """Public list/retrieve of the published about page (singleton in practice).

    Read-only: the CMS admin is the only write surface. Only published,
    public records are ever returned, for any user.
    """

    queryset = AboutPage.objects.all()
    serializer_class = AboutPageSerializer
    filterset_class = PublishableFilterSet
    search_fields = ["title_en", "title_fa", "title_ar", "description_en", "description_fa"]
    ordering_fields = ["created_at", "updated_at", "sort_order"]
    ordering = ["-updated_at"]

    def get_queryset(self):
        return self.queryset.select_related("hero_image").filter(
            is_active=True,
            is_deleted=False,
            status=Status.PUBLISHED,
            is_public=True,
        )


class TeamMemberViewSet(ReadOnlyViewSet):
    """Public team member listing."""

    queryset = TeamMember.objects.filter(is_active=True)
    serializer_class = TeamMemberSerializer
    filterset_class = TeamMemberFilterSet
    ordering_fields = ["sort_order", "name"]
    ordering = ["sort_order", "name"]

    def get_queryset(self):
        return self.queryset.select_related("avatar").filter(is_active=True)


class PartnerViewSet(ReadOnlyViewSet):
    """Public partner listing."""

    queryset = Partner.objects.filter(is_active=True)
    serializer_class = PartnerSerializer
    ordering_fields = ["sort_order", "name"]
    ordering = ["sort_order", "name"]

    def get_queryset(self):
        return self.queryset.select_related("logo")


class TestimonialViewSet(ReadOnlyViewSet):
    """Public testimonial listing (filterable by ``is_featured``)."""

    queryset = Testimonial.objects.filter(is_active=True)
    serializer_class = TestimonialSerializer
    filterset_class = TestimonialFilterSet
    ordering_fields = ["sort_order", "author_name"]
    ordering = ["sort_order", "author_name"]

    def get_queryset(self):
        return self.queryset.select_related("avatar").filter(is_active=True)


class FAQViewSet(ReadOnlyViewSet):
    """Public FAQ listing (filterable by ``category`` and ``is_featured``)."""

    queryset = FAQ.objects.filter(is_active=True)
    serializer_class = FAQSerializer
    filterset_class = FAQFilterSet
    ordering_fields = ["sort_order", "id"]
    ordering = ["sort_order", "id"]


class TimelineViewSet(ReadOnlyViewSet):
    """Public company timeline / milestones."""

    queryset = Timeline.objects.filter(is_active=True)
    serializer_class = TimelineSerializer
    ordering_fields = ["date", "sort_order"]
    ordering = ["date", "sort_order"]


class SocialLinkViewSet(ReadOnlyViewSet):
    """Public social links (used by the footer)."""

    queryset = SocialLink.objects.filter(is_active=True)
    serializer_class = SocialLinkSerializer
    ordering_fields = ["sort_order", "id"]
    ordering = ["sort_order", "id"]


class OfficeViewSet(ReadOnlyViewSet):
    """Public offices (contact page)."""

    queryset = Office.objects.filter(is_active=True)
    serializer_class = OfficeSerializer
    ordering_fields = ["sort_order", "name"]
    ordering = ["sort_order", "name"]
