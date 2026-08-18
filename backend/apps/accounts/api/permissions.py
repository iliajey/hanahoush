"""Custom permission classes for role-based and object-level authorization.

Rules:
- ``IsAdminUser``            — superuser OR user whose role codename is "admin".
- ``HasRole``                — user must belong to one of the allowed roles.
- ``HasPermission``          — user's role must grant one of the codenames.
- ``IsOwnerOrReadOnly``      — object permission: reads allowed, writes only
                               for the owner (object-permission structure).
"""
from rest_framework import permissions


def get_role_codename(user):
    """Return the primary role codename of a user (or ``None``)."""
    role = getattr(user, "role", None)
    return role.codename if role else None


def user_has_permission_codename(user, codename: str) -> bool:
    """True if the user is superuser or their role grants the codename."""
    if user.is_superuser:
        return True
    role = getattr(user, "role", None)
    if role is None:
        return False
    return role.permissions.filter(codename=codename).exists()


class IsAdminUser(permissions.BasePermission):
    """Allow only platform administrators (superuser or role=admin)."""

    message = "Admin privileges are required."

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and (
            user.is_superuser or get_role_codename(user) == "admin"
        ))


class IsStaffOrAdmin(permissions.BasePermission):
    """Allow staff users, superusers, or users with the admin role.

    Used by operational surfaces (e.g. the admin dashboard API) that must be
    staff/admin restricted but not limited to the single ``admin`` role.
    """

    message = "Staff privileges are required."

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and (
            user.is_staff or user.is_superuser or get_role_codename(user) == "admin"
        ))


class IsStaffOrReadOnly(permissions.BasePermission):
    """Safe methods for everyone; writes only for staff/superusers/admins.

    Used on publishable content viewsets so the public API stays read-only for
    anonymous visitors while the CMS admin (and staff tooling) can still write.
    """

    message = "Authentication with staff privileges is required for this action."

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        user = request.user
        return bool(user and user.is_authenticated and (
            user.is_staff or user.is_superuser or get_role_codename(user) == "admin"
        ))


class HasRole(permissions.BasePermission):
    """Allow users whose role codename is in ``allowed_roles``.

    Usage::

        permission_classes = [HasRole]
        allowed_roles = ["admin", "manager"]
    """

    message = "You do not have the required role."

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if user.is_superuser:
            return True
        allowed = getattr(view, "allowed_roles", None) or ()
        return get_role_codename(user) in allowed


class HasPermission(permissions.BasePermission):
    """Allow users whose role grants one of the ``required_permissions``.

    Usage::

        permission_classes = [HasPermission]
        required_permissions = ["manage_users"]
    """

    message = "You do not have permission to perform this action."

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if user.is_superuser:
            return True
        required = getattr(view, "required_permissions", None) or ()
        return any(user_has_permission_codename(user, codename) for codename in required)


class IsOwnerOrReadOnly(permissions.BasePermission):
    """Object-level permission: safe methods allowed; writes only for owners.

    The view must define ``get_owner(obj)`` returning the owning user, or the
    model must expose ``owner``.
    """

    message = "You do not own this object."

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        owner = view.get_owner(obj) if hasattr(view, "get_owner") else getattr(obj, "owner", None)
        return bool(owner and owner == request.user)
