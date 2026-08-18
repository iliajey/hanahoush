"""Media library API URL routes."""
from rest_framework.routers import SimpleRouter

from .views import MediaViewSet

router = SimpleRouter()
router.register(r"media", MediaViewSet, basename="media")

urlpatterns = router.urls
