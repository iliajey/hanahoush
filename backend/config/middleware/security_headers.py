"""Security response headers for every response (Phase 8H hardening).

Adds defense-in-depth headers that are safe in every environment:

- ``X-Content-Type-Options: nosniff``
- ``Referrer-Policy: strict-origin-when-cross-origin``
- ``Permissions-Policy`` (disable geolocation/mic/camera — the platform
  never needs them)
- ``Cache-Control: no-store`` on authentication and admin API responses so
  credentials and private data are never cached by browsers/proxies.

Nothing here reads secrets or environment values — it is header-only.
"""
from django.utils.deprecation import MiddlewareMixin

# Private/credential-bearing API prefixes that must never be cached publicly.
NO_CACHE_PREFIXES = ("/api/v1/auth/", "/api/v1/admin/")


class SecurityHeadersMiddleware(MiddlewareMixin):
    """Attach safe, non-destructive security headers to every response."""

    def process_response(self, request, response):
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.headers.setdefault(
            "Permissions-Policy",
            "geolocation=(), microphone=(), camera=()",
        )
        if any(request.path.startswith(prefix) for prefix in NO_CACHE_PREFIXES):
            response["Cache-Control"] = "no-store"
        return response
