from django.contrib import admin

from apps.core.admin import (
    ActiveBulkActionsMixin,
    PublishableAdminMixin,
    PublishableBulkActionsMixin,
    SluggedAdminMixin,
)

from .models import Service, ServiceSection


@admin.register(ServiceSection)
class ServiceSectionAdmin(ActiveBulkActionsMixin, SluggedAdminMixin):
    list_display = ("title_en", "icon", "slug", "sort_order", "is_active", "updated_at")
    list_filter = ("is_active", "is_deleted", "created_at")
    search_fields = ("title_en", "title_fa", "title_ar", "slug", "description_en")
    autocomplete_fields = ("cover_image",)
    fieldsets = (
        ("Content", {"fields": ("title_fa", "title_en", "title_ar", "slug", "sort_order")}),
        ("Description", {"fields": ("description_fa", "description_en", "description_ar")}),
        ("Display", {"fields": ("icon", "cover_image", "is_active")}),
        (
            "Audit",
            {"classes": ("collapse",), "fields": ("created_by", "updated_by", "created_at", "updated_at")},
        ),
    )


@admin.register(Service)
class ServiceAdmin(PublishableBulkActionsMixin, PublishableAdminMixin):
    list_display = ("title_en", "section", "status", "is_featured", "sort_order", "updated_at")
    list_filter = ("status", "is_featured", "is_public", "section", "is_active", "is_deleted")
    search_fields = PublishableAdminMixin.search_fields + ("section__title_en",)
    list_select_related = ("section", "created_by", "updated_by")
    list_editable = ("status", "is_featured", "sort_order")
    autocomplete_fields = ("section", "og_image", "cover_image")
    prepopulated_fields = {"slug": ("title_en",)}
    fieldsets = PublishableAdminMixin.fieldsets + (
        ("Service details", {"fields": ("section", "icon", "cover_image")}),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("section")
