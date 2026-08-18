"""Base serializer classes for the Hanahoush API.

Provides consistent field handling, nested serialization, and common
validation patterns across all API serializers.
"""
from rest_framework import serializers

from apps.core.models import Status


class HanahoushModelSerializer(serializers.ModelSerializer):
    """Base model serializer with common patterns.

    - Automatically includes audit fields as read-only
    - Provides consistent date formatting
    - Adds computed read-only fields for display
    """

    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    created_by = serializers.StringRelatedField(read_only=True)
    updated_by = serializers.StringRelatedField(read_only=True)

    class Meta:
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at", "created_by", "updated_by", "is_deleted", "deleted_at")


class TranslatableFieldsMixin:
    """Mixin for models with multilingual fields (fa/en/ar).

    Provides helper methods to serialize/deserialize translated fields
    and to get the appropriate language version based on request.
    """

    def get_translated_field(self, obj, base_name, lang=None):
        """Get translated field value for given language."""
        if lang is None:
            lang = self.context.get("request").LANGUAGE_CODE if self.context.get("request") else "en"
        field_name = f"{base_name}_{lang}"
        return getattr(obj, field_name, None) or getattr(obj, f"{base_name}_en", "")

    def to_representation(self, instance):
        """Add computed translated fields to output."""
        data = super().to_representation(instance)
        request = self.context.get("request")
        lang = request.LANGUAGE_CODE if request else "en"

        # Add computed 'title', 'description', 'short_description' for current language
        for base in ("title", "short_description", "description"):
            translated = self.get_translated_field(instance, base, lang)
            if translated:
                data[base] = translated
        return data


class PublishableSerializerMixin(TranslatableFieldsMixin):
    """Mixin for publishable entities (Article, Project, Service, etc.).

    Adds computed fields for publishing status and SEO.
    """

    status_display = serializers.CharField(source="get_status_display", read_only=True)
    is_published = serializers.SerializerMethodField(read_only=True)

    def get_is_published(self, obj):
        return obj.status == Status.PUBLISHED and obj.is_public

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Add SEO fields grouped
        if any(getattr(instance, f, None) for f in ("meta_title", "meta_description", "meta_keywords", "canonical_url")):
            data["seo"] = {
                "meta_title": instance.meta_title or None,
                "meta_description": instance.meta_description or None,
                "meta_keywords": instance.meta_keywords or None,
                "canonical_url": instance.canonical_url or None,
                "og_image": instance.og_image.file.url if instance.og_image else None,
            }
        return data


class NestedMediaFileSerializer(HanahoushModelSerializer):
    """Lightweight serializer for MediaFile references."""

    preview_url = serializers.SerializerMethodField(read_only=True)

    class Meta(HanahoushModelSerializer.Meta):
        fields = ("id", "file", "original_name", "mime_type", "width", "height", "preview_url")
        read_only_fields = fields

    def get_preview_url(self, obj):
        if obj.mime_type and obj.mime_type.startswith("image/"):
            return obj.file.url
        return None


class BaseSerializer(serializers.Serializer):
    """Base serializer for non-model data (e.g., health checks, version info)."""

    pass