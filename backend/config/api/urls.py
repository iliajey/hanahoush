"""API URL configuration.

URL map:
- ``/api/v1/...``     → versioned REST endpoints (config.api.v1)
- ``/api/health/``    → health check
- ``/api/version/``   → application/API version
- ``/api/ping/``      → liveness probe
"""
from django.urls import include, path

from . import health

urlpatterns = [
    path("health/", health.health_check, name="health"),
    path("version/", health.version_info, name="version"),
    path("ping/", health.ping, name="ping"),
    path("v1/", include(("config.api.v1", "v1"), namespace="v1")),
]
