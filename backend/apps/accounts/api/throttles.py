"""Custom throttle classes for authentication endpoints."""
from rest_framework.throttling import ScopedRateThrottle


class LoginRateThrottle(ScopedRateThrottle):
    """Limits login attempts per client (scope: ``login``)."""

    scope = "login"


class RefreshRateThrottle(ScopedRateThrottle):
    """Limits token refresh attempts (scope: ``refresh``)."""

    scope = "refresh"


class PasswordResetRateThrottle(ScopedRateThrottle):
    """Limits password-reset requests (scope: ``password_reset``)."""

    scope = "password_reset"


class UserRateThrottle(ScopedRateThrottle):
    """General authenticated user rate limit (scope: ``user``)."""

    scope = "user"
