from django.contrib import admin

from apps.core.admin import ActiveBulkActionsMixin, BaseAdminMixin, image_preview_html

from .models import MediaFile


@admin.register(MediaFile)
class MediaFileAdmin(ActiveBulkActionsMixin, BaseAdminMixin):
    """Media library admin with thumbnails, usage awareness and bulk actions."""

    list_display = (
        "image_preview",
        "original_name",
        "title_en",
        "mime_type",
        "size",
        "uploader",
        "references",
        "is_public",
        "created_at",
    )
    list_filter = ("mime_type", "is_public", "is_active", "is_deleted", "created_by", "created_at")
    search_fields = (
        "original_name",
        "title_en",
        "title_fa",
        "title_ar",
        "alt_text_en",
        "alt_text_fa",
        "alt_text_ar",
        "caption_en",
    )
    ordering = ("-created_at",)
    list_select_related = ("created_by", "updated_by")
    readonly_fields = BaseAdminMixin.readonly_fields + (
        "size",
        "mime_type",
        "width",
        "height",
        "sha256",
        "image_preview",
        "references",
    )
    fieldsets = (
        (
            "File",
            {
                "fields": (
                    "file",
                    "image_preview",
                    "original_name",
                    "mime_type",
                    "size",
                    "width",
                    "height",
                    "sha256",
                    "references",
                )
            },
        ),
        (
            "Multilingual metadata",
            {
                "fields": (
                    "title_fa",
                    "title_en",
                    "title_ar",
                    "alt_text_fa",
                    "alt_text_en",
                    "alt_text_ar",
                    "caption_fa",
                    "caption_en",
                    "caption_ar",
                )
            },
        ),
        ("Visibility", {"fields": ("is_public", "is_active")}),
        (
            "Audit",
            {
                "classes": ("collapse",),
                "fields": ("created_by", "updated_by", "created_at", "updated_at"),
            },
        ),
    )

    @admin.display(description="Preview")
    def image_preview(self, obj):
        if not obj or not obj.file or not obj.file.name:
            return "—"
        if obj.mime_type and not obj.mime_type.startswith("image/"):
            return "—"
        try:
            return image_preview_html(obj.file.url)
        except ValueError:
            return "—"

    @admin.display(description="Uploader")
    def uploader(self, obj):
        return obj.created_by.username if obj.created_by_id else "—"

    @admin.display(description="Used by")
    def references(self, obj):
        return obj.reference_count

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("created_by", "updated_by")

    def delete_queryset(self, request, queryset):
        """Bulk admin delete is soft — rows remain restorable and references
        keep resolving until every referencing record is updated."""
        from django.utils import timezone

        queryset.update(is_deleted=True, deleted_at=timezone.now())

    def delete_model(self, request, obj):
        """Single-object admin delete is soft too (see delete_queryset)."""
        obj.soft_delete()
