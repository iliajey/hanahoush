from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from apps.core.admin import ActiveBulkActionsMixin, BaseAdminMixin

from .models import Permission, Role, User

AUDIT_FIELDSET = (
    "Audit",
    {"classes": ("collapse",), "fields": ("created_by", "updated_by", "created_at", "updated_at")},
)


@admin.register(Permission)
class PermissionAdmin(ActiveBulkActionsMixin, BaseAdminMixin):
    list_display = ("codename", "name", "module", "is_active", "updated_at")
    list_filter = ("module", "is_active", "is_deleted", "created_at")
    search_fields = ("name", "codename", "module", "description")
    ordering = ("module", "name")
    list_select_related = ("created_by", "updated_by")
    fieldsets = (
        ("Permission", {"fields": ("name", "codename", "module", "description", "is_active")}),
        AUDIT_FIELDSET,
    )


@admin.register(Role)
class RoleAdmin(ActiveBulkActionsMixin, BaseAdminMixin):
    list_display = ("name", "codename", "is_system", "is_active", "updated_at")
    list_filter = ("is_system", "is_active", "is_deleted", "created_at")
    search_fields = ("name", "codename", "description")
    ordering = ("name",)
    list_select_related = ("created_by", "updated_by")
    filter_horizontal = ("permissions",)
    readonly_fields = BaseAdminMixin.readonly_fields + ("is_system",)
    fieldsets = (
        ("Role", {"fields": ("name", "codename", "description", "is_system", "is_active")}),
        ("Permissions", {"fields": ("permissions",)}),
        AUDIT_FIELDSET,
    )


@admin.register(User)
class UserAdmin(ActiveBulkActionsMixin, BaseAdminMixin, DjangoUserAdmin):
    """Custom user admin.

    Import of users is intentionally disabled and ``password`` is never
    exported (security). ``role`` is eagerly fetched for the change list.
    """

    IMPORT_EXPORT_EXCLUDE = ("password",)
    list_display = ("username", "email", "role", "is_staff", "is_active", "date_joined")
    list_filter = ("is_staff", "is_active", "role", "groups", "preferred_language")
    search_fields = ("username", "first_name", "last_name", "email", "phone")
    ordering = ("-date_joined",)
    list_select_related = ("role",)
    autocomplete_fields = ("role",)
    readonly_fields = ("last_login", "date_joined")
    fieldsets = DjangoUserAdmin.fieldsets + (
        ("Profile", {"fields": ("role", "phone", "preferred_language")}),
    )

    def has_import_permission(self, request):
        return False
