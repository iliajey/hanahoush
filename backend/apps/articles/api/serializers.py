"""Article API serializers.

Serializers for Article, Category, and Tag models.
"""
from rest_framework import serializers

from apps.articles.models import Article, Category, Tag
from apps.articles.reading import reading_minutes


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for Article Category."""

    children = serializers.SerializerMethodField(read_only=True)
    articles_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Category
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at", "created_by", "updated_by", "is_deleted", "deleted_at")

    def get_children(self, obj):
        """Serialize child categories recursively (one level)."""
        children = obj.children.filter(is_deleted=False, is_active=True)
        if children.exists():
            return CategorySerializer(children, many=True, context=self.context).data
        return []


class TagSerializer(serializers.ModelSerializer):
    """Serializer for Article Tag."""

    articles_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Tag
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at", "created_by", "updated_by", "is_deleted", "deleted_at")


class ArticleListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for article listings."""

    category = serializers.SerializerMethodField(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    author = serializers.StringRelatedField(read_only=True)
    cover_image = serializers.SerializerMethodField(read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    is_published = serializers.SerializerMethodField(read_only=True)
    reading_time = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Article
        fields = (
            "id",
            "title_fa",
            "title_en",
            "title_ar",
            "slug",
            "short_description_fa",
            "short_description_en",
            "short_description_ar",
            "category",
            "tags",
            "author",
            "cover_image",
            "status",
            "status_display",
            "is_published",
            "is_featured",
            "is_public",
            "is_pinned",
            "published_at",
            "reading_time",
            "sort_order",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("created_at", "updated_at", "created_by", "updated_by", "is_deleted", "deleted_at")

    def get_category(self, obj) -> dict | None:
        if obj.category:
            return {"id": obj.category.id, "title_fa": obj.category.title_fa, "title_en": obj.category.title_en, "slug": obj.category.slug}
        return None

    def get_cover_image(self, obj) -> dict | None:
        if obj.cover_image:
            return {"id": obj.cover_image.id, "file": obj.cover_image.file.url, "alt_text_en": obj.cover_image.alt_text_en}
        return None

    def get_is_published(self, obj) -> bool:

        return obj.status == "published" and obj.is_public

    def get_reading_time(self, obj) -> int:
        request = self.context.get("request")
        lang = getattr(request, "LANGUAGE_CODE", "en")
        if lang not in ("fa", "en", "ar"):
            lang = "en"
        body = getattr(obj, f"description_{lang}", "") or obj.description_en or ""
        return reading_minutes(body, lang)


class ArticleDetailSerializer(serializers.ModelSerializer):
    """Full serializer for article detail view."""

    category = serializers.SerializerMethodField(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    author = serializers.StringRelatedField(read_only=True)
    cover_image = serializers.SerializerMethodField(read_only=True)
    og_image = serializers.SerializerMethodField(read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    is_published = serializers.SerializerMethodField(read_only=True)
    reading_time = serializers.SerializerMethodField(read_only=True)
    related_articles = serializers.SerializerMethodField(read_only=True)
    related_projects = serializers.SerializerMethodField(read_only=True)
    related_services = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Article
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at", "created_by", "updated_by", "is_deleted", "deleted_at")

    def _lang(self):
        request = self.context.get("request")
        language = getattr(request, "LANGUAGE_CODE", "en")
        return language if language in ("fa", "en", "ar") else "en"

    def get_category(self, obj) -> dict | None:
        if obj.category:
            return {"id": obj.category.id, "title_fa": obj.category.title_fa, "title_en": obj.category.title_en, "slug": obj.category.slug}
        return None

    def get_cover_image(self, obj) -> dict | None:
        if obj.cover_image:
            return {"id": obj.cover_image.id, "file": obj.cover_image.file.url, "alt_text_en": obj.cover_image.alt_text_en}
        return None

    def get_og_image(self, obj) -> dict | None:
        if obj.og_image:
            return {"id": obj.og_image.id, "file": obj.og_image.file.url, "alt_text_en": obj.og_image.alt_text_en}
        return None

    def get_is_published(self, obj) -> bool:

        return obj.status == "published" and obj.is_public

    def get_reading_time(self, obj) -> int:
        lang = self._lang()
        body = getattr(obj, f"description_{lang}", "") or obj.description_en or ""
        return reading_minutes(body, lang)

    def get_related_articles(self, obj) -> list[dict]:
        from apps.core.models import Status

        qs = Article.objects.filter(status=Status.PUBLISHED, is_public=True, is_deleted=False).exclude(pk=obj.pk)
        same_category = qs.filter(category=obj.category) if obj.category_id else qs.none()
        related = same_category | qs.filter(tags__in=obj.tags.all())
        return ArticleListSerializer(
            related.distinct().order_by("-published_at", "-created_at")[:3],
            many=True,
            context=self.context,
        ).data

    def get_related_projects(self, obj) -> list[dict]:
        from django.db.models import Q

        from apps.core.models import Status
        from apps.projects.api.serializers import ProjectListSerializer
        from apps.projects.models import Project

        tag_names = [t.title_en.lower() for t in obj.tags.all()]
        qs = Project.objects.filter(status=Status.PUBLISHED, is_public=True, is_deleted=False)
        if tag_names:
            pattern = "|".join(__import__("re").escape(name) for name in tag_names)
            qs = qs.filter(Q(technologies__title_en__iregex=pattern) | Q(title_en__iregex=pattern))
        else:
            qs = qs.none()
        return ProjectListSerializer(
            qs.distinct().order_by("-end_date", "-published_at")[:3],
            many=True,
            context=self.context,
        ).data

    def get_related_services(self, obj) -> list[dict]:
        from django.db.models import Q

        from apps.core.models import Status
        from apps.services.api.serializers import ServiceListSerializer
        from apps.services.models import Service

        topics = [t.title_en.lower() for t in obj.tags.all()]
        if obj.category:
            topics.append(obj.category.title_en.lower())
        topics = [t for t in topics if t]
        qs = Service.objects.filter(status=Status.PUBLISHED, is_public=True, is_deleted=False)
        if topics:
            pattern = "|".join(__import__("re").escape(t) for t in topics)
            qs = qs.filter(Q(title_en__iregex=pattern) | Q(description_en__iregex=pattern))
        else:
            qs = qs.none()
        return ServiceListSerializer(
            qs.distinct().order_by("sort_order", "title_en")[:2],
            many=True,
            context=self.context,
        ).data


class ArticleCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating articles.

    Excludes computed fields and read-only audit fields.
    """

    class Meta:
        model = Article
        fields = (
            "title_fa",
            "title_en",
            "title_ar",
            "slug",
            "short_description_fa",
            "short_description_en",
            "short_description_ar",
            "description_fa",
            "description_en",
            "description_ar",
            "category",
            "tags",
            "author",
            "cover_image",
            "og_image",
            "status",
            "is_featured",
            "is_public",
            "is_pinned",
            "published_at",
            "sort_order",
            "meta_title",
            "meta_description",
            "meta_keywords",
            "canonical_url",
        )

    def validate(self, attrs):
        """Validate required Persian fields for publishing."""

        errors = {}
        status = attrs.get("status", getattr(self.instance, "status", "draft"))
        if status == "published":
            if not attrs.get("title_fa", getattr(self.instance, "title_fa", "")):
                errors["title_fa"] = "Persian title is required for publishing."
            if not attrs.get("description_fa", getattr(self.instance, "description_fa", "")):
                errors["description_fa"] = "Persian description is required for publishing."
        if errors:
            raise serializers.ValidationError(errors)
        return attrs
