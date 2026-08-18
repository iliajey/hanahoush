"""Company API URL routes.

Registered at the empty prefix; ``config.api.v1`` mounts this module at
``company/``.
"""
from django.urls import path
from rest_framework.routers import SimpleRouter

from .views import site_settings_view
from .viewsets import (
    AboutPageViewSet,
    FAQViewSet,
    OfficeViewSet,
    PartnerViewSet,
    SocialLinkViewSet,
    TeamMemberViewSet,
    TestimonialViewSet,
    TimelineViewSet,
)

router = SimpleRouter()
router.register(r"about", AboutPageViewSet, basename="about")
router.register(r"team", TeamMemberViewSet, basename="team")
router.register(r"partners", PartnerViewSet, basename="partner")
router.register(r"testimonials", TestimonialViewSet, basename="testimonial")
router.register(r"faqs", FAQViewSet, basename="faq")
router.register(r"timeline", TimelineViewSet, basename="timeline")
router.register(r"social-links", SocialLinkViewSet, basename="social-link")
router.register(r"offices", OfficeViewSet, basename="office")

urlpatterns = [
    path("site-settings/", site_settings_view, name="site-settings"),
    *router.urls,
]
