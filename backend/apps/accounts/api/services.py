"""Authentication service helpers: lockout, audit log, session tracking."""
from datetime import timedelta

from django.conf import settings
from django.utils import timezone

from apps.accounts.models import LoginAttempt, LoginAudit, UserSession


def _client_ip(request):
    return getattr(request, "META", {}).get("REMOTE_ADDR")


def _user_agent(request):
    return getattr(request, "META", {}).get("HTTP_USER_AGENT", "")


def record_login_attempt(username, request, success: bool):
    """Record a login attempt for lockout analysis."""
    return LoginAttempt.objects.create(
        username=username,
        ip_address=_client_ip(request),
        success=success,
    )


def is_account_locked(username, request) -> int:
    """Return remaining lockout seconds for ``username`` or ``0`` if free."""
    now = timezone.now()
    window = now - timedelta(minutes=settings.AUTH_LOCKOUT_MINUTES)
    recent_failures = LoginAttempt.objects.filter(
        username=username,
        success=False,
        created_at__gte=window,
    ).count()
    if recent_failures >= settings.AUTH_MAX_FAILED_ATTEMPTS:
        # Lockout extends until AUTH_LOCKOUT_MINUTES after the latest failure.
        latest = LoginAttempt.objects.filter(username=username, success=False).order_by("-created_at").first()
        if latest:
            remaining = (latest.created_at + timedelta(minutes=settings.AUTH_LOCKOUT_MINUTES) - now).total_seconds()
            return max(0, int(remaining))
    return 0


def clear_login_attempts(username):
    """Clear tracked attempts after a successful login."""
    LoginAttempt.objects.filter(username=username, success=False).delete()


def audit(event, request, username, user=None, success=True, detail=""):
    """Write a LoginAudit row."""
    return LoginAudit.objects.create(
        event=event,
        username=username,
        user=user,
        ip_address=_client_ip(request),
        user_agent=_user_agent(request),
        success=success,
        detail=detail,
    )


def _jti(value) -> str:
    """Extract the refresh-token jti from a token object or plain string."""
    if hasattr(value, "payload"):
        return str(value.payload.get("jti", ""))
    return str(value)


def create_session(user, refresh_token, request, remember_me=False) -> UserSession:
    """Track a new session from a refresh token (uses its jti)."""
    return UserSession.objects.create(
        user=user,
        refresh_jti=_jti(refresh_token),
        ip_address=_client_ip(request),
        user_agent=_user_agent(request),
        remember_me=remember_me,
    )


def revoke_session(refresh_token) -> int:
    """Revoke the session matching a refresh token jti (logout)."""
    return UserSession.objects.filter(refresh_jti=_jti(refresh_token), revoked_at__isnull=True).update(
        revoked_at=timezone.now()
    )


def touch_session(refresh_token, user) -> None:
    """Update last_seen for an active session on token refresh."""
    UserSession.objects.filter(user=user, refresh_jti=_jti(refresh_token), revoked_at__isnull=True).update(
        last_seen=timezone.now()
    )
