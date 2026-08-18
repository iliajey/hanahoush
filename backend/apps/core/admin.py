"""Shared Django admin infrastructure.

Mixins used by every feature-app ModelAdmin so audit fields, SEO fields, the
publishing surface, import/export, bulk actions, singleton semantics and help
texts are configured consistently in one place.

Cross-cutting features provided here:
- ``ImportExportAdminMixin``  → CSV / Excel (XLSX) / JSON import & export.
- ``ActiveBulkActionsMixin``  → Activate / Deactivate bulk actions.
- ``PublishableBulkActionsMixin`` → Publish / Archive / Feature / Unfeature +
  Activate / Deactivate bulk actions.
- ``SingletonAdminMixin``     → enforce a single row (AboutPage, SiteSettings).
- ``PublishableModelForm``    → validate required Persian content fields.
- ``HelpTextAdminMixin``      → field help texts without touching models.
- CKEditor 5 rich text widget on every ``TextField`` of publishable entities.
"""
from django import forms
from django.conf import settings
from django.contrib import admin
from django.db import models as django_models
from django.http import HttpResponseRedirect
from django.urls import reverse
from django.utils.html import format_html

from django_ckeditor_5.widgets import CKEditor5Widget
from import_export import resources
from import_export.admin import ImportExportModelAdmin
from import_export.resources import modelresource_factory

from .models import Status

# ---------------------------------------------------------------------------
# Import / Export (CSV, Excel, JSON)
# ---------------------------------------------------------------------------
# Audit/internal fields never exported or imported through the admin.
IMPORT_EXPORT_EXCLUDED_FIELDS = (
    "created_by",
    "updated_by",
    "created_at",
    "updated_at",
    "is_deleted",
    "deleted_at",
)


class BaseResource(resources.ModelResource):
    """Named base for generated resources (methods only; Meta is built below)."""


def build_resource(model, exclude_fields=()):
    """Build an import-export Resource for ``model`` excluding audit fields."""
    return modelresource_factory(
        model,
        resource_class=BaseResource,
        meta_options={
            "exclude": IMPORT_EXPORT_EXCLUDED_FIELDS + tuple(exclude_fields),
            "import_id_fields": ("id",),
            "skip_unchanged": True,
            "report_skipped": False,
        },
    )


class ImportExportAdminMixin(ImportExportModelAdmin):
    """Adds import/export to a ModelAdmin with an auto-generated resource.

    Admins may set ``IMPORT_EXPORT_EXCLUDE = ("field",)`` to strip sensitive
    fields (e.g. ``password`` on the user model), or override
    ``has_import_permission`` to make a model export-only.
    """

    def __init__(self, model, admin_site):
        self.resource_class = build_resource(
            model,
            exclude_fields=getattr(self, "IMPORT_EXPORT_EXCLUDE", ()),
        )
        super().__init__(model, admin_site)


# ---------------------------------------------------------------------------
# Help texts
# ---------------------------------------------------------------------------
class HelpTextAdminMixin:
    """Applies ``help_texts = {"field": "..."}`` without editing models."""

    help_texts = {}

    def get_form(self, request, obj=None, change=False, **kwargs):
        form = super().get_form(request, obj, change, **kwargs)
        for name, text in self.help_texts.items():
            if name in form.base_fields:
                form.base_fields[name].help_text = text
        return form


# ---------------------------------------------------------------------------
# Base admin behaviour
# ---------------------------------------------------------------------------
class BaseAdminMixin(HelpTextAdminMixin, ImportExportAdminMixin):
    """Audit trail, pagination, optimized querysets and author bookkeeping."""

    readonly_fields = ("created_at", "updated_at", "created_by", "updated_by")
    list_per_page = getattr(settings, "ADMIN_LIST_PER_PAGE", 50)
    list_select_related = ("created_by", "updated_by")
    ordering = ("-created_at",)

    def save_model(self, request, obj, form, change):
        """Stamp created_by / updated_by when the model supports them."""
        if hasattr(obj, "created_by_id"):
            if not change or not obj.created_by_id:
                obj.created_by = request.user
        if hasattr(obj, "updated_by_id"):
            obj.updated_by = request.user
        super().save_model(request, obj, form, change)


