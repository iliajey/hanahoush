"""Health check and version endpoints.

Provides basic health, version, and ping endpoints for monitoring.
"""
from django.conf import settings
from django.db import connection
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response


@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request: Request):
    """Comprehensive health check.

    Returns:
    - Database connectivity
    - Cache connectivity (if configured)
    - Overall status
    """
    checks = {}
    overall_healthy = True

    # Database check
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        checks["database"] = {"status": "healthy", "details": "Connected"}
    except Exception as e:
        checks["database"] = {"status": "unhealthy", "details": str(e)}
        overall_healthy = False

    # Cache check (if configured)
    try:
        from django.core.cache import cache

        cache.set("health_check", "ok", 10)
        if cache.get("health_check") == "ok":
            checks["cache"] = {"status": "healthy", "details": "Connected"}
        else:
            checks["cache"] = {"status": "degraded", "details": "Cache not responding"}
            overall_healthy = False
    except Exception as e:
        checks["cache"] = {"status": "unhealthy", "details": str(e)}
        overall_healthy = False

    # Migration state — only surfaced to authenticated staff (diagnostics);
    # never to anonymous visitors to avoid leaking internal state.
    user = request.user if hasattr(request, "user") else None
    if user is not None and user.is_authenticated and (user.is_staff or user.is_superuser):
        try:
            from django.db.migrations.executor import MigrationExecutor

            executor = MigrationExecutor(connection)
            leaf_nodes = set(executor.loader.graph.leaf_nodes())
            applied = set(executor.loader.applied_migrations())
            pending = sorted(leaf_nodes - applied)
            checks["migrations"] = {
                "status": "ok" if not pending else "pending",
                "pending": len(pending),
            }
            if pending:
                overall_healthy = False
        except Exception as e:  # noqa: BLE001
            checks["migrations"] = {"status": "unhealthy", "details": str(e)}
            overall_healthy = False

    return Response(
        {
            "success": overall_healthy,
            "message": "Health check completed",
            "data": {
                "status": "healthy" if overall_healthy else "unhealthy",
                "checks": checks,
                "environment": getattr(settings, "ENVIRONMENT", "unknown"),
                "version": getattr(settings, "APP_VERSION", "1.0.0"),
                "timestamp": timezone.now().isoformat(),
                "request_id": getattr(request, "request_id", None),
            },
            "errors": None,
            "request_id": getattr(request, "request_id", None),
        },
        status=status.HTTP_200_OK if overall_healthy else status.HTTP_503_SERVICE_UNAVAILABLE,
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def version_info(request):
    """Version information endpoint.

    Returns:
    - API version
    - Application version
    - Django version
    - Build info (if available)
    """
    version = getattr(settings, "APP_VERSION", "1.0.0")
    api_version = "v1"

    return Response(
        {
            "success": True,
            "message": "",
            "data": {
                "api_version": api_version,
                "app_version": version,
                "django_version": getattr(settings, "DJANGO_VERSION", "5.2"),
                "environment": getattr(settings, "ENVIRONMENT", "unknown"),
            },
            "errors": None,
        }
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def ping(request):
    """Simple ping endpoint for load balancer health checks.

    Returns a minimal response indicating the service is up.
    """
    return Response({"success": True, "message": "pong", "data": {"status": "ok"}, "errors": None})
