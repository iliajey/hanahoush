"""API request logging middleware.

Logs every API request with its correlation id, timing, and status code.
The log record is structured (JSON formatter friendly) and can be used
for monitoring and traceability.
"""
import logging
import time

from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger("api.request")


class APILoggingMiddleware(MiddlewareMixin):
    """Log API request/response pairs.

    Only logs requests under the ``/api/`` prefix to keep log volume low.
    Includes the ``request_id`` for end-to-end correlation.
    """

    def process_request(self, request):
        if request.path.startswith("/api/"):
            request._api_request_start = time.perf_counter()
        return None

    def process_response(self, request, response):
        if hasattr(request, "_api_request_start"):
            duration_ms = (time.perf_counter() - request._api_request_start) * 1000
            logger.info(
                "api_request path=%s method=%s status=%s duration_ms=%.2f request_id=%s user=%s",
                request.path,
                request.method,
                response.status_code,
                duration_ms,
                getattr(request, "request_id", "-"),
                getattr(request.user, "username", "-") if hasattr(request, "user") else "-",
            )
        return response
