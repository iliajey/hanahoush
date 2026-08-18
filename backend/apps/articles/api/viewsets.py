"""Article API viewsets.

Provides CRUD for the Article model only.
"""
from django.db.models import Count, Q
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound
from rest_framework.response import Response

from apps.accounts.api.permissions import IsStaffOrReadOnly
from apps.articles.models import Article, Category, Tag
from config.api.base.viewsets import PublishableViewSet

from .filters import ArticleFilterSet
from .serializers import (
    ArticleCreateUpdateSerializer,
    ArticleDetailSerializer,
    ArticleListSerializer,
)


class ArticleViewSet(PublishableViewSet):
    """CRUD for Article.

    Public reads (published content only). Writes require staff privileges —
    the CMS admin and staff tooling remain the write surface.

    Supports:
    - Filtering: status, is_featured, is_public, category, author, tags
    - Searching: title/description/slug (fa/en/ar)
    - Ordering: title_en, created_at, updated_at, published_at, sort_order
    - Pagination: page, page_size
    """

    queryset = Article.objects.all()
    filterset_class = ArticleFilterSet
    permission_classes = [IsStaffOrReadOnly]

    def get_serializer_class(self):
        if self.action == "list":
            return ArticleListSerializer
        if self.action in ("retrieve", "by_slug"):
            return ArticleDetailSerializer
        return ArticleCreateUpdateSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        return qs.select_related("category", "author", "cover_image", "og_image").prefetch_related("tags")

    @action(detail=False, methods=["get"], url_path=r"by-slug/(?P<slug>[^/.]+)")
    def by_slug(self, request, slug=None):
        """Full article detail by slug (draft-protected, localized, with related content)."""
        article = self.get_queryset().filter(slug=slug).first()
        if article is None:
            raise NotFound("Article not found.")
        serializer = ArticleDetailSerializer(article, context={"request": request})
        return Response({"success": True, "message": "", "data": serializer.data, "errors": None})

    @action(detail=False, methods=["get"], url_path="categories")
    def categories(self, request):
        """Categories used by published articles (with counts) — powers the category explorer."""
        published = Article.objects.filter(status="published", is_public=True, is_deleted=False)
        qs = (
            Category.objects.filter(is_active=True, is_deleted=False, articles__in=published)
            .annotate(articles_count=Count("articles", filter=Q(articles__status="published")))
            .order_by("-articles_count", "sort_order", "title_en")
        )
        data = [
            {"id": c.pk, "title_fa": c.title_fa, "title_en": c.title_en, "title_ar": c.title_ar, "slug": c.slug, "articles_count": c.articles_count}
            for c in qs
        ]
        return Response({"success": True, "message": "", "data": data, "errors": None})

    @action(detail=False, methods=["get"], url_path="tags")
    def tags(self, request):
        """Tags used by published articles (with counts) — powers the topic explorer."""
        published = Article.objects.filter(status="published", is_public=True, is_deleted=False)
        qs = (
            Tag.objects.filter(is_active=True, is_deleted=False, articles__in=published)
            .annotate(articles_count=Count("articles", filter=Q(articles__status="published")))
            .order_by("-articles_count", "sort_order", "title_en")
        )
        data = [
            {"id": t.pk, "title_fa": t.title_fa, "title_en": t.title_en, "title_ar": t.title_ar, "slug": t.slug, "articles_count": t.articles_count}
            for t in qs
        ]
        return Response({"success": True, "message": "", "data": data, "errors": None})
