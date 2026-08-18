"""Search API serializers (Phase 8H).

The search endpoint returns a flat list of unified search hits; each hit is
already fully localized by the search service (the requested locale drives the
localized ``title`` / ``excerpt`` values).
"""
from rest_framework import serializers


class SearchResultSerializer(serializers.Serializer):
    """A single unified search hit."""

    type = serializers.CharField()
    id = serializers.IntegerField()
    title = serializers.CharField()
    excerpt = serializers.CharField()
    slug = serializers.CharField()
    image = serializers.CharField(required=False, allow_null=True)
    url = serializers.CharField()
    relevance = serializers.FloatField()
    published_at = serializers.DateTimeField(allow_null=True)
    category_slug = serializers.CharField(allow_null=True)
    category_title = serializers.CharField(allow_null=True)
    locale = serializers.CharField()


class SearchInSerializer(serializers.Serializer):
    """Query parameters for the search endpoint."""

    q = serializers.CharField(max_length=100, required=False, allow_blank=True)
    type = serializers.ChoiceField(choices=["article", "project", "service", "page"], required=False)
    locale = serializers.ChoiceField(choices=["fa", "en", "ar"], required=False)
    category = serializers.CharField(max_length=255, required=False)
    ordering = serializers.ChoiceField(
        choices=["relevance", "published_at", "-published_at"],
        required=False,
    )
