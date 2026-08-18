"""Services API serializers.

Public read serializers for ``Service`` and ``ServiceSection``. Every
multilingual payload also carries computed localized fields (``title``,
``short_description``, ``description``) resolved from the request language
via the shared ``TranslatableFieldsMixin``.
"""
from rest_framework import serializers

from apps.services.models import Service, ServiceSection
from config.api.base.serializers import PublishableSerializerMixin


class ServiceSectionSerializer(serializers.ModelSerializer):
    """Lightweight section summary (read-only)."""

    services_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = ServiceSection
        fields = (
            "id",
            "title_fa",
            "title_en",
            "title_ar",
            "slug",
            "description_fa",
            "description_en",
            "description_ar",
            "icon",
            "sort_order",
            "services_count",
        )
        read_only_fields = fields


class ServiceListSerializer(PublishableSerializerMixin, serializers.ModelSerializer):
    """Serializer for public service listings."""

    section = serializers.SerializerMethodField(read_only=True)
    cover_image = serializers.SerializerMethodField(read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    is_published = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Service
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
            "section",
            "icon",
            "cover_image",
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
        read_only_fields = (
            "created_at", "updated_at", "created_by", "updated_by", "is_deleted", "deleted_at"
        )

    def get_section(self, obj) -> dict | None:
        if obj.section:
            return {
                "id": obj.section.id,
                "title_fa": obj.section.title_fa,
                "title_en": obj.section.title_en,
                "title_ar": obj.section.title_ar,
                "slug": obj.section.slug,
            }
        return None

    def get_cover_image(self, obj) -> dict | None:
        if obj.cover_image:
            return {
                "id": obj.cover_image.id,
                "file": obj.cover_image.file.url,
                "alt_text_fa": obj.cover_image.alt_text_fa,
                "alt_text_en": obj.cover_image.alt_text_en,
                "alt_text_ar": obj.cover_image.alt_text_ar,
            }
        return None

    def get_is_published(self, obj) -> bool:
        return obj.status == "published" and obj.is_public


class ServiceDetailSerializer(ServiceListSerializer):
    """Full serializer for a single service."""

    class Meta(ServiceListSerializer.Meta):
        fields = ServiceListSerializer.Meta.fields + (
            "meta_title",
            "meta_description",
            "meta_keywords",
            "canonical_url",
        )
        read_only_fields = ServiceListSerializer.Meta.read_only_fields

