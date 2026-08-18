"""Page Builder API serializers.

Responses reuse the standard Hanahoush envelope and honor ``Accept-Language``
for computed localized fields and section ``config`` values.
"""
from rest_framework import serializers

from apps.company.models import SiteSettings

from ..localization import normalize_lang, resolve_localized, resolve_section_config
from ..models import (
    AnnouncementBar,
    FooterConfiguration,
    HeroConfiguration,
    NavigationItem,
    NavigationMenu,
    NewsletterSubscription,
    Page,
    PageSection,
    RedirectRule,
    SectionConfiguration,
    SEOConfiguration,
)


class LocalizedSerializerMixin:
    """Adds computed localized fields resolved from ``Accept-Language``."""

    localized_fields: dict[str, str] = {}

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        lang = normalize_lang(getattr(request, "LANGUAGE_CODE", "en"))
        for output, base in self.localized_fields.items():
            value = getattr(instance, f"{base}_{lang}", None)
            if not value:
                value = getattr(instance, f"{base}_en", None)
            data[output] = value
        return data


def _request_lang(context) -> str:
    request = context.get("request")
    return normalize_lang(getattr(request, "LANGUAGE_CODE", "en"))


# ---------------------------------------------------------------------------
# SEO
# ---------------------------------------------------------------------------
class SEOSerializer(serializers.ModelSerializer):
    """Localized SEO surface for a page."""

    meta_title = serializers.SerializerMethodField()
    meta_description = serializers.SerializerMethodField()
    og_image = serializers.SerializerMethodField()

    class Meta:
        model = SEOConfiguration
        fields = (
            "meta_title",
            "meta_description",
            "meta_keywords",
            "canonical_url",
            "robots",
            "og_image",
        )

    def get_meta_title(self, obj):
        lang = _request_lang(self.context)
        return getattr(obj, f"meta_title_{lang}") or obj.meta_title_en or None

    def get_meta_description(self, obj):
        lang = _request_lang(self.context)
        return getattr(obj, f"meta_description_{lang}") or obj.meta_description_en or None

    def get_og_image(self, obj):
        if obj.og_image:
            return obj.og_image.file.url
        return None


# ---------------------------------------------------------------------------
# Pages
# ---------------------------------------------------------------------------
class PageSectionSerializer(serializers.ModelSerializer):
    """A section with its language-resolved configuration."""

    type = serializers.CharField(source="section_type", read_only=True)
    title = serializers.SerializerMethodField()
    config = serializers.SerializerMethodField()
    order = serializers.IntegerField(source="sort_order", read_only=True)

    class Meta:
        model = PageSection
        fields = ("id", "type", "title", "is_enabled", "order", "config")

    def get_title(self, obj):
        lang = _request_lang(self.context)
        return getattr(obj, f"title_{lang}") or obj.title_en or None

    def get_config(self, obj):
        lang = _request_lang(self.context)
        return resolve_section_config(obj.config or {}, obj.language_overrides or {}, lang)


class PageListSerializer(serializers.ModelSerializer):
    title = serializers.SerializerMethodField()
    sections_count = serializers.SerializerMethodField()

    class Meta:
        model = Page
        fields = (
            "id",
            "slug",
            "title",
            "status",
            "is_home",
            "template",
            "version",
            "sections_count",
            "updated_at",
        )

    def get_title(self, obj):
        lang = _request_lang(self.context)
        return getattr(obj, f"title_{lang}") or obj.title_en

    def get_sections_count(self, obj):
        return obj.sections.filter(is_deleted=False, is_enabled=True).count()


class PageDetailSerializer(PageListSerializer):
    """The composed page: SEO + ordered enabled sections."""

    seo = serializers.SerializerMethodField()
    sections = serializers.SerializerMethodField()
    total_sections = serializers.SerializerMethodField()

    class Meta(PageListSerializer.Meta):
        fields = PageListSerializer.Meta.fields + (
            "version_at",
            "seo",
            "sections",
            "total_sections",
        )

    def get_total_sections(self, obj):
        return obj.sections.filter(is_deleted=False).count()

    def get_seo(self, obj):
        seo = getattr(obj, "seo", None)
        if seo is None:
            seo = SEOConfiguration.get_default()
        return SEOSerializer(seo, context=self.context).data

    def get_sections(self, obj):
        qs = obj.sections.filter(is_deleted=False, is_enabled=True).order_by("sort_order", "id")
        return PageSectionSerializer(qs, many=True, context=self.context).data


class SectionConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = SectionConfiguration
        fields = (
            "section_type",
            "name",
            "description",
            "icon",
            "default_config",
            "available_locales",
        )


# ---------------------------------------------------------------------------
# Navigation / Footer
# ---------------------------------------------------------------------------
class NavigationItemNestedSerializer(serializers.ModelSerializer):
    label = serializers.SerializerMethodField()
    href = serializers.SerializerMethodField()
    children = serializers.SerializerMethodField()

    class Meta:
        model = NavigationItem
        fields = ("label", "href", "is_highlight", "children")

    def get_label(self, obj):
        lang = _request_lang(self.context)
        return getattr(obj, f"label_{lang}") or obj.label_en

    def get_href(self, obj):
        if obj.url:
            return obj.url
        if obj.page_id:
            return f"/pages/{obj.page.slug}/"
        return "#"

    def get_children(self, obj):
        children = obj.children.filter(
            is_deleted=False,
            is_enabled=True,
        ).order_by("sort_order", "id")
        return NavigationItemNestedSerializer(children, many=True, context=self.context).data