# ---------------------------------------------------------------------------
# Bulk actions
# ---------------------------------------------------------------------------
class ActiveBulkActionsMixin:
    """Activate / Deactivate bulk actions (is_active)."""

    actions = ["delete_selected", "make_active", "make_inactive"]

    @admin.action(description="Activate selected items")
    def make_active(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f"{updated} item(s) activated.")

    @admin.action(description="Deactivate selected items")
    def make_inactive(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f"{updated} item(s) deactivated.")


class PublishableBulkActionsMixin(ActiveBulkActionsMixin):
    """Publish / Archive / Feature / Unfeature / Activate / Deactivate."""

    actions = [
        "delete_selected",
        "make_published",
        "make_archived",
        "make_featured",
        "make_unfeatured",
        "make_active",
        "make_inactive",
    ]

    @admin.action(description="Publish selected items")
    def make_published(self, request, queryset):
        updated = queryset.update(status=Status.PUBLISHED)
        self.message_user(request, f"{updated} item(s) published.")

    @admin.action(description="Archive selected items")
    def make_archived(self, request, queryset):
        updated = queryset.update(status=Status.ARCHIVED)
        self.message_user(request, f"{updated} item(s) archived.")

    @admin.action(description="Feature selected items")
    def make_featured(self, request, queryset):
        updated = queryset.update(is_featured=True)
        self.message_user(request, f"{updated} item(s) featured.")

    @admin.action(description="Unfeature selected items")
    def make_unfeatured(self, request, queryset):
        updated = queryset.update(is_featured=False)
        self.message_user(request, f"{updated} item(s) unfeatured.")


# ---------------------------------------------------------------------------
# Singleton
# ---------------------------------------------------------------------------
class SingletonAdminMixin:
    """Enforces a single instance (AboutPage, SiteSettings).

    - No second row can be added while one exists.
    - The single row cannot be deleted.
    - The changelist redirects straight to the single change form.
    """

    def has_add_permission(self, request):
        return not self.model.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False

    def changelist_view(self, request, extra_context=None):
        if self.model.objects.count() == 1:
            obj = self.model.objects.first()
            url = reverse(
                f"admin:{self.model._meta.app_label}_{self.model._meta.model_name}_change",
                args=[obj.pk],
            )
            return HttpResponseRedirect(url)
        return super().changelist_view(request, extra_context)


# ---------------------------------------------------------------------------
# Publishable validation + rich text
# ---------------------------------------------------------------------------
class PublishableModelForm(forms.ModelForm):
    """Form-level validation for publishable entities.

    Publishing workflow requires a Persian title and description; the form
    refuses to save if either is empty.
    """

    def clean(self):
        cleaned_data = super().clean()
        title_fa = (cleaned_data.get("title_fa") or "").strip()
        description_fa = (cleaned_data.get("description_fa") or "").strip()
        if not title_fa:
            self.add_error("title_fa", "The Persian title (title_fa) is required for publishable content.")
        if not description_fa:
            self.add_error("description_fa", "The Persian description (description_fa) is required.")
        return cleaned_data


