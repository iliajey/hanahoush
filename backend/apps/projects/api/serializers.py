"""Project API serializers."""
import re as _re

from rest_framework import serializers

from apps.core.models import Status
from apps.page_builder.localization import resolve_localized
from apps.projects.models import Project, ProjectImage, Technology


class TechnologySerializer(serializers.ModelSerializer):
    """Lightweight serializer for Technology (read-only in project context)."""

    projects_count = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Technology
        fields = (
            "id",
            "title_fa",
            "title_en",
            "title_ar",
            "slug",
            "icon",
            "website",
            "projects_count",
        )
        read_only_fields = fields

    def get_projects_count(self, obj) -> int | None:
        return getattr(obj, "projects_count", None)


class ProjectImageSerializer(serializers.ModelSerializer):
    """Serializer for Project gallery images."""

    image_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = ProjectImage
        fields = ("id", "image", "image_url", "alt_text_fa", "alt_text_en", "alt_text_ar", "sort_order", "is_cover")
        read_only_fields = ("created_at", "updated_at", "created_by", "updated_by", "is_deleted", "deleted_at")

    def get_image_url(self, obj) -> str | None:
        if obj.image:
            return obj.image.file.url
        return None


class ProjectListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for project listings."""

    category = serializers.SerializerMethodField(read_only=True)
    technologies = TechnologySerializer(many=True, read_only=True)
    cover_image = serializers.SerializerMethodField(read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    is_published = serializers.SerializerMethodField(read_only=True)
    year = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Project
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
            "technologies",
            "client",
            "location",
            "cover_image",
            "start_date",
            "end_date",
            "year",
            "live_url",
            "status",
            "status_display",
            "is_published",
            "is_featured",
            "is_public",
            "published_at",
            "sort_order",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("created_at", "updated_at", "created_by", "updated_by", "is_deleted", "deleted_at")

    def get_category(self, obj) -> dict | None:
        if obj.category:
            return {
                "id": obj.category.id,
                "title_fa": obj.category.title_fa,
                "title_en": obj.category.title_en,
                "slug": obj.category.slug,
            }
        return None

    def get_cover_image(self, obj) -> dict | None:
        if obj.cover_image:
            return {"id": obj.cover_image.id, "file": obj.cover_image.file.url, "alt_text_en": obj.cover_image.alt_text_en}
        return None

    def get_is_published(self, obj) -> bool:
        return obj.status == "published" and obj.is_public

    def get_year(self, obj) -> int | None:
        return obj.end_date.year if obj.end_date else None


class ProjectDetailSerializer(serializers.ModelSerializer):
    """Full serializer for project detail (includes gallery + case study)."""

    category = serializers.SerializerMethodField(read_only=True)
    technologies = TechnologySerializer(many=True, read_only=True)
    cover_image = serializers.SerializerMethodField(read_only=True)
    og_image = serializers.SerializerMethodField(read_only=True)
    images = ProjectImageSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    is_published = serializers.SerializerMethodField(read_only=True)
    year = serializers.SerializerMethodField(read_only=True)
    case_study = serializers.SerializerMethodField(read_only=True)
    related_projects = serializers.SerializerMethodField(read_only=True)
    related_articles = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Project
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at", "created_by", "updated_by", "is_deleted", "deleted_at")

    def _lang(self):
        request = self.context.get("request")
        language = getattr(request, "LANGUAGE_CODE", "en")
        return language if language in ("fa", "en", "ar") else "en"

    def get_category(self, obj) -> dict | None:
        if obj.category:
            return {
                "id": obj.category.id,
                "title_fa": obj.category.title_fa,
                "title_en": obj.category.title_en,
                "slug": obj.category.slug,
            }
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

    def get_year(self, obj) -> int | None:
        return obj.end_date.year if obj.end_date else None

    def get_case_study(self, obj) -> dict:
        return resolve_localized(obj.case_study or {}, self._lang())

    def get_related_projects(self, obj) -> list[dict]:
        qs = Project.objects.filter(
            status=Status.PUBLISHED,
            is_public=True,
            is_deleted=False,
        ).exclude(pk=obj.pk)
        same_category = qs.filter(category=obj.category) if obj.category_id else qs.none()
        combined = same_category | qs.filter(technologies__in=obj.technologies.all())
        return ProjectListSerializer(
            combined.distinct().order_by("-end_date", "-published_at")[:3],
            many=True,
            context=self.context,
        ).data

    def get_related_articles(self, obj) -> list[dict]:
        from apps.articles.api.serializers import ArticleListSerializer
        from apps.articles.models import Article

        tech_names = [t.title_en.lower() for t in obj.technologies.all()]
        if not tech_names:
            return []
        pattern = "|".join(_re.escape(name) for name in tech_names)
        qs = Article.objects.filter(
            status=Status.PUBLISHED,
            is_public=True,
            is_deleted=False,
        )
        related = qs.filter(tags__title_en__iregex=pattern)
        return (
            ArticleListSerializer(
                related.distinct().order_by("-published_at", "-created_at")[:3],
                many=True,
                context=self.context,
            ).data
        )


class ProjectCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating projects."""

    class Meta:
        model = Project
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
            "technologies",
            "client",
            "location",
            "start_date",
            "end_date",
            "live_url",
            "cover_image",
            "og_image",
            "status",
            "is_featured",
            "is_public",
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
