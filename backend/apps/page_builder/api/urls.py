"""Page Builder API URL routes.

Mounted at the empty prefix; ``config.api.v1`` includes this module.
Provides ``/pages/`` via the router and the remaining page-builder surfaces
as plain views.
"""
from django.urls import include, path
from rest_framework.routers import SimpleRouter

from .admin_views import NewsletterSubscriptionViewSet
from .views import (
    PageViewSet,
    announcement_view,
    footer_view,
    hero_view,
    navigation_view,
    newsletter_subscribe_view,
    newsletter_unsubscribe_view,
    page_builder_view,
    redirects_view,
    seo_view,
)

router = SimpleRouter()
router.register(r"pages", PageViewSet, basename="page")

admin_router = SimpleRouter()
admin_router.register(r"newsletter", NewsletterSubscriptionViewSet, basename="admin-newsletter")

urlpatterns = [
    path("page-builder/", page_builder_view, name="page-builder"),
    path("navigation/", navigation_view, name="navigation"),
    path("footer/", footer_view, name="footer"),
    path("announcement/", announcement_view, name="announcement"),
    path("hero/", hero_view, name="hero"),
    path("seo/", seo_view, name="seo"),
    path("redirects/", redirects_view, name="redirects"),
    path("newsletter/subscribe/", newsletter_subscribe_view, name="newsletter-subscribe"),
    path("newsletter/unsubscribe/", newsletter_unsubscribe_view, name="newsletter-unsubscribe"),
    path("admin/", include(admin_router.urls)),
    *router.urls,
]