PUBLISHABLE_HELP_TEXTS = {
    "title_fa": "Persian title (required for publishing).",
    "title_en": "English title — used for the URL slug.",
    "title_ar": "Arabic title (optional).",
    "slug": "URL identifier. Auto-generated from the English title; Unicode allowed.",
    "short_description_fa": "Persian excerpt shown in listings/cards.",
    "short_description_en": "English excerpt shown in listings/cards.",
    "short_description_ar": "Arabic excerpt (optional).",
    "description_fa": "Persian body content (required for publishing).",
    "description_en": "English body content.",
    "description_ar": "Arabic body content (optional).",
    "status": "Publishing lifecycle: Draft → Review → Published → Archived.",
    "is_featured": "Show this item in featured/carousel blocks.",
    "is_public": "Visible to site visitors (independent of workflow status).",
    "published_at": "When the item goes live (drives public ordering).",
    "sort_order": "Manual ordering in lists (lower first).",
    "meta_title": "SEO <title>. Recommended: 60 characters.",
    "meta_description": "SEO meta description. Recommended: 155 characters.",
    "meta_keywords": "Comma-separated SEO keywords.",
    "canonical_url": "Canonical URL for deduplication (optional).",
    "og_image": "OpenGraph sharing image (Media Library).",
}


class SluggedAdminMixin(BaseAdminMixin):
    """Standard admin layout for taxonomy entities (categories, tags, ...)."""

    fieldsets = (
        (
            "Content",
            {"fields": ("title_fa", "title_en", "title_ar", "slug", "sort_order")},
        ),
        (
            "Audit",
            {"classes": ("collapse",), "fields": ("created_by", "updated_by", "created_at", "updated_at")},
        ),
    )
    list_display = ("title_en", "slug", "sort_order", "is_active", "updated_at")
    list_filter = ("is_active", "is_deleted", "created_at")
    search_fields = ("title_en", "title_fa", "title_ar", "slug")
    ordering = ("sort_order", "title_en")
    prepopulated_fields = {"slug": ("title_en",)}
    help_texts = {
        "title_fa": "Persian name.",
        "title_en": "English name.",
        "title_ar": "Arabic name (optional).",
        "slug": "URL identifier; auto-generated from the English title.",
        "sort_order": "Manual ordering (lower first).",
    }


class PublishableAdminMixin(BaseAdminMixin):
    """Standard admin layout for every publishable entity.

    - Grouped fieldsets (Content / Publishing / SEO / Audit).
    - CKEditor 5 rich text on all TextField content.
    - Form-level validation (Persian title & description required).
    - SEO fields grouped, publishing fields grouped.
    """

    form = PublishableModelForm
    formfield_overrides = {
        django_models.TextField: {"widget": CKEditor5Widget(config_name="default")},
    }
    help_texts = PUBLISHABLE_HELP_TEXTS

    fieldsets = (
        (
            "Content",
            {
                "fields": (
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
                )
            },
        ),
        (
            "Publishing",
            {
                "fields": (
                    "status",
                    "is_featured",
                    "is_public",
                    "published_at",
                    "sort_order",
                )
            },
        ),
        (
            "SEO",
            {
                "classes": ("collapse",),
                "fields": (
                    "meta_title",
                    "meta_description",
                    "meta_keywords",
                    "canonical_url",
                    "og_image",
                ),
            },
        ),
        (
            "Audit",
            {
                "classes": ("collapse",),
                "fields": ("created_by", "updated_by", "created_at", "updated_at"),
            },
        ),
    )
    list_display = ("title_en", "status", "is_featured", "is_public", "sort_order", "updated_at")
    list_filter = ("status", "is_featured", "is_public", "is_active", "is_deleted", "created_at")
    search_fields = ("title_en", "title_fa", "title_ar", "slug", "description_en", "meta_title")
    ordering = ("sort_order", "title_en")
    prepopulated_fields = {"slug": ("title_en",)}
    autocomplete_fields = ("og_image",)


# ---------------------------------------------------------------------------
# Small reusable display helpers
# ---------------------------------------------------------------------------
def image_preview_html(url_or_none):
    """Return a small <img> preview or an em-dash placeholder."""
    if not url_or_none:
        return "—"
    return format_html(
        '<img src="{}" style="max-width:80px;max-height:60px;border-radius:4px;" alt="preview"/>',
        url_or_none,
    )
