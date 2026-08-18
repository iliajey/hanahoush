"""Standard response envelope used by every endpoint.

Keeps the wire format consistent across the whole API:

    {
        "success": true,
        "data": {...},
        "message": "...",
        "errors": null
    }
"""
from typing import Any

from rest_framework.response import Response


def ok_response(data: Any = None, message: str = "OK", status: int = 200) -> Response:
    return Response(
        {"success": True, "data": data, "message": message, "errors": None},
        status=status,
    )


def error_response(
    message: str,
    status: int = 400,
    errors: Any = None,
    code: str | None = None,
) -> Response:
    return Response(
        {
            "success": False,
            "data": None,
            "message": message,
            "errors": errors,
            "code": code,
        },
        status=status,
    )