class NavigationSerializer(serializers.Serializer):
    """Public navigation surface — shape kept compatible with the app.

    Returns ``{ items: [{label, href}], cta, contact }`` so the existing
    frontend navigation hooks keep working unchanged.
    """

    def to_representation(self, menu: NavigationMenu):
        items = menu.items.filter(
            is_deleted=False,
            is_enabled=True,
            parent__isnull=True,
        ).order_by("sort_order", "id")
        serialized = NavigationItemNestedSerializer(items, many=True, context=self.context).data
        flat = [{"label": item["label"], "href": item["href"]} for item in serialized]
        cta = next((item for item in serialized if item.get("is_highlight")), None)
        contact = next(
            (item for item in serialized if item.get("href", "").startswith("/contact")),
            None,
        )
        return {
            "items": flat,
            "cta": {"label": cta["label"], "href": cta["href"]} if cta else None,
            "contact": {"label": contact["label"], "href": contact["href"]} if contact else None,
        }


class FooterSerializer(serializers.Serializer):
    """Footer surface — shape kept compatible with the app.

    Columns come from ``FooterConfiguration.columns``; socials from the
    existing ``SocialLink`` model; company info from ``SiteSettings``.
    """

    def to_representation(self, config: FooterConfiguration):
        lang = _request_lang(self.context)
        columns = resolve_localized(config.columns or [], lang)

        from apps.company.models import SocialLink

        social_links = SocialLink.objects.filter(
            is_active=True,
            is_deleted=False,
        ).order_by("sort_order", "id")
        socials = [
            {
                "platform": link.platform,
                "label": link.label or link.get_platform_display(),
                "url": link.url,
                "icon": link.icon,
            }
            for link in social_links
        ]
        settings = SiteSettings.get_settings()
        copyright_text = getattr(config, f"copyright_{lang}") or config.copyright_en or ""
        company = {
            "name": settings.site_name,
            "year": _current_year(),
            "tagline": getattr(settings, f"tagline_{lang}") or settings.tagline_en,
            "contact_email": settings.contact_email,
            "contact_phone": settings.contact_phone,
            "copyright": copyright_text,
        }
        return {
            "columns": columns,
            "socials": socials,
            "newsletter": (
                {"enabled": config.show_newsletter, "label": config.newsletter_label}
                if config.show_newsletter
                else None
            ),
            "company": company,
        }


def _current_year() -> int:
    import datetime

    return datetime.date.today().year


# ---------------------------------------------------------------------------
# Announcement / Hero / Redirect
# ---------------------------------------------------------------------------
class AnnouncementSerializer(LocalizedSerializerMixin, serializers.ModelSerializer):
    localized_fields = {"text": "text", "link_label": "link_label"}

    class Meta:
        model = AnnouncementBar
        fields = (
            "is_enabled",
            "link",
            "dismissible",
            "background_color",
            "text_color",
            "start_at",
            "end_at",
        )


class HeroConfigurationSerializer(LocalizedSerializerMixin, serializers.ModelSerializer):
    localized_fields = {
        "headline": "headline",
        "subtitle": "subtitle",
        "primary_cta_label": "primary_cta_label",
        "secondary_cta_label": "secondary_cta_label",
    }

    class Meta:
        model = HeroConfiguration
        fields = (
            "primary_cta_url",
            "secondary_cta_url",
            "align",
            "show_grid",
            "show_mesh",
            "show_particles",
        )


class RedirectRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = RedirectRule
        fields = ("source", "target", "status_code", "is_enabled")


class NewsletterSubscribeInSerializer(serializers.Serializer):
    email = serializers.EmailField()
    locale = serializers.ChoiceField(choices=["fa", "en", "ar"], default="en", required=False)
    source = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")

    def validate_email(self, value):
        return value.strip().lower()


class NewsletterSubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsletterSubscription
        fields = ("id", "email", "locale", "source", "created_at")
        read_only_fields = fields


class NewsletterUnsubscribeInSerializer(serializers.Serializer):
    """One-click unsubscribe token input."""

    token = serializers.CharField(max_length=64)

    def validate_token(self, value):
        return value.strip()


class NewsletterSubscriptionAdminSerializer(serializers.ModelSerializer):
    """Staff view of a subscriber — never exposes the unsubscribe token.

    Emails are personal data: this serializer is only ever used inside
    ``IsAdminUser`` viewsets (no public surface references it).
    """

    is_subscribed = serializers.SerializerMethodField()

    class Meta:
        model = NewsletterSubscription
        fields = (
            "id",
            "email",
            "locale",
            "source",
            "is_active",
            "is_subscribed",
            "unsubscribed_at",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields

    def get_is_subscribed(self, obj) -> bool:
        return obj.is_subscribed
