"""Super Admin user-management routes (mounted at /api/v1/admin/users/)."""
from rest_framework.routers import SimpleRouter

from .admin_users import AdminUserViewSet

router = SimpleRouter()
router.register(r"", AdminUserViewSet, basename="admin-user")

urlpatterns = router.urls
