"""Project API viewsets.

Provides CRUD for the Project model only.
"""
from django.db.models import Count, Q
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound
from rest_framework.response import Response

from apps.accounts.api.permissions import IsStaffOrReadOnly
from apps.core.models import Status
from apps.projects.models import Project, Technology
from config.api.base.viewsets import PublishableViewSet

from .filters import ProjectFilterSet
from .serializers import (
    ProjectCreateUpdateSerializer,
    ProjectDetailSerializer,
    ProjectListSerializer,
    TechnologySerializer,
)


class ProjectViewSet(PublishableViewSet):
    """CRUD for Project.

    Public reads (published content only). Writes require staff privileges —
    the CMS admin and staff tooling remain the write surface.

    Supports:
    - Filtering: status, category, technologies, year, is_featured, is_public,
      date ranges (start/end/published)
    - Searching: title/description/slug (fa/en/ar), client, location
    - Ordering: title_en, created_at, updated_at, published_at, sort_order,
      end_date
    - Pagination: page, page_size
    """

    queryset = Project.objects.all()
    filterset_class = ProjectFilterSet
    permission_classes = [IsStaffOrReadOnly]
    search_fields = [
        "title_en",
        "title_fa",
        "title_ar",
        "description_en",
        "description_fa",
        "description_ar",
        "client",
        "location",
    ]
    ordering_fields = [
        "title_en",
        "created_at",
        "updated_at",
        "published_at",
        "sort_order",
        "end_date",
    ]

    def get_serializer_class(self):
        if self.action == "list":
            return ProjectListSerializer
        if self.action in ("retrieve",):
            return ProjectDetailSerializer
        return ProjectCreateUpdateSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        return (
            qs.select_related("category", "cover_image", "og_image")
            .prefetch_related("technologies", "images__image")
        )

    @action(detail=False, methods=["get"], url_path="categories")
    def categories(self, request):
        """Return categories used by published projects (with counts)."""
        from apps.projects.models import ProjectCategory

        published = Project.objects.filter(
            status=Status.PUBLISHED,
            is_public=True,
            is_deleted=False,
        )
        qs = (
            ProjectCategory.objects.filter(is_active=True, is_deleted=False, projects__in=published)
            .annotate(projects_count=Count("projects", filter=Q(projects__status=Status.PUBLISHED)))
            .order_by("-projects_count", "sort_order", "title_en")
        )
        data = [
            {
                "id": c.pk,
                "title_fa": c.title_fa,
                "title_en": c.title_en,
                "title_ar": c.title_ar,
                "slug": c.slug,
                "projects_count": c.projects_count,
            }
            for c in qs
        ]
        return Response({"success": True, "message": "", "data": data, "errors": None})

    @action(detail=False, methods=["get"], url_path="technologies")
    def technologies(self, request):
        """Return every technology used by published projects (with counts).

        Powers the technology explorer / filter UI. Ordered by usage.
        """
        published = Project.objects.filter(
            status=Status.PUBLISHED,
            is_public=True,
            is_deleted=False,
        )
        qs = (
            Technology.objects.filter(is_active=True, is_deleted=False, projects__in=published)
            .annotate(projects_count=Count("projects", filter=Q(projects__status=Status.PUBLISHED)))
            .order_by("-projects_count", "sort_order", "title_en")
        )
        return Response(
            {
                "success": True,
                "message": "",
                "data": TechnologySerializer(qs, many=True).data,
                "errors": None,
            }
        )

    @action(detail=False, methods=["get"], url_path=r"by-slug/(?P<slug>[^/.]+)")
    def by_slug(self, request, slug=None):
        """Full case-study detail resolved by slug (draft-protected)."""
        project = self.get_queryset().filter(slug=slug).first()
        if project is None:
            raise NotFound("Project not found.")
        serializer = ProjectDetailSerializer(project, context={"request": request})
        return Response({"success": True, "message": "", "data": serializer.data, "errors": None})
