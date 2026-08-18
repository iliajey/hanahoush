"""Company API serializers.

Public read serializers for the company domain (about, team, partners,
testimonials, FAQ, timeline, social links, site settings).

Multilingual models return raw ``*_fa/_en/_ar`` fields **and** a computed
localized field (``title``, ``description``, ``question``, ...) resolved from
the request language via ``Accept-Language``.
"""
from rest_framework import serializers

from apps.company.models import (
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
from config.api.base.serializers import PublishableSerializerMixin


class LocalizedSerializerMixin:
    """Adds computed localized fields to a serializer output.

    For every configured ``localized_fields`` pair (output field → base
    field name), emits ``output`` resolved as ``<base>_<lang>`` with a
    fallback to ``<base>_en``.
    """

    localized_fields: dict[str, str] = {}

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        lang = request.LANGUAGE_CODE if request else "en"
        if lang not in ("fa", "en", "ar"):
            lang = "en"
        for output_field, base in self.localized_fields.items():
            value = getattr(instance, f"{base}_{lang}", None)
            if not value:
                value = getattr(instance, f"{base}_en", None)
            data[output_field] = value
        return data


def media_ref(obj, field_name="cover_image"):
    """Serialize a MediaFile FK into a compact dict (or None)."""
    media = getattr(obj, field_name, None)
    if media is None:
        return None
    return {
        "id": media.id,
        "file": media.file.url,
        "alt_text_fa": media.alt_text_fa,
        "alt_text_en": media.alt_text_en,
        "alt_text_ar": media.alt_text_ar,
    }


# ---------------------------------------------------------------------------
# About
# ---------------------------------------------------------------------------
class AboutPageSerializer(PublishableSerializerMixin, serializers.ModelSerializer):
    """Serializer for the about page (singleton in practice)."""

    hero_image = serializers.SerializerMethodField(read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    is_published = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = AboutPage
        fields = (
            "id",
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
            "mission_fa",
            "mission_en",
            "mission_ar",
            "vision_fa",
            "vision_en",
            "vision_ar",
            "hero_image",
            "status",
            "status_display",
            "is_published",
            "is_featured",
            "is_public",
            "published_at",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "created_at", "updated_at", "created_by", "updated_by", "is_deleted", "deleted_at"
        )

    def get_hero_image(self, obj):
        return media_ref(obj, "hero_image")

    def get_is_published(self, obj) -> bool:
        return obj.status == "published" and obj.is_public


class TeamMemberSerializer(LocalizedSerializerMixin, serializers.ModelSerializer):
    """Serializer for team members."""

    localized_fields = {"position": "position", "bio": "bio"}
    avatar = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = TeamMember
        fields = (
            "id",
            "name",
            "position_fa",
            "position_en",
            "position_ar",
            "bio_fa",
            "bio_en",
            "bio_ar",
            "avatar",
            "email",
            "linkedin_url",
            "sort_order",
        )
        read_only_fields = (
            "created_at", "updated_at", "created_by", "updated_by", "is_deleted", "deleted_at"
        )

    def get_avatar(self, obj):
        return media_ref(obj, "avatar")


# ---------------------------------------------------------------------------
# Partners / Testimonials / FAQ / Timeline
# ---------------------------------------------------------------------------
class PartnerSerializer(LocalizedSerializerMixin, serializers.ModelSerializer):
    """Serializer for partners."""

    localized_fields = {"description": "description"}
    logo = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Partner
        fields = (
            "id",
            "name",
            "logo",
            "website",
            "description_fa",
            "description_en",
            "description_ar",
            "sort_order",
        )
        read_only_fields = (
            "created_at", "updated_at", "created_by", "updated_by", "is_deleted", "deleted_at"
        )

    def get_logo(self, obj):
        return media_ref(obj, "logo")


class TestimonialSerializer(LocalizedSerializerMixin, serializers.ModelSerializer):
    """Serializer for testimonials."""

    localized_fields = {"content": "content"}
    avatar = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Testimonial
        fields = (
            "id",
            "author_name",
            "author_role",
            "company",
            "content_fa",
            "content_en",
            "content_ar",
            "rating",
            "avatar",
            "is_featured",
            "sort_order",
        )
        read_only_fields = (
            "created_at", "updated_at", "created_by", "updated_by", "is_deleted", "deleted_at"
        )

    def get_avatar(self, obj):
        return media_ref(obj, "avatar")


class FAQSerializer(LocalizedSerializerMixin, serializers.ModelSerializer):
    """Serializer for FAQ entries."""

    localized_fields = {"question": "question", "answer": "answer"}

    class Meta:
        model = FAQ
        fields = (
            "id",
            "question_fa",
            "question_en",
            "question_ar",
            "answer_fa",
            "answer_en",
            "answer_ar",
            "category",
            "is_featured",
            "sort_order",
        )
        read_only_fields = (
            "created_at", "updated_at", "created_by", "updated_by", "is_deleted", "deleted_at"
        )


class TimelineSerializer(LocalizedSerializerMixin, serializers.ModelSerializer):
    """Serializer for timeline milestones."""

    localized_fields = {"title": "title", "content": "content"}

    class Meta:
        model = Timeline
        fields = (
            "id",
            "title_fa",
            "title_en",
            "title_ar",
            "content_fa",
            "content_en",
            "content_ar",
            "date",
            "icon",
            "sort_order",
        )
        read_only_fields = (
            "created_at", "updated_at", "created_by", "updated_by", "is_deleted", "deleted_at"
        )


# ---------------------------------------------------------------------------
# Social / Offices / Site settings
# ---------------------------------------------------------------------------
class SocialLinkSerializer(serializers.ModelSerializer):
    """Serializer for social links."""

    class Meta:
        model = SocialLink
        fields = ("id", "platform", "label", "url", "icon", "sort_order")
        read_only_fields = (
            "created_at", "updated_at", "created_by", "updated_by", "is_deleted", "deleted_at"
        )


class OfficeSerializer(LocalizedSerializerMixin, serializers.ModelSerializer):
    """Serializer for offices."""

    localized_fields = {"address": "address"}

    class Meta:
        model = Office
        fields = (
            "id",
            "name",
            "address_fa",
            "address_en",
            "address_ar",
            "city",
            "country",
            "latitude",
            "longitude",
            "phone",
            "email",
            "is_headquarters",
            "sort_order",
        )
        read_only_fields = (
            "created_at", "updated_at", "created_by", "updated_by", "is_deleted", "deleted_at"
        )


class SiteSettingsSerializer(LocalizedSerializerMixin, serializers.ModelSerializer):
    """Serializer for the site-wide settings singleton."""

    localized_fields = {"tagline": "tagline", "address": "address"}
    logo = serializers.SerializerMethodField(read_only=True)
    favicon = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = SiteSettings
        fields = (
            "id",
            "site_name",
            "tagline_fa",
            "tagline_en",
            "tagline_ar",
            "logo",
            "favicon",
            "contact_email",
            "contact_phone",
            "address_fa",
            "address_en",
            "address_ar",
            "default_locale",
            "supported_locales",
            "maintenance_mode",
            "meta_title",
            "meta_description",
        )
        read_only_fields = fields

    def get_logo(self, obj):
        return media_ref(obj, "logo")

    def get_favicon(self, obj):
        return media_ref(obj, "favicon")

