"""Project API serializers."""
import re as _re

from rest_framework import serializers

from apps.core.media import media_file_url
from apps.core.models import Status
from apps.page_builder.localization import resolve_localized
from apps.projects.models import Project, ProjectImage, Technology


def _cover_ref(request, media):
    if not media:
        return None
    return {"id": media.id, "file": media_file_url(request, media.file), "alt_text_en": media.alt_text_en}


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
            return media_file_url(self.context.get("request"), obj.image.file)
        return None


class ProjectImageWriteSerializer(serializers.ModelSerializer):
    """Staff write serializer for gallery rows (media FK + ordering + alt text)."""

    id = serializers.IntegerField(read_only=True)

    class Meta:
        model = ProjectImage
        fields = ("id", "image", "alt_text_fa", "alt_text_en", "alt_text_ar", "sort_order", "is_cover")


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
        return _cover_ref(self.context.get("request"), obj.cover_image)

    def get_is_published(self, obj) -> bool:
        return obj.status == "published" and obj.is_public

    def get_year(self, obj) -> int | None:
        return obj.end_date.year if obj.end_date else None


CASE_STUDY_KEYS = frozenset(
    {
        "challenge",
        "objectives",
        "solution_approach",
        "architecture",
        "implementation_stages",
        "results",
    }
)

LOCALES = ("fa", "en", "ar")

_MAX_TEXT_LEN = 20000
_MAX_STAGES = 20
_MAX_NODES = 20
_MAX_LABELS = 30


def _is_localized_text(value) -> bool:
    """Plain string or a per-locale dict — the only shapes the Studio writes."""
    if isinstance(value, str):
        return len(value) <= _MAX_TEXT_LEN
    if isinstance(value, dict):
        if not value:
            return True
        return all(k in LOCALES and isinstance(v, str) and len(v) <= _MAX_TEXT_LEN for k, v in value.items())
    return False


def validate_case_study_payload(value) -> dict:
    """Validate + normalize the ``Project.case_study`` JSON written by the Studio.

    Keeps the existing public read shape (``resolve_localized``) intact:
    every leaf stays either a plain string or a ``{fa, en, ar}`` dict.
    Raises ``serializers.ValidationError`` on structural problems.
    """
    if value in (None, ""):
        return {}
    if not isinstance(value, dict):
        raise serializers.ValidationError("case_study must be an object.")
    unknown = set(value.keys()) - set(CASE_STUDY_KEYS)
    if unknown:
        raise serializers.ValidationError(f"Unknown case_study keys: {sorted(unknown)}.")
    normalized: dict = {}
    for key in ("challenge", "objectives", "solution_approach", "results"):
        if key in value and value[key] not in (None, ""):
            if not _is_localized_text(value[key]):
                raise serializers.ValidationError(f"case_study.{key} must be text or a localized object.")
            normalized[key] = value[key]
    if value.get("implementation_stages") not in (None, ""):
        stages = value.get("implementation_stages")
        if not isinstance(stages, list) or len(stages) > _MAX_STAGES:
            raise serializers.ValidationError("case_study.implementation_stages must be a list.")
        normalized_stages = []
        for entry in stages:
            if not isinstance(entry, dict):
                raise serializers.ValidationError("Each implementation stage must be an object.")
            stage = entry.get("stage", "")
            detail = entry.get("detail", "")
            if not _is_localized_text(stage) or not _is_localized_text(detail):
                raise serializers.ValidationError("Stage stage/detail must be text or localized objects.")
            normalized_stages.append({"stage": stage, "detail": detail})
        normalized["implementation_stages"] = normalized_stages
    if value.get("architecture") not in (None, ""):
        arch = value.get("architecture")
        if not isinstance(arch, dict):
            raise serializers.ValidationError("case_study.architecture must be an object.")
        normalized_arch: dict = {}
        if arch.get("description") not in (None, ""):
            if not _is_localized_text(arch.get("description")):
                raise serializers.ValidationError("architecture.description must be text or a localized object.")
            normalized_arch["description"] = arch.get("description")
        nodes = arch.get("nodes", [])
        if nodes not in (None, ""):
            if not isinstance(nodes, list) or len(nodes) > _MAX_NODES:
                raise serializers.ValidationError("architecture.nodes must be a list.")
            normalized_nodes = []
            for node in nodes:
                if not isinstance(node, dict) or not isinstance(node.get("layer"), str):
                    raise serializers.ValidationError("Each architecture node needs a layer name.")
                labels = node.get("labels", [])
                if isinstance(labels, dict):
                    for locale, items in labels.items():
                        if locale not in LOCALES or not isinstance(items, list) or len(items) > _MAX_LABELS:
                            raise serializers.ValidationError("Architecture labels must be per-locale lists.")
                        if any(not isinstance(item, str) or len(item) > 200 for item in items):
                            raise serializers.ValidationError("Architecture labels must be short strings.")
                elif isinstance(labels, list):
                    if len(labels) > _MAX_LABELS or any(
                        not (isinstance(item, str) or _is_localized_text(item)) for item in labels
                    ):
                        raise serializers.ValidationError("Architecture labels must be short strings.")
                else:
                    raise serializers.ValidationError("Architecture labels must be a list or per-locale lists.")
                normalized_nodes.append({"layer": node["layer"][:64], "labels": labels})
            normalized_arch["nodes"] = normalized_nodes
        normalized["architecture"] = normalized_arch
    return normalized


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
    case_study_raw = serializers.SerializerMethodField(read_only=True)
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
        return _cover_ref(self.context.get("request"), obj.cover_image)

    def get_og_image(self, obj) -> dict | None:
        return _cover_ref(self.context.get("request"), obj.og_image)

    def get_is_published(self, obj) -> bool:
        return obj.status == "published" and obj.is_public

    def get_year(self, obj) -> int | None:
        return obj.end_date.year if obj.end_date else None

    def get_case_study(self, obj) -> dict:
        return resolve_localized(obj.case_study or {}, self._lang())

    def get_case_study_raw(self, obj) -> dict:
        """Unresolved localized JSON for the Studio editor (staff only paths)."""
        raw = obj.case_study or {}
        return raw if isinstance(raw, dict) else {}

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

    id = serializers.IntegerField(read_only=True)

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
            "case_study",
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
        """Validate required Persian fields for publishing + case_study JSON."""
        errors = {}
        status = attrs.get("status", getattr(self.instance, "status", "draft"))
        if status == "published":
            if not attrs.get("title_fa", getattr(self.instance, "title_fa", "")):
                errors["title_fa"] = "Persian title is required for publishing."
            if not attrs.get("description_fa", getattr(self.instance, "description_fa", "")):
                errors["description_fa"] = "Persian description is required for publishing."
        if "case_study" in attrs:
            try:
                attrs["case_study"] = validate_case_study_payload(attrs["case_study"])
            except serializers.ValidationError as exc:
                errors["case_study"] = exc.detail
        if errors:
            raise serializers.ValidationError(errors)
        return attrs
