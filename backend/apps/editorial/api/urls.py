"""Editorial API URL routes (mounted under /api/v1/editorial/)."""
from rest_framework.routers import SimpleRouter

from .views import AuditEventViewSet, ContentLockViewSet, ScheduleViewSet, WorkflowViewSet

router = SimpleRouter()
router.register(r"workflows", WorkflowViewSet, basename="workflow")
router.register(r"audit", AuditEventViewSet, basename="audit")
router.register(r"locks", ContentLockViewSet, basename="lock")
router.register(r"schedules", ScheduleViewSet, basename="schedule")

urlpatterns = router.urls
