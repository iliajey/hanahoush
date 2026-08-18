from adminsortable2.admin import SortableAdminBase, SortableInlineAdminMixin
from django.contrib import admin

from apps.core.admin import (
    ActiveBulkActionsMixin,
    BaseAdminMixin,
    PublishableAdminMixin,
    PublishableBulkActionsMixin,
    SluggedAdminMixin,
    image_preview_html,
)

from .models import Project, ProjectCategory, ProjectImage, Technology


@admin.register(ProjectCategory)
class ProjectCategoryAdmin(ActiveBulkActionsMixin, SluggedAdminMixin):
    list_display = ("title_en", "parent", "slug", "sort_order", "is_active", "updated_at")
    list_filter = ("is_active", "is_deleted", "created_at")
    search_fields = ("title_en", "title_fa", "title_ar", "slug")
    autocomplete_fields = ("parent",)
    prepopulated_fields = {"slug": ("title_en",)}


@admin.register(Technology)
class TechnologyAdmin(ActiveBulkActionsMixin, SluggedAdminMixin):
    list_display = ("title_en", "icon", "website", "sort_order", "is_active", "updated_at")
    search_fields = ("title_en", "title_fa", "title_ar", "slug", "website")


class ProjectImageInline(SortableInlineAdminMixin, admin.TabularInline):
    """Drag & drop gallery with thumbnails."""

    model = ProjectImage
    extra = 0
    fields = ("image_preview", "image", "alt_text_fa", "alt_text_en", "alt_text_ar", "is_cover")
    readonly_fields = ("image_preview",)
    autocomplete_fields = ("image",)

    @admin.display(description="Preview")
    def image_preview(self, obj):
        if not obj or not obj.pk or not obj.image_id:
            return "—"
        try:
            return image_preview_html(obj.image.file.url)
        except (ValueError, AttributeError):
            return "—"


@admin.register(Project)
class ProjectAdmin(SortableAdminBase, PublishableBulkActionsMixin, PublishableAdminMixin):
    """Project admin with a drag-and-drop sortable ProjectImage inline.

    ``SortableAdminBase`` (not ``SortableAdminMixin``) is used deliberately:
    it enables the sortable inline while remaining compatible with
    ``list_editable`` and the import/export changelist template.
    """

    list_display = ("title_en", "category", "client", "status", "is_featured", "end_date", "updated_at")
    list_filter = ("status", "is_featured", "is_public", "category", "technologies", "is_active", "is_deleted")
    search_fields = PublishableAdminMixin.search_fields + (
        "client",
        "category__title_en",
        "technologies__title_en",
        "location",
    )
    list_select_related = ("category", "created_by", "updated_by")
    list_editable = ("status", "is_featured")
    autocomplete_fields = ("category", "technologies", "og_image", "cover_image")
    prepopulated_fields = {"slug": ("title_en",)}
    inlines = (ProjectImageInline,)
    fieldsets = PublishableAdminMixin.fieldsets + (
        (
            "Project details",
            {
                "fields": (
                    "category",
                    "technologies",
                    "client",
                    "location",
                    "start_date",
                    "end_date",
                    "live_url",
                    "cover_image",
                )
            },
        ),
        (
            "Case study",
            {
                "classes": ("collapse",),
                "fields": ("case_study",),
                "description": (
                    "Structured case-study content: challenge, objectives, solution_approach, "
                    "architecture (nodes), implementation_stages, results. Values may be localized "
                    "objects {fa, en, ar}. The editorial workflow (Page Builder → Workflows) governs "
                    "publication."
                ),
            },
        ),
    )

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .select_related("category")
            .prefetch_related("technologies", "images")
        )


@admin.register(ProjectImage)
class ProjectImageAdmin(ActiveBulkActionsMixin, BaseAdminMixin):
    list_display = ("image_preview", "project", "is_cover", "sort_order", "updated_at")
    list_filter = ("is_cover", "is_active", "is_deleted", "project")
    search_fields = ("project__title_en", "alt_text_en", "alt_text_fa", "alt_text_ar")
    autocomplete_fields = ("project", "image")
    list_select_related = ("project", "image", "created_by", "updated_by")
    readonly_fields = BaseAdminMixin.readonly_fields + ("image_preview",)
    fieldsets = (
        ("Image", {"fields": ("project", "image", "image_preview", "is_cover", "sort_order")}),
        ("Alt text", {"fields": ("alt_text_fa", "alt_text_en", "alt_text_ar")}),
        (
            "Audit",
            {"classes": ("collapse",), "fields": ("created_by", "updated_by", "created_at", "updated_at")},
        ),
    )

    @admin.display(description="Preview")
    def image_preview(self, obj):
        if not obj or not obj.image_id:
            return "—"
        try:
            return image_preview_html(obj.image.file.url)
        except (ValueError, AttributeError):
            return "—"

