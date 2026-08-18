"""Page Builder API views.

Public, read-only surfaces:
- ``/pages/``       → list + retrieve published pages (composed layout).
- ``/page-builder/``→ section registry + page index (for the dev console).
- ``/navigation/``  → navigation menu (model-driven, shape-compatible).
- ``/footer/``      → footer configuration (model-driven, shape-compatible).
- ``/announcement/``→ announcement bar.
- ``/seo/``         → SEO configuration (per page or site default).
- ``/hero/``        → default hero configuration.
- ``/redirects/``   → redirect rules.

Draft protection: public views only ever expose ``status=published``.
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiResponse, extend_schema

from apps.core.models import Status
from config.api.base.viewsets import BaseViewSet, no_versioning

from ..models import (
    AnnouncementBar,
    FooterConfiguration,
    HeroConfiguration,
    NavigationMenu,
    Page,
    RedirectRule,
    SectionConfiguration,
    SEOConfiguration,
)
from .filters import PageFilterSet
from .serializers import (
    AnnouncementSerializer,
    FooterSerializer,
    HeroConfigurationSerializer,
    NavigationSerializer,
    NewsletterSubscribeInSerializer,
    NewsletterSubscriptionSerializer,
    NewsletterUnsubscribeInSerializer,
    PageDetailSerializer,
    PageListSerializer,
    RedirectRuleSerializer,
    SectionConfigurationSerializer,
    SEOSerializer,
)


class NewsletterSubscribeThrottle(AnonRateThrottle):
    """Per-IP cap on public newsletter signups (scope: ``newsletter``)."""

    scope = "newsletter"


class PageViewSet(BaseViewSet):
    """List + retrieve published pages. Retrieval is by slug.

    Only ``status=published`` pages are ever returned (draft protection).
    """

    queryset = Page.objects.filter(is_active=True, is_deleted=False)
    serializer_class = PageListSerializer
    permission_classes = [AllowAny]
    http_method_names = ("get", "head", "options")
    lookup_field = "slug"
    lookup_url_kwarg = "slug"
    filterset_class = PageFilterSet
    ordering_fields = ["title_en", "sort_order", "created_at", "updated_at", "version"]
    ordering = ["-is_home", "sort_order", "title_en"]
    search_fields = ["title_en", "title_fa", "title_ar", "slug"]

    def get_queryset(self):
        qs = super().get_queryset()
        # Draft protection: only staff may retrieve non-published pages.
        user = getattr(self.request, "user", None)
        can_view_unpublished = bool(user and user.is_authenticated and user.is_staff)
        if not can_view_unpublished:
            qs = qs.filter(status=Status.PUBLISHED)
        return qs

    def get_serializer_class(self):
        if self.action == "retrieve":
            return PageDetailSerializer
        return PageListSerializer

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx


@no_versioning
@extend_schema(
    responses={200: OpenApiResponse(description="Section registry + published page index.", response=OpenApiTypes.OBJECT)},
    tags=["page-builder"],
)
@api_view(["GET"])
@permission_classes([AllowAny])
def page_builder_view(request: Request):
    """Return the section registry + published page index."""
    registry = SectionConfiguration.objects.filter(
        is_active=True,
        is_deleted=False,
    ).order_by("section_type")
    pages = Page.objects.filter(
        is_active=True,
        is_deleted=False,
        status=Status.PUBLISHED,
    ).order_by("-is_home", "sort_order")
    page_serializer = PageListSerializer(pages, many=True, context={"request": request})
    data = {
        "section_types": SectionConfigurationSerializer(
            registry,
            many=True,
            context={"request": request},
        ).data,
        "pages": page_serializer.data,
    }
    return Response({"success": True, "message": "", "data": data, "errors": None})


@no_versioning
@extend_schema(
    responses={200: OpenApiResponse(description="Navigation menu.", response=NavigationSerializer)},
    tags=["navigation"],
)
@api_view(["GET"])
@permission_classes([AllowAny])
def navigation_view(request: Request):
    menu = NavigationMenu.objects.filter(is_active=True, is_deleted=False, is_default=True).first()
    menu = menu or NavigationMenu.objects.filter(is_active=True, is_deleted=False).first()
    if menu is None:
        data = {"items": [], "cta": None, "contact": None}
    else:
        data = NavigationSerializer(menu, context={"request": request}).data
    return Response({"success": True, "message": "", "data": data, "errors": None})


@no_versioning
@extend_schema(
    responses={200: OpenApiResponse(description="Footer configuration.", response=FooterSerializer)},
    tags=["navigation"],
)
@api_view(["GET"])
@permission_classes([AllowAny])
def footer_view(request: Request):
    config = FooterConfiguration.get_config()
    data = FooterSerializer(config, context={"request": request}).data
    return Response({"success": True, "message": "", "data": data, "errors": None})


@no_versioning
@extend_schema(
    responses={200: OpenApiResponse(description="Announcement bar.", response=AnnouncementSerializer)},
    tags=["page-builder"],
)
@api_view(["GET"])
@permission_classes([AllowAny])
def announcement_view(request: Request):
    bar = AnnouncementBar.get_bar()
    data = AnnouncementSerializer(bar, context={"request": request}).data
    return Response({"success": True, "message": "", "data": data, "errors": None})


@no_versioning
@extend_schema(
    responses={200: OpenApiResponse(description="Default hero configuration.", response=HeroConfigurationSerializer)},
    tags=["page-builder"],
)
@api_view(["GET"])
@permission_classes([AllowAny])
def hero_view(request: Request):
    config = HeroConfiguration.get_config()
    data = HeroConfigurationSerializer(config, context={"request": request}).data
    return Response({"success": True, "message": "", "data": data, "errors": None})


@no_versioning
@extend_schema(
    responses={200: OpenApiResponse(description="SEO for a page slug or the site default.", response=SEOSerializer)},
    tags=["page-builder"],
)
@api_view(["GET"])
@permission_classes([AllowAny])
def seo_view(request: Request):
    """SEO for ``?slug=home`` or the site-wide default."""
    slug = request.query_params.get("slug")
    page = (
        Page.objects.filter(slug=slug, status=Status.PUBLISHED, is_active=True).first()
        if slug
        else None
    )
    seo = getattr(page, "seo", None) if page else None
    if seo is None:
        seo = SEOConfiguration.get_default()
    data = SEOSerializer(seo, context={"request": request}).data
    if page:
        data["page_slug"] = page.slug
    return Response({"success": True, "message": "", "data": data, "errors": None})


@no_versioning
@extend_schema(
    responses={200: OpenApiResponse(description="Enabled redirect rules.", response=RedirectRuleSerializer(many=True))},
    tags=["page-builder"],
)
@api_view(["GET"])
@permission_classes([AllowAny])
def redirects_view(request: Request):
    rules = RedirectRule.objects.filter(
        is_active=True,
        is_deleted=False,
        is_enabled=True,
    ).order_by("sort_order", "source")
    data = RedirectRuleSerializer(rules, many=True, context={"request": request}).data
    return Response({"success": True, "message": "", "data": data, "errors": None})


@no_versioning
@extend_schema(
    request=NewsletterSubscribeInSerializer,
    responses={
        201: OpenApiResponse(description="Subscribed", response=NewsletterSubscriptionSerializer),
        409: OpenApiResponse(description="Already subscribed (duplicate)."),
        400: OpenApiResponse(description="Validation error."),
        429: OpenApiResponse(description="Too many requests."),
    },
    tags=["newsletter"],
)
@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([NewsletterSubscribeThrottle])
def newsletter_subscribe_view(request: Request):
    """Subscribe an email to the newsletter (idempotent, single system)."""
    import secrets

    from django.db import IntegrityError

    from ..models import NewsletterSubscription

    serializer = NewsletterSubscribeInSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    email = serializer.validated_data["email"]
    locale = serializer.validated_data.get("locale", "en")
    source = serializer.validated_data.get("source", "")

    existing = NewsletterSubscription.objects.filter(email=email).first()
    if existing:
        return Response(
            {"success": False, "message": "Already subscribed.", "data": None, "errors": {"email": ["already subscribed"]}},
            status=status.HTTP_409_CONFLICT,
        )

    try:
        subscription = NewsletterSubscription.objects.create(
            email=email,
            locale=locale,
            source=source,
            unsubscribe_token=secrets.token_urlsafe(32),
        )
    except IntegrityError:
        return Response(
            {"success": False, "message": "Already subscribed.", "data": None, "errors": {"email": ["already subscribed"]}},
            status=status.HTTP_409_CONFLICT,
        )

    data = NewsletterSubscriptionSerializer(subscription).data
    return Response({"success": True, "message": "Subscribed", "data": data, "errors": None}, status=status.HTTP_201_CREATED)


@no_versioning
@extend_schema(
    request=NewsletterUnsubscribeInSerializer,
    responses={
        200: OpenApiResponse(description="Unsubscribed (never reveals whether an address existed)."),
        400: OpenApiResponse(description="Token required."),
    },
    tags=["newsletter"],
)
@api_view(["POST"])
@permission_classes([AllowAny])
def newsletter_unsubscribe_view(request: Request):
    """Unsubscribe using a one-click token (privacy-safe; no enumeration)."""
    from ..models import NewsletterSubscription

    token = (request.data.get("token") or request.query_params.get("token") or "").strip()
    if not token:
        return Response(
            {"success": False, "message": "Token required.", "data": None, "errors": {"token": ["required"]}},
            status=status.HTTP_400_BAD_REQUEST,
        )
    subscriber = NewsletterSubscription.objects.filter(unsubscribe_token=token).first()
    if subscriber is None or not subscriber.is_subscribed:
        # Do not reveal whether an address exists.
        return Response({"success": True, "message": "Unsubscribed", "data": {"status": "unsubscribed"}, "errors": None})
    subscriber.unsubscribe()
    return Response({"success": True, "message": "Unsubscribed", "data": {"status": "unsubscribed"}, "errors": None})
