"""Company API views.

Site-wide settings singleton. Navigation and footer surfaces were promoted to
the Page Builder app (``apps.page_builder``) in Phase 8B — the endpoints live
at the same URLs but are now model-driven; see ``apps/page_builder/api``.
"""
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

from apps.company.models import SiteSettings
from config.api.base.viewsets import no_versioning

from .serializers import SiteSettingsSerializer


@no_versioning
@extend_schema(
    responses={200: OpenApiResponse(description="Site-wide settings singleton.", response=SiteSettingsSerializer)},
    tags=["company"],
)
@api_view(["GET"])
@permission_classes([AllowAny])
def site_settings_view(request: Request):
    """Return the site-wide settings singleton (localized)."""
    settings_obj = SiteSettings.get_settings()
    serializer = SiteSettingsSerializer(settings_obj, context={"request": request})
    return Response(
        {"success": True, "message": "", "data": serializer.data, "errors": None},
        status=status.HTTP_200_OK,
    )
