from django.contrib import admin

from apps.core.admin import (
    ActiveBulkActionsMixin,
    BaseAdminMixin,
    PublishableAdminMixin,
    PublishableBulkActionsMixin,
    SingletonAdminMixin,
)

from .models import (
    FAQ,
    AboutPage,
    Office,
    Partner,
    SiteSettings,
    SocialLink,
    TeamMember,
    Testimonial,
    Timeline,
)

AUDIT_FIELDSET = (
    "Audit",
    {"classes": ("collapse",), "fields": ("created_by", "updated_by", "created_at", "updated_at")},
)


@admin.register(AboutPage)
class AboutPageAdmin(SingletonAdminMixin, PublishableBulkActionsMixin, PublishableAdminMixin):
    """About page — only ONE instance is allowed."""

    list_display = ("title_en", "status", "is_public", "updated_at")
    list_filter = ("status", "is_public", "is_active", "is_deleted")
    search_fields = PublishableAdminMixin.search_fields + ("mission_en", "vision_en")
    autocomplete_fields = ("hero_image", "og_image")
    prepopulated_fields = {"slug": ("title_en",)}
    fieldsets = PublishableAdminMixin.fieldsets + (
        (
            "About page details",
            {
                "fields": (
                    "hero_image",
                    "mission_fa",
                    "mission_en",
                    "mission_ar",
                    "vision_fa",
                    "vision_en",
                    "vision_ar",
                )
            },
        ),
    )


@admin.register(TeamMember)
class TeamMemberAdmin(ActiveBulkActionsMixin, BaseAdminMixin):
    list_display = ("name", "position_en", "email", "sort_order", "is_active", "updated_at")
    list_filter = ("is_active", "is_deleted")
    search_fields = ("name", "position_en", "position_fa", "position_ar", "bio_en", "email")
    autocomplete_fields = ("avatar",)
    list_editable = ("sort_order", "is_active")
    fieldsets = (
        ("Identity", {"fields": ("name", "avatar", "email", "linkedin_url")}),
        ("Position", {"fields": ("position_fa", "position_en", "position_ar")}),
        ("Bio", {"fields": ("bio_fa", "bio_en", "bio_ar")}),
        ("Display", {"fields": ("sort_order", "is_active")}),
        AUDIT_FIELDSET,
    )


@admin.register(Partner)
class PartnerAdmin(ActiveBulkActionsMixin, BaseAdminMixin):
    list_display = ("name", "website", "sort_order", "is_active", "updated_at")
    list_filter = ("is_active", "is_deleted")
    search_fields = ("name", "website", "description_en", "description_fa", "description_ar")
    autocomplete_fields = ("logo",)
    list_editable = ("sort_order", "is_active")
    fieldsets = (
        ("Partner", {"fields": ("name", "logo", "website", "sort_order", "is_active")}),
        ("Description", {"fields": ("description_fa", "description_en", "description_ar")}),
        AUDIT_FIELDSET,
    )


@admin.register(Testimonial)
class TestimonialAdmin(ActiveBulkActionsMixin, BaseAdminMixin):
    list_display = ("author_name", "company", "rating", "is_featured", "sort_order", "updated_at")
    list_filter = ("rating", "is_featured", "is_active", "is_deleted")
    search_fields = ("author_name", "company", "content_en", "content_fa", "content_ar")
    autocomplete_fields = ("avatar",)
    list_editable = ("rating", "is_featured", "sort_order")
    fieldsets = (
        ("Author", {"fields": ("author_name", "author_role", "company", "avatar")}),
        ("Content", {"fields": ("content_fa", "content_en", "content_ar", "rating")}),
        ("Display", {"fields": ("is_featured", "sort_order", "is_active")}),
        AUDIT_FIELDSET,
    )


@admin.register(FAQ)
class FAQAdmin(ActiveBulkActionsMixin, BaseAdminMixin):
    list_display = ("question_en", "category", "is_featured", "sort_order", "is_active", "updated_at")
    list_filter = ("category", "is_featured", "is_active", "is_deleted")
    search_fields = ("question_en", "question_fa", "question_ar", "answer_en", "category")
    list_editable = ("sort_order", "is_active")
    fieldsets = (
        ("Question", {"fields": ("question_fa", "question_en", "question_ar", "category")}),
        ("Answer", {"fields": ("answer_fa", "answer_en", "answer_ar")}),
        ("Display", {"fields": ("is_featured", "sort_order", "is_active")}),
        AUDIT_FIELDSET,
    )


@admin.register(Timeline)
class TimelineAdmin(ActiveBulkActionsMixin, BaseAdminMixin):
    list_display = ("title_en", "date", "sort_order", "is_active", "updated_at")
    list_filter = ("is_active", "is_deleted")
    search_fields = ("title_en", "title_fa", "title_ar", "content_en")
    list_editable = ("sort_order", "is_active")
    fieldsets = (
        ("Title", {"fields": ("title_fa", "title_en", "title_ar")}),
        ("Content", {"fields": ("content_fa", "content_en", "content_ar", "date", "icon")}),
        ("Display", {"fields": ("sort_order", "is_active")}),
        AUDIT_FIELDSET,
    )


@admin.register(SocialLink)
class SocialLinkAdmin(ActiveBulkActionsMixin, BaseAdminMixin):
    list_display = ("platform", "label", "url", "sort_order", "is_active", "updated_at")
    list_filter = ("platform", "is_active", "is_deleted")
    search_fields = ("label", "url", "platform")
    list_editable = ("sort_order", "is_active")
    fieldsets = (
        ("Link", {"fields": ("platform", "label", "url", "icon")}),
        ("Display", {"fields": ("sort_order", "is_active")}),
        AUDIT_FIELDSET,
    )


@admin.register(Office)
class OfficeAdmin(ActiveBulkActionsMixin, BaseAdminMixin):
    list_display = ("name", "city", "country", "is_headquarters", "sort_order", "is_active", "updated_at")
    list_filter = ("country", "city", "is_headquarters", "is_active", "is_deleted")
    search_fields = ("name", "city", "country", "address_en", "address_fa", "address_ar")
    list_editable = ("sort_order", "is_active")
    fieldsets = (
        ("Office", {"fields": ("name", "is_headquarters", "sort_order", "is_active")}),
        ("Address", {"fields": ("address_fa", "address_en", "address_ar", "city", "country")}),
        ("Geo", {"fields": ("latitude", "longitude", "map_embed_url")}),
        ("Contact", {"fields": ("phone", "email")}),
        AUDIT_FIELDSET,
    )


@admin.register(SiteSettings)
class SiteSettingsAdmin(SingletonAdminMixin, BaseAdminMixin):
    """Global settings — only ONE instance is allowed."""

    list_display = ("site_name", "default_locale", "contact_email", "maintenance_mode", "updated_at")
    search_fields = ("site_name", "contact_email")
    autocomplete_fields = ("logo", "favicon")
    readonly_fields = BaseAdminMixin.readonly_fields + ("created_by", "updated_by")
    fieldsets = (
        ("Branding", {"fields": ("site_name", "tagline_fa", "tagline_en", "tagline_ar", "logo", "favicon")}),
        ("Contact", {"fields": ("contact_email", "contact_phone", "address_fa", "address_en", "address_ar")}),
        ("Localization", {"fields": ("default_locale", "supported_locales")}),
        ("SEO & Analytics", {"fields": ("meta_title", "meta_description", "analytics_code")}),
        ("Maintenance", {"fields": ("maintenance_mode", "is_active")}),
        ("Audit", {"classes": ("collapse",), "fields": ("created_by", "updated_by", "created_at", "updated_at")}),
    )
