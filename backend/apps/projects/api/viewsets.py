"""Project API viewsets.

Provides CRUD for the Project model plus the staff gallery surface
(``ProjectImage`` rows). Gallery writes reuse the existing normalized
``ProjectImage`` model — no second media system.
"""
from django.db import transaction
from django.db.models import Count, Q
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound
from rest_framework.response import Response

from apps.accounts.api.permissions import IsStaffOrReadOnly
from apps.core.models import Status
from apps.projects.models import Project, ProjectImage, Technology
from config.api.base.viewsets import PublishableViewSet

from .filters import ProjectFilterSet
from .serializers import (
    ProjectCreateUpdateSerializer,
    ProjectDetailSerializer,
    ProjectImageSerializer,
    ProjectImageWriteSerializer,
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

    # -- gallery (staff writes land here; reads stay in the detail payload) --
    @action(detail=True, methods=["get", "post"], url_path="gallery")
    def gallery(self, request, pk=None):
        """List gallery rows (any reader) or append one (staff only)."""
        project = self.get_object()
        if request.method == "GET":
            rows = project.images.select_related("image").filter(is_deleted=False)
            data = ProjectImageSerializer(rows, many=True, context={"request": request}).data
            return Response({"success": True, "message": "", "data": data, "errors": None})
        serializer = ProjectImageWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        row = serializer.save(project=project)
        out = ProjectImageSerializer(row, context={"request": request}).data
        return Response(
            {"success": True, "message": "Gallery image added", "data": out, "errors": None},
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["patch", "delete"], url_path=r"gallery/(?P<image_id>[0-9]+)")
    def gallery_item(self, request, pk=None, image_id=None):
        """Update (alt text / order / cover flag) or remove one gallery row."""
        project = self.get_object()
        row = project.images.filter(pk=image_id, is_deleted=False).first()
        if row is None:
            raise NotFound("Gallery image not found.")
        if request.method == "DELETE":
            row.soft_delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        serializer = ProjectImageWriteSerializer(row, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        out = ProjectImageSerializer(row, context={"request": request}).data
        return Response({"success": True, "message": "Gallery image updated", "data": out, "errors": None})

    @action(detail=True, methods=["post"], url_path="gallery/reorder")
    def gallery_reorder(self, request, pk=None):
        """Persist drag-and-drop gallery ordering (staff only).

        Body: ``{"order": [<image-row-id>, ...]}`` — rows get
        ``sort_order`` 0..n in the given sequence.
        """
        project = self.get_object()
        order = request.data.get("order", [])
        if not isinstance(order, list) or not all(isinstance(i, int) for i in order):
            return self.build_error("`order` must be a list of gallery image ids.", status_code=status.HTTP_400_BAD_REQUEST)
        rows = {row.pk: row for row in project.images.filter(is_deleted=False)}
        if set(order) != set(rows.keys()) and order:
            # Allow partial orders: only provided ids are re-sequenced first.
            unknown = [i for i in order if i not in rows]
            if unknown:
                return self.build_error(f"Unknown gallery image ids: {unknown}.", status_code=status.HTTP_400_BAD_REQUEST)
        with transaction.atomic():
            for index, row_id in enumerate(order):
                row = rows[row_id]
                if row.sort_order != index:
                    row.sort_order = index
                    row.save(update_fields=["sort_order"])
        rows_qs = project.images.select_related("image").filter(is_deleted=False)
        data = ProjectImageSerializer(rows_qs, many=True, context={"request": request}).data
        return Response({"success": True, "message": "Gallery order saved", "data": data, "errors": None})
