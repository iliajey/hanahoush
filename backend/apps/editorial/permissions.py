"""Editorial permission helpers built on the platform ACL (roles/permissions)."""

# Permission codenames used by the editorial API.
PERM_VIEW = "editorial.view"
PERM_MANAGE = "editorial.manage"
PERM_APPROVE = "editorial.approve"
PERM_REVIEW = "editorial.review"
PERM_SCHEDULE = "editorial.schedule"


def has_permission(user, codename: str) -> bool:
    """True for superusers or users whose role grants the codename."""
    if not user or not user.is_authenticated:
        return False
    if getattr(user, "is_superuser", False):
        return True
    role = getattr(user, "role", None)
    return bool(role and role.permissions.filter(codename=codename).exists())


def can_view(user) -> bool:
    return has_permission(user, PERM_VIEW)


def can_manage(user) -> bool:
    return has_permission(user, PERM_MANAGE)


def can_approve(user) -> bool:
    return has_permission(user, PERM_APPROVE)


def can_review(user) -> bool:
    return has_permission(user, PERM_REVIEW)


def can_schedule(user) -> bool:
    return has_permission(user, PERM_SCHEDULE)
