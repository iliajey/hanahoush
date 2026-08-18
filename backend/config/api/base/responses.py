"""Standard response builder and error handler for the Hanahoush API.

Provides consistent response formatting across all API endpoints.

Standard response format:
{
    "success": true,
    "message": "",
    "data": {},
    "errors": null
}
"""
import logging

from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


def _get_request_id(request=None):
    """Extract the request correlation id if present."""
    if request is not None:
        return getattr(request, "request_id", None)
    return None


def build_response(data=None, message="", status_code=200, request=None):
    """Build a standardized success Response."""
    return Response(
        {
            "success": True,
            "message": message,
            "data": data,
            "errors": None,
            "request_id": _get_request_id(request),
        },
        status=status_code,
    )


def build_error(message, status_code=400, errors=None, request=None):
    """Build a standardized error Response."""
    return Response(
        {
            "success": False,
            "message": message,
            "data": None,
            "errors": errors,
            "request_id": _get_request_id(request),
        },
        status=status_code,
    )


def build_paginated_response(data, pagination, request=None):
    """Build a standardized paginated success Response."""
    return Response(
        {
            "success": True,
            "message": "",
            "data": data,
            "errors": None,
            "pagination": pagination,
            "request_id": _get_request_id(request),
        },
        status=200,
    )


def hanahoush_exception_handler(exc, context):
    """Custom exception handler producing the standard error envelope.

    Wraps every DRF exception into the Hanahoush response format and
    attaches the request correlation id for traceability.
    """
    request = context.get("request")
    request_id = _get_request_id(request)

    # Let DRF handle the exception into a Response first.
    response = exception_handler(exc, context)

    if response is None:
        # Unhandled exception: never leak internals.
        logger.exception("Unhandled API exception", exc_info=exc)
        return Response(
            {
                "success": False,
                "message": "Internal server error",
                "data": None,
                "errors": None,
                "request_id": request_id,
            },
            status=500,
        )

    # Normalize DRF's error detail into the "errors" bucket.
    detail = getattr(exc, "detail", None)
    if isinstance(detail, dict):
        message = "Validation failed"
        errors = detail
    elif isinstance(detail, list):
        message = "Validation failed"
        errors = detail
    else:
        message = str(detail) if detail else "Request failed"
        errors = None

    return Response(
        {
            "success": False,
            "message": message,
            "data": None,
            "errors": errors,
            "request_id": request_id,
        },
        status=response.status_code,
    )
