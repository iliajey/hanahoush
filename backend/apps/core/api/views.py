"""Admin intelligence dashboard API (Phase 8H).

``GET /api/v1/admin/dashboard/`` — staff/admin only. Returns real operational
data aggregated from the database (content, editorial, engagement, operations,
system) without ever exposing secrets. Payload is cached for a short TTL.
"""
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from apps.accounts.api.permissions import IsStaffOrAdmin
from apps.core.services.dashboard import get_operational_dashboard


class DashboardRateThrottle(ScopedRateThrottle):
    """Per-user cap on dashboard reads (scope: ``user``)."""

    scope = "user"


@extend_schema(
    responses={200: OpenApiResponse(description="Operational dashboard payload.")},
    tags=["admin"],
)
class AdminDashboardView(APIView):
    """Real-data operational dashboard for staff/admins."""

    permission_classes = [IsAuthenticated, IsStaffOrAdmin]
    throttle_classes = [DashboardRateThrottle]
    versioning_class = None  # versioning lives in the URL path (/api/v1/)

    def get(self, request: Request) -> Response:
        data = get_operational_dashboard(request.user)
        data.pop("_cached", None)
        return Response(
            {
                "success": True,
                "message": "",
                "data": data,
                "errors": None,
                "request_id": getattr(request, "request_id", None),
            },
            status=status.HTTP_200_OK,
        )
