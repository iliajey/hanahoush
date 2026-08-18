"""Unified exception handler producing the standard error envelope."""
import logging

from django.core.exceptions import PermissionDenied, ValidationError as DjangoValidationError
from django.http import Http404
from rest_framework import exceptions as drf_exceptions
from rest_framework.views import exception_handler

from apps.common.presentation.api.response import error_response

logger = logging.getLogger(__name__)


def hanahoush_exception_handler(exc, context):
    """Wrap every DRF exception into the Hanahoush response envelope."""
    response = exception_handler(exc, context)

    if response is None:
        # Unhandled exception: 500 with safe message.
        logger.exception("Unhandled exception", exc_info=exc)
        return error_response(
            message="Internal server error", status=500, code="internal_error"
        )

    message = getattr(exc, "detail", None)
    if isinstance(message, (dict, list)):
        message = "Validation failed"

    code = getattr(exc, "code", None) or "error"
    errors = response.data

    return error_response(message=str(message), status=response.status_code, errors=errors, code=code)
