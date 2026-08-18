"""Accounts domain.

- ``User``        : custom user model extending ``AbstractUser`` (enabled via
                    ``AUTH_USER_MODEL``) — the base for authentication in a
                    later phase.
- ``Role``        : named set of permissions (admin, editor, manager, ...).
- ``Permission``  : fine-grained custom ACL permission (codename-based),
                    independent from Django's built-in auth permissions so the
                    platform can evolve its own authorization model without
                    coupling to ``django.contrib.auth`` internals.

Relationships are normalized:
- ``Role.permissions``  → ManyToMany ``Permission`` (a role groups permissions).
- ``User.role``         → ForeignKey ``Role`` (one primary role per user;
                          a user may hold a single role for the CMS).
"""
from django.conf import settings
from django.contrib.auth.models import AbstractUser, UserManager
from django.db import models

from apps.core.models import BaseModel


class Permission(BaseModel):
    """Named, codename-based authorization permission."""

    name = models.CharField(max_length=255, verbose_name="Permission name")
    codename = models.CharField(max_length=100, unique=True)
    module = models.CharField(
        max_length=100,
        blank=True,
        help_text="Logical module the permission belongs to, e.g. 'articles'.",
    )
    description = models.TextField(blank=True)

    class Meta:
        verbose_name = "Permission"
        verbose_name_plural = "Permissions"
        ordering = ["module", "name"]

    def __str__(self) -> str:
        return self.name


class Role(BaseModel):
    """A named group of permissions assignable to users."""

    name = models.CharField(max_length=255)
    codename = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    is_system = models.BooleanField(
        default=False,
        editable=False,
        help_text="System roles cannot be removed (seed data).",
    )
    permissions = models.ManyToManyField(
        Permission,
        blank=True,
        related_name="roles",
        help_text="Permissions granted by this role.",
    )

    class Meta:
        verbose_name = "Role"
        verbose_name_plural = "Roles"
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class User(AbstractUser):
    """Custom user model extending Django's ``AbstractUser``.

    Adds:
    - ``role``               : primary role (FK → Role, nullable).
    - ``phone``              : contact phone for CRM/ERP integration.
    - ``preferred_language`` : content locale the user prefers (fa/en/ar).

    ``is_active``/``date_joined``/groups/permissions come from AbstractUser.
    """

    role = models.ForeignKey(
        Role,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="users",
        help_text="Primary role of the user.",
    )
    phone = models.CharField(max_length=20, blank=True)
    preferred_language = models.CharField(
        max_length=5,
        choices=[("fa", "Persian"), ("en", "English"), ("ar", "Arabic")],
        default="fa",
        help_text="Preferred UI/content language.",
    )

    objects = UserManager()

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"
        ordering = ["-date_joined"]

    def __str__(self) -> str:
        return self.get_full_name() or self.username


class LoginAudit(BaseModel):
    """Audit log for authentication events (login/logout/refresh/reset)."""

    EVENT_LOGIN = "login"
    EVENT_LOGIN_FAILED = "login_failed"
    EVENT_LOGOUT = "logout"
    EVENT_REFRESH = "refresh"
    EVENT_PASSWORD_CHANGE = "password_change"
    EVENT_PASSWORD_RESET = "password_reset"
    EVENT_CHOICES = [
        (EVENT_LOGIN, "Login"),
        (EVENT_LOGIN_FAILED, "Login failed"),
        (EVENT_LOGOUT, "Logout"),
        (EVENT_REFRESH, "Token refresh"),
        (EVENT_PASSWORD_CHANGE, "Password change"),
        (EVENT_PASSWORD_RESET, "Password reset"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="login_audits",
    )
    username = models.CharField(max_length=150, db_index=True)
    event = models.CharField(max_length=30, choices=EVENT_CHOICES, db_index=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    success = models.BooleanField(default=True)
    detail = models.CharField(max_length=255, blank=True)

    class Meta:
        verbose_name = "Login audit"
        verbose_name_plural = "Login audits"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["username", "event"], name="login_audit_user_event_idx"),
            models.Index(fields=["created_at"], name="login_audit_created_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.event} {self.username}"


class LoginAttempt(BaseModel):
    """Tracked login attempt used for the account-lockout structure."""

    username = models.CharField(max_length=150, db_index=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    success = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Login attempt"
        verbose_name_plural = "Login attempts"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["username", "created_at"], name="login_attempt_user_ts_idx"),
        ]

    def __str__(self) -> str:
        return f"{'OK' if self.success else 'FAIL'} {self.username}"


class UserSession(BaseModel):
    """Active session tracking keyed by the refresh-token JTI."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sessions",
    )
    refresh_jti = models.CharField(max_length=255, unique=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    remember_me = models.BooleanField(default=False)
    last_seen = models.DateTimeField(auto_now=True, editable=False)
    revoked_at = models.DateTimeField(null=True, blank=True, editable=False)

    class Meta:
        verbose_name = "User session"
        verbose_name_plural = "User sessions"
        ordering = ["-last_seen"]
        indexes = [
            models.Index(fields=["user", "revoked_at"], name="session_user_active_idx"),
        ]

    def __str__(self) -> str:
        return f"session {self.user} ({self.refresh_jti[:8]})"
