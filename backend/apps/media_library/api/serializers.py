"""Media library API serializers."""
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from apps.media_library.models import MediaFile


class MediaFileSerializer(serializers.ModelSerializer):
    """Read serializer for the media library (staff)."""

    preview_url = serializers.SerializerMethodField()
    uploader = serializers.CharField(source="created_by.username", read_only=True, default="")
    reference_count = serializers.SerializerMethodField()

    class Meta:
        model = MediaFile
        fields = (
            "id",
            "file",
            "preview_url",
            "original_name",
            "title_fa",
            "title_en",
            "title_ar",
            "alt_text_fa",
            "alt_text_en",
            "alt_text_ar",
            "caption_fa",
            "caption_en",
            "caption_ar",
            "mime_type",
            "size",
            "width",
            "height",
            "sha256",
            "is_public",
            "uploader",
            "reference_count",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields

    @extend_schema_field({"type": "string", "nullable": True, "format": "uri"})
    def get_preview_url(self, obj):
        if obj.mime_type and obj.mime_type.startswith("image/"):
            return obj.file.url
        return None

    @extend_schema_field({"type": "integer"})
    def get_reference_count(self, obj):
        return obj.reference_count


class MediaUploadSerializer(serializers.ModelSerializer):
    """Upload serializer — metadata is optional; the file is validated."""

    class Meta:
        model = MediaFile
        fields = (
            "file",
            "title_fa",
            "title_en",
            "title_ar",
            "alt_text_fa",
            "alt_text_en",
            "alt_text_ar",
            "caption_fa",
            "caption_en",
            "caption_ar",
            "is_public",
        )


class MediaUpdateSerializer(serializers.ModelSerializer):
    """Metadata editing for an existing media file.

    The binary ``file`` itself cannot be replaced through this endpoint — it
    is immutable once stored (uploads must use ``POST /media/``).
    """

    class Meta:
        model = MediaFile
        fields = (
            "title_fa",
            "title_en",
            "title_ar",
            "alt_text_fa",
            "alt_text_en",
            "alt_text_ar",
            "caption_fa",
            "caption_en",
            "caption_ar",
            "is_public",
            "is_active",
        )
