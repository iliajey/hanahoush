"""Analytics API URL routes.

- ``/api/v1/contact/``               — public submission (throttled).
- ``/api/v1/admin/contact/``         — staff-only inquiry management.
- ``/api/v1/analytics/events/``      — public event ingestion (throttled).
"""
from django.urls import include, path
from rest_framework.routers import SimpleRouter

from .views import AnalyticsEventIngestView, ContactAdminViewSet, ContactSubmitView

admin_router = SimpleRouter()
admin_router.register(r"contact", ContactAdminViewSet, basename="admin-contact")

urlpatterns = [
    path("contact/", ContactSubmitView.as_view(), name="contact-submit"),
    path("admin/", include(admin_router.urls)),
    path("analytics/events/", AnalyticsEventIngestView.as_view(), name="analytics-events"),
]
