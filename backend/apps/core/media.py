"""Central media-URL helper (Phase 14).

Every API serializer must return *absolute* media URLs: the frontend SPA and
the API run on different origins in development (``:5173`` vs ``:8000``), so
a relative ``/media/...`` path resolves against the wrong host and images
render as broken/blank. ``request.build_absolute_uri`` keeps the API usable
from any host without hardcoding domains.
"""
from __future__ import annotations

from typing import Any


def absolute_media_url(request: Any, url: str | None) -> str | None:
    """Return an absolute URL for a stored media ``url``.

    Pass-through for absolute URLs (http/https/data/blob). Relative paths
    are joined to the current request host. Falls back to the raw value when
    no request is available (e.g. background tasks).
    """
    if not url:
        return None
    if url.startswith(("http://", "https://", "data:", "blob:")):
        return url
    if request is not None:
        try:
            return request.build_absolute_uri(url)
        except Exception:  # noqa: BLE001 — never break serialization
            pass
    return url


def media_file_url(request: Any, file_field: Any) -> str | None:
    """Safe ``.url`` access for a ``FileField`` (missing files return None)."""
    if not file_field:
        return None
    try:
        url = file_field.url
    except Exception:  # noqa: BLE001 — file missing on disk
        return None
    return absolute_media_url(request, url)
