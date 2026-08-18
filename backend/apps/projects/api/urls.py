"""Project API URL routes.

Registered at the empty prefix; ``config.api.v1`` mounts this module at
``projects/``. ``SimpleRouter`` avoids the api-root / format-suffix routes
so multiple routers can share the same mount point.
"""
from rest_framework.routers import SimpleRouter

from .viewsets import ProjectViewSet

router = SimpleRouter()
router.register(r"projects", ProjectViewSet, basename="project")

urlpatterns = router.urls
