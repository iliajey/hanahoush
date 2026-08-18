"""Contact/inquiry + analytics ingestion serializers."""
from django.conf import settings
from rest_framework import serializers

from apps.analytics.models import ContactRequest


class ContactSubmitSerializer(serializers.Serializer):
    """Public contact-form input."""

    name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    company = serializers.CharField(max_length=255, required=False, allow_blank=True)
    subject = serializers.CharField(max_length=255, required=False, allow_blank=True)
    service_category = serializers.CharField(max_length=100, required=False, allow_blank=True)
    project_type = serializers.CharField(max_length=100, required=False, allow_blank=True)
    budget_range = serializers.CharField(max_length=100, required=False, allow_blank=True)
    preferred_contact = serializers.ChoiceField(
        choices=ContactRequest.PREFERRED_CONTACT_CHOICES,
        default="any",
    )
    message = serializers.CharField(max_length=5000)
    consent = serializers.BooleanField()
    locale = serializers.ChoiceField(choices=["fa", "en", "ar"], default="en")
    source = serializers.CharField(max_length=50, required=False, allow_blank=True)
    website = serializers.CharField(max_length=255, required=False, allow_blank=True)

    def validate_consent(self, value):
        if not value:
            raise serializers.ValidationError("Consent is required to be contacted.")
        return value


class ContactAdminSerializer(serializers.ModelSerializer):
    """Staff view of a contact request (no private leakage beyond admins)."""

    handled_by = serializers.StringRelatedField(read_only=True)
    request_id = serializers.UUIDField(read_only=True)

    class Meta:
        model = ContactRequest
        fields = (
            "id",
            "request_id",
            "name",
            "email",
            "phone",
            "company",
            "subject",
            "service_category",
            "project_type",
            "budget_range",
            "preferred_contact",
            "message",
            "consent",
            "locale",
            "source",
            "status",
            "handled_by",
            "handled_at",
            "created_at",
        )
        read_only_fields = (
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "is_deleted",
            "deleted_at",
        )


class ContactStatusUpdateSerializer(serializers.ModelSerializer):
    """Staff status/handling update."""

    class Meta:
        model = ContactRequest
        fields = ("status",)


class AnalyticsEventInSerializer(serializers.Serializer):
    """One analytics event payload (Phase 8H).

    Validates shape/size only — no credentials or sensitive metadata are
    accepted beyond the documented fields.
    """

    event_name = serializers.CharField(max_length=100)
    timestamp = serializers.DateTimeField(required=False)
    session_key = serializers.CharField(max_length=255, required=False, allow_blank=True)
    client_id = serializers.CharField(max_length=255, required=False, allow_blank=True)
    locale = serializers.CharField(max_length=5, required=False, allow_blank=True)
    path = serializers.CharField(max_length=500, required=False, allow_blank=True)
    referrer = serializers.URLField(required=False, allow_blank=True)
    user_agent = serializers.CharField(max_length=2000, required=False, allow_blank=True)
    metadata = serializers.DictField(required=False, default=dict)

    def validate_event_name(self, value):
        value = value.strip()
        allowlist = getattr(settings, "ANALYTICS_EVENT_ALLOWLIST", [])
        if allowlist and value not in allowlist:
            raise serializers.ValidationError("Unknown event name.")
        return value
