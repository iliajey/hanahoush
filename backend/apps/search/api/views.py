"""Global search API view (Phase 8H).

``GET /api/v1/search/`` — unified site-wide search over published, public
Articles / Projects / Services / Pages. Drafts, archived and scheduled content
are never included. Response uses the standard envelope + pagination.
"""
from django.conf import settings
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from apps.search.services import SEARCHABLE_TYPES, search_content
from config.api.base.viewsets import no_versioning

from .serializers import SearchResultSerializer


class SearchRateThrottle(ScopedRateThrottle):
    """Per-IP cap on public search (scope: ``search``)."""

    scope = "search"


def _page_number(request: Request) -> int:
    try:
        return max(1, int(request.query_params.get("page", 1)))
    except (TypeError, ValueError):
        return 1


def _page_size(request: Request) -> int:
    try:
        return min(max(int(request.query_params.get("page_size", 20)), 1), 100)
    except (TypeError, ValueError):
        return 20


@no_versioning
@extend_schema(
    responses={200: OpenApiResponse(description="Unified search results.", response=OpenApiTypes.OBJECT)},
    tags=["search"],
)
@api_view(["GET"])
@permission_classes([AllowAny])
@throttle_classes([SearchRateThrottle])
def search_view(request: Request):
    """Search published content. Requires ``q`` (min length configurable).

    Optional filters: ``type``, ``locale``, ``category`` (slug), ``ordering``
    (relevance | published_at | -published_at), plus ``page``/``page_size``.
    """
    q = (request.query_params.get("q") or "").strip()
    if len(q) < getattr(settings, "SEARCH_MIN_QUERY_LENGTH", 2):
        return Response(
            {
                "success": False,
                "message": "Query too short.",
                "data": None,
                "errors": {"q": [f"Query must be at least {getattr(settings, 'SEARCH_MIN_QUERY_LENGTH', 2)} characters."]},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    type_filter = request.query_params.get("type") or None
    if type_filter not in SEARCHABLE_TYPES:
        type_filter = None

    locale = request.query_params.get("locale") or request.LANGUAGE_CODE or "en"
    if locale not in ("fa", "en", "ar"):
        locale = "en"

    category = (request.query_params.get("category") or "").strip() or None

    results = search_content(q, type_filter=type_filter, category=category, locale=locale)

    def _ts(result):
        stamp = result["published_at"]
        return stamp.timestamp() if stamp else 0

    ordering = (request.query_params.get("ordering") or "relevance").strip()
    if ordering == "published_at":
        results = sorted(results, key=_ts)
    elif ordering == "-published_at":
        results = sorted(results, key=_ts, reverse=True)

    count = len(results)
    page = _page_number(request)
    page_size = _page_size(request)
    start = (page - 1) * page_size
    slice_ = results[start : start + page_size]

    serializer = SearchResultSerializer(slice_, many=True)

    num_pages = (count + page_size - 1) // page_size if count else 0
    base = request.build_absolute_uri(request.path)
    def _link(p):
        if p < 1 or p > num_pages:
            return None
        params = request.query_params.copy()
        params["page"] = str(p)
        return f"{base}?{params.urlencode()}"

    return Response(
        {
            "success": True,
            "message": "",
            "data": serializer.data,
            "pagination": {
                "count": count,
                "num_pages": num_pages,
                "current_page": page,
                "page_size": page_size,
                "next": _link(page + 1),
                "previous": _link(page - 1),
            },
            "errors": None,
            "request_id": getattr(request, "request_id", None),
        }
    )
