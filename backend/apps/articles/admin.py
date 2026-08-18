from django.contrib import admin

from apps.core.admin import (
    ActiveBulkActionsMixin,
    PublishableAdminMixin,
    PublishableBulkActionsMixin,
    SluggedAdminMixin,
)

from .models import Article, Category, Tag


@admin.register(Category)
class CategoryAdmin(ActiveBulkActionsMixin, SluggedAdminMixin):
    list_display = ("title_en", "parent", "slug", "sort_order", "is_active", "updated_at")
    list_filter = ("is_active", "is_deleted", "created_at")
    search_fields = ("title_en", "title_fa", "title_ar", "slug", "description_en")
    autocomplete_fields = ("parent",)
    prepopulated_fields = {"slug": ("title_en",)}
    fieldsets = (
        ("Content", {"fields": ("title_fa", "title_en", "title_ar", "slug", "parent", "sort_order")}),
        ("Description", {"fields": ("description_fa", "description_en", "description_ar")}),
        ("State", {"fields": ("is_active",)}),
        (
            "Audit",
            {"classes": ("collapse",), "fields": ("created_by", "updated_by", "created_at", "updated_at")},
        ),
    )


@admin.register(Tag)
class TagAdmin(ActiveBulkActionsMixin, SluggedAdminMixin):
    pass


@admin.register(Article)
class ArticleAdmin(PublishableBulkActionsMixin, PublishableAdminMixin):
    """Article admin: rich text body, auto slug, grouped SEO/Publishing."""

    list_display = ("title_en", "category", "author", "status", "is_featured", "is_pinned", "updated_at")
    list_filter = (
        "status",
        "is_featured",
        "is_public",
        "is_pinned",
        "category",
        "tags",
        "is_active",
        "is_deleted",
    )
    search_fields = PublishableAdminMixin.search_fields + (
        "category__title_en",
        "tags__title_en",
        "author__username",
        "author__email",
    )
    list_select_related = ("category", "author", "created_by", "updated_by")
    list_editable = ("status", "is_featured", "is_pinned")
    autocomplete_fields = ("category", "tags", "author", "og_image", "cover_image")
    prepopulated_fields = {"slug": ("title_en",)}
    fieldsets = PublishableAdminMixin.fieldsets + (
        ("Article details", {"fields": ("category", "tags", "author", "cover_image", "is_pinned")}),
    )

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .select_related("category", "author")
            .prefetch_related("tags")
        )
