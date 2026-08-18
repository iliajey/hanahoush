"""ERP integration operational API views.

- ``GET /api/v1/integration/erp/health/`` — staff-only ERP health/status.
  Never public; ``Cache-Control: no-store``; standard envelope; secrets are
  redacted by the status service before rendering.
"""
from __future__ import annotations

from drf_spectacular.utils import OpenApiParameter, OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.integration.application.services.erp_status_service import ErpStatusService
from config.api.base.responses import build_response

from .permissions import IsIntegrationOperator


@extend_schema(
    parameters=[
        OpenApiParameter(
            name="probe",
            description=(
                "When 'true', perform a bounded connectivity probe against the "
                "configured ERP base URL (staff-only, never public)."
            ),
            required=False,
            type=str,
        ),
    ],
    responses={
        200: OpenApiResponse(description="ERP health/status payload."),
        401: OpenApiResponse(description="Not authenticated."),
        403: OpenApiResponse(description="Not staff / integration operator."),
    },
    tags=["integration/erp"],
)
class ErpHealthView(APIView):
    """Staff-only ERP health and status surface."""

    permission_classes = [IsIntegrationOperator]
    versioning_class = None  # versioning lives in the URL path (/api/v1/)

    def get(self, request: Request) -> Response:
        probe = request.query_params.get("probe", "").lower() == "true"
        service = ErpStatusService()
        payload = service.health_payload(probe=probe)
        payload["request_id"] = getattr(request, "request_id", None)
        response = build_response(
            data=payload,
            message="ERP integration status.",
            status_code=status.HTTP_200_OK,
            request=request,
        )
        response["Cache-Control"] = "no-store"
        return response
