"""Permissions for the ERP integration operational surface.

ERP status is staff-only and never public. Access is granted to:
- authenticated superusers,
- staff users,
- users with the ``admin`` role,
- users whose role grants the ``integration.view`` codename
  (Phase 9A RBAC model; codename added to the seeder catalog).

Reuses the existing ``apps.accounts`` permission helpers — no parallel
permission system (see ``docs/architecture/erp-security.md`` §4).
"""
from __future__ import annotations

from rest_framework import permissions

from apps.accounts.api.permissions import get_role_codename, user_has_permission_codename

INTEGRATION_VIEW_CODENAME = "integration.view"


class IsIntegrationOperator(permissions.BasePermission):
    """Staff/admin (or ``integration.view``) only for ERP operations."""

    message = "Staff privileges are required."

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if user.is_superuser or user.is_staff or get_role_codename(user) == "admin":
            return True
        return user_has_permission_codename(user, INTEGRATION_VIEW_CODENAME)
