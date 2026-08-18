"""Page Builder admin — premium composition experience.

- Drag-and-drop section ordering via ``adminsortable2``.
- Inline editing of sections on the Page change form.
- Enable/disable sections inline.
- Live preview URL generation.
- Singleton protection for chrome singletons (footer, announcement, hero, SEO).
"""
from adminsortable2.admin import SortableAdminMixin, SortableInlineAdminMixin
from django import forms
from django.contrib import admin
from django.utils.html import format_html

from apps.core.admin import ActiveBulkActionsMixin, BaseAdminMixin, SingletonAdminMixin

from .models import (
    AnnouncementBar,
    FooterConfiguration,
    HeroConfiguration,
    NavigationItem,
    NavigationMenu,
    NewsletterSubscription,
    Page,
    PageSection,
    RedirectRule,
    SEOConfiguration,
    SectionConfiguration,
)

AUDIT_FIELDSET = (
    "Audit",
    {"classes": ("collapse",), "fields": ("created_by", "updated_by", "created_at", "updated_at")},
)


# ---------------------------------------------------------------------------
# Forms
# ---------------------------------------------------------------------------
class PageForm(forms.ModelForm):
    """Validation for Page: English title + slug required, publishable status."""

    class Meta:
        model = Page
        fields = (
            "title_fa",
            "title_en",
            "title_ar",
            "slug",
            "status",
            "is_home",
            "template",
            "version",
            "version_at",
            "sort_order",
        )

    def clean(self):
        cleaned = super().clean()
        title_en = (cleaned.get("title_en") or "").strip()
        if not title_en:
            self.add_error("title_en", "The English title is required.")
        return cleaned


class SectionInlineForm(forms.ModelForm):
    class Meta:
        model = PageSection
        fields = (
            "page",
            "section_type",
            "title_fa",
            "title_en",
            "title_ar",
            "sort_order",
            "is_enabled",
            "config",
            "language_overrides",
        )

    def clean_section_type(self):
        from .models import SECTION_TYPE_LOOKUP

        value = self.cleaned_data.get("section_type")
        if value and value not in SECTION_TYPE_LOOKUP:
            raise forms.ValidationError(f"Unknown section type: {value}")
        return value


# ---------------------------------------------------------------------------
# Sortable inline — Page sections
# ---------------------------------------------------------------------------
class PageSectionInline(SortableInlineAdminMixin, admin.TabularInline):
    """Drag-and-drop ordered, inline-editable page sections."""

    model = PageSection
    form = SectionInlineForm
    extra = 0
    min_num = 0
    fields = (
        "section_type",
        "title_en",
        "is_enabled",
        "sort_order",
        "config",
        "language_overrides",
    )
    readonly_fields = ()
    can_delete = True

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("page")


# ---------------------------------------------------------------------------
# Page
# ---------------------------------------------------------------------------
@admin.register(Page)
class PageAdmin(SortableAdminMixin, BaseAdminMixin, ActiveBulkActionsMixin):
    form = PageForm
    list_display = (
        "title_en",
        "slug",
        "status",
        "is_home",
        "version",
        "sections_count",
        "preview_link",
        "updated_at",
    )
    list_filter = ("status", "is_home", "is_active", "is_deleted", "created_at")
    list_editable = ("status", "is_home")
    search_fields = ("title_en", "title_fa", "title_ar", "slug")
    prepopulated_fields = {"slug": ("title_en",)}
    inlines = [PageSectionInline]
    ordering = ("-is_home", "sort_order", "title_en")

    fieldsets = (
        ("Content", {"fields": ("title_fa", "title_en", "title_ar", "slug", "template")}),
        ("Publishing", {"fields": ("status", "is_home", "sort_order", "version", "version_at")}),
        AUDIT_FIELDSET,
    )
    readonly_fields = (
        "version",
        "version_at",
        "created_by",
        "updated_by",
        "created_at",
        "updated_at",
    )

    @admin.display(description="Sections")
    def sections_count(self, obj):
        return obj.sections.filter(is_deleted=False).count()

    @admin.display(description="Preview")
    def preview_link(self, obj):
        if obj.status == "published":
            return format_html(
                '<a href="/pages/{}" target="_blank" rel="noopener">preview ↗</a>',
                obj.slug,
            )
        return "—"

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        # Keep is_home a singleton flag.
        if obj.is_home:
            Page.objects.filter(is_home=True).exclude(pk=obj.pk).update(is_home=False)


# ---------------------------------------------------------------------------
# Section registry
# ---------------------------------------------------------------------------
@admin.register(SectionConfiguration)
class SectionConfigurationAdmin(BaseAdminMixin):
    list_display = ("section_type", "name", "icon", "available_locales", "updated_at")
    list_editable = ("name", "icon")
    search_fields = ("section_type", "name", "description")
    fieldsets = (
        ("Section", {"fields": ("section_type", "name", "icon", "description")}),
        ("Defaults", {"fields": ("default_config", "available_locales")}),
        AUDIT_FIELDSET,
    )


# ---------------------------------------------------------------------------
# Navigation
# ---------------------------------------------------------------------------
class NavigationItemInline(SortableInlineAdminMixin, admin.TabularInline):
    model = NavigationItem
    extra = 0
    fields = (
        "label_en",
        "label_fa",
        "label_ar",
        "url",
        "page",
        "parent",
        "is_enabled",
        "is_highlight",
        "sort_order",
    )
    autocomplete_fields = ("page",)
    verbose_name_plural = "Navigation items"


