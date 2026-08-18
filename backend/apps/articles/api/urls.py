"""Article API URL routes.

Registered at the empty prefix; ``config.api.v1`` mounts this module at
``articles/``. ``SimpleRouter`` avoids the api-root / format-suffix routes
so multiple routers can share the same mount point.
"""
from rest_framework.routers import SimpleRouter

from .viewsets import ArticleViewSet

router = SimpleRouter()
router.register(r"articles", ArticleViewSet, basename="article")

urlpatterns = router.urls
