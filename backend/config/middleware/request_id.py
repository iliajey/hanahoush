"""Injects a request ID header for distributed tracing."""
import uuid

from django.utils.deprecation import MiddlewareMixin

REQUEST_ID_HEADER = "HTTP_X_REQUEST_ID"


class RequestIDMiddleware(MiddlewareMixin):
    """Attach a unique request id to every request/response.

    The value is used by structured logging and can be propagated to
    downstream services for end-to-end correlation (future microservices).
    """

    def process_request(self, request):
        request_id = request.META.get(REQUEST_ID_HEADER) or str(uuid.uuid4())
        request.request_id = request_id
        return None

    def process_response(self, request, response):
        response["X-Request-ID"] = getattr(request, "request_id", str(uuid.uuid4()))
        return response