@admin.register(NavigationMenu)
class NavigationMenuAdmin(SortableAdminMixin, BaseAdminMixin):
    list_display = ("name", "code", "is_default", "items_count", "is_active", "updated_at")
    list_editable = ("is_default",)
    search_fields = ("name", "code", "description")
    inlines = [NavigationItemInline]
    fieldsets = (
        ("Menu", {"fields": ("name", "code", "is_default", "settings", "description")}),
        AUDIT_FIELDSET,
    )

    @admin.display(description="Items")
    def items_count(self, obj):
        return obj.items.filter(is_deleted=False).count()

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        if obj.is_default:
            NavigationMenu.objects.filter(is_default=True).exclude(pk=obj.pk).update(is_default=False)


@admin.register(NavigationItem)
class NavigationItemAdmin(BaseAdminMixin):
    list_display = ("label_en", "menu", "url", "parent", "is_enabled", "is_highlight", "sort_order")
    list_filter = ("menu", "is_enabled", "is_highlight", "is_active")
    list_editable = ("is_enabled", "is_highlight", "sort_order")
    search_fields = ("label_en", "label_fa", "label_ar", "url")
    autocomplete_fields = ("menu", "page", "parent")


# ---------------------------------------------------------------------------
# Singletons + misc
# ---------------------------------------------------------------------------
@admin.register(FooterConfiguration)
class FooterConfigurationAdmin(BaseAdminMixin, SingletonAdminMixin):
    list_display = ("id", "show_socials", "show_newsletter", "updated_at")
    fieldsets = (
        ("Footer", {"fields": ("copyright_fa", "copyright_en", "copyright_ar")}),
        ("Chrome", {"fields": ("show_socials", "show_newsletter", "newsletter_label")}),
        ("Columns", {"fields": ("columns",)}),
        AUDIT_FIELDSET,
    )


@admin.register(AnnouncementBar)
class AnnouncementBarAdmin(BaseAdminMixin, SingletonAdminMixin):
    list_display = (
        "id",
        "is_enabled",
        "text_en",
        "dismissible",
        "start_at",
        "end_at",
        "updated_at",
    )
    list_editable = ("is_enabled",)
    fieldsets = (
        (
            "Content",
            {
                "fields": (
                    "text_fa",
                    "text_en",
                    "text_ar",
                    "link",
                    "link_label_fa",
                    "link_label_en",
                    "link_label_ar",
                )
            },
        ),
        (
            "Display",
            {
                "fields": (
                    "is_enabled",
                    "dismissible",
                    "start_at",
                    "end_at",
                    "background_color",
                    "text_color",
                )
            },
        ),
        AUDIT_FIELDSET,
    )


@admin.register(HeroConfiguration)
class HeroConfigurationAdmin(BaseAdminMixin, SingletonAdminMixin):
    list_display = ("id", "headline_en", "align", "updated_at")
    fieldsets = (
        ("Headline", {"fields": ("headline_fa", "headline_en", "headline_ar")}),
        ("Subtitle", {"fields": ("subtitle_fa", "subtitle_en", "subtitle_ar")}),
        (
            "Primary CTA",
            {
                "fields": (
                    "primary_cta_label_fa",
                    "primary_cta_label_en",
                    "primary_cta_label_ar",
                    "primary_cta_url",
                )
            },
        ),
        (
            "Secondary CTA",
            {
                "fields": (
                    "secondary_cta_label_fa",
                    "secondary_cta_label_en",
                    "secondary_cta_label_ar",
                    "secondary_cta_url",
                )
            },
        ),
        ("Visuals", {"fields": ("align", "show_grid", "show_mesh", "show_particles")}),
        AUDIT_FIELDSET,
    )


@admin.register(SEOConfiguration)
class SEOConfigurationAdmin(BaseAdminMixin):
    list_display = ("page", "meta_title_en", "canonical_url", "robots", "updated_at")
    search_fields = ("meta_title_en", "meta_title_fa", "meta_title_ar", "canonical_url")
    fieldsets = (
        ("Target", {"fields": ("page", "canonical_url", "robots")}),
        ("Title", {"fields": ("meta_title_fa", "meta_title_en", "meta_title_ar")}),
        (
            "Description",
            {
                "fields": (
                    "meta_description_fa",
                    "meta_description_en",
                    "meta_description_ar",
                )
            },
        ),
        ("Keywords & image", {"fields": ("meta_keywords", "og_image")}),
        AUDIT_FIELDSET,
    )


@admin.register(RedirectRule)
class RedirectRuleAdmin(BaseAdminMixin, ActiveBulkActionsMixin):
    list_display = ("source", "target", "status_code", "is_enabled", "sort_order", "updated_at")
    list_editable = ("is_enabled", "status_code", "sort_order")
    list_filter = ("is_enabled", "status_code", "is_active", "is_deleted")
    search_fields = ("source", "target")
    ordering = ("sort_order", "source")


@admin.register(NewsletterSubscription)
class NewsletterSubscriptionAdmin(BaseAdminMixin):
    list_display = ("email", "locale", "source", "is_active", "unsubscribed_at", "created_at")
    list_filter = ("locale", "source", "is_active", "created_at")
    search_fields = ("email", "source")
    ordering = ("-created_at",)
    readonly_fields = ("email", "locale", "source", "unsubscribe_token", "unsubscribed_at", "created_by", "created_at", "updated_at", "updated_by")
    actions = ["deactivate_selected", "activate_selected"]

    def has_add_permission(self, request):
        return False

    @admin.action(description="Deactivate (unsubscribe) selected")
    def deactivate_selected(self, request, queryset):
        from django.utils import timezone

        updated = queryset.filter(is_active=True).update(is_active=False, unsubscribed_at=timezone.now())
        self.message_user(request, f"{updated} subscriber(s) deactivated.")

    @admin.action(description="Re-activate selected")
    def activate_selected(self, request, queryset):
        updated = queryset.filter(is_active=False).update(is_active=True, unsubscribed_at=None)
        self.message_user(request, f"{updated} subscriber(s) activated.")
