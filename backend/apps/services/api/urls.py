"""Services API URL routes.

Registered at the empty prefix; ``config.api.v1`` mounts this module at
``services/``.
"""
from rest_framework.routers import SimpleRouter

from .viewsets import ServiceSectionViewSet, ServiceViewSet

router = SimpleRouter()
router.register(r"services", ServiceViewSet, basename="service")
router.register(r"service-sections", ServiceSectionViewSet, basename="service-section")

urlpatterns = router.urls
