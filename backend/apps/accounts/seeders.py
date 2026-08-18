"""Bootstrap seeders for roles, permissions and demo users.

Idempotent: every function uses get-or-create semantics and can be run
repeatedly without side effects.
"""
import logging

from django.contrib.auth import get_user_model

from apps.accounts.models import Permission, Role

logger = logging.getLogger(__name__)

User = get_user_model()

# ---------------------------------------------------------------------------
# Permission catalog  (name, codename, module)
# ---------------------------------------------------------------------------
PERMISSION_DEFINITIONS: list[tuple[str, str, str]] = [
    ("View articles", "articles.view", "articles"),
    ("Create articles", "articles.create", "articles"),
    ("Update articles", "articles.update", "articles"),
    ("Delete articles", "articles.delete", "articles"),
    ("Publish articles", "articles.publish", "articles"),
    ("View projects", "projects.view", "projects"),
    ("Create projects", "projects.create", "projects"),
    ("Update projects", "projects.update", "projects"),
    ("Delete projects", "projects.delete", "projects"),
    ("Publish projects", "projects.publish", "projects"),
    ("View services", "services.view", "services"),
    ("Create services", "services.create", "services"),
    ("Update services", "services.update", "services"),
    ("Delete services", "services.delete", "services"),
    ("View company content", "company.view", "company"),
    ("Update company content", "company.update", "company"),
    ("Upload media", "media.upload", "media_library"),
    ("Manage media", "media.manage", "media_library"),
    ("View analytics", "analytics.view", "analytics"),
    ("Manage users", "users.manage", "accounts"),
    ("Manage roles", "roles.manage", "accounts"),
    ("View editorial workflows", "editorial.view", "editorial"),
    ("Manage editorial workflows", "editorial.manage", "editorial"),
    ("Approve editorial content", "editorial.approve", "editorial"),
    ("Review editorial content", "editorial.review", "editorial"),
    ("Schedule editorial content", "editorial.schedule", "editorial"),
    ("View ERP integration status", "integration.view", "integration"),
]

# ---------------------------------------------------------------------------
# Roles  (codename → {name, description, permissions})
# ---------------------------------------------------------------------------
ROLE_DEFINITIONS: dict[str, dict] = {
    "SUPER_ADMIN": {
        "name": "Super Admin",
        "description": "Full platform access including user and role management.",
        "permissions": [codename for _, codename, _ in PERMISSION_DEFINITIONS],
    },
    "COMPANY_ADMIN": {
        "name": "Company Admin",
        "description": "Manages all company content, media and users.",
        "permissions": [
            "articles.view", "articles.create", "articles.update", "articles.delete", "articles.publish",
            "projects.view", "projects.create", "projects.update", "projects.delete", "projects.publish",
            "services.view", "services.create", "services.update", "services.delete",
            "company.view", "company.update",
            "media.upload", "media.manage",
            "analytics.view",
            "users.manage",
            "editorial.view", "editorial.manage", "editorial.approve", "editorial.schedule",
            "integration.view",
        ],
    },
    "CONTENT_MANAGER": {
        "name": "Content Manager",
        "description": "Creates and manages articles, services and company content.",
        "permissions": [
            "articles.view", "articles.create", "articles.update", "articles.delete",
            "services.view", "services.create", "services.update", "services.delete",
            "company.view", "company.update",
            "media.upload",
            "analytics.view",
            "editorial.view", "editorial.manage", "editorial.review", "editorial.schedule",
        ],
    },
    "PROJECT_MANAGER": {
        "name": "Project Manager",
        "description": "Manages portfolio projects.",
        "permissions": [
            "projects.view", "projects.create", "projects.update", "projects.delete", "projects.publish",
            "articles.view",
            "services.view",
            "media.upload",
            "editorial.view", "editorial.review",
        ],
    },
    "EDITOR": {
        "name": "Editor",
        "description": "Writes and edits articles.",
        "permissions": [
            "articles.view", "articles.create", "articles.update",
            "projects.view",
            "services.view",
            "media.upload",
            "editorial.view", "editorial.review",
        ],
    },
    "VIEWER": {
        "name": "Viewer",
        "description": "Read-only access to public content.",
        "permissions": [
            "articles.view",
            "projects.view",
            "services.view",
            "company.view",
            "analytics.view",
            "editorial.view",
        ],
    },
}

# ---------------------------------------------------------------------------
# Demo users  (username → {password, email, first_name, last_name, role})
# ---------------------------------------------------------------------------
DEMO_USERS: dict[str, dict] = {
    "superadmin": {
        "password": "SuperAdmin@123456",
        "email": "superadmin@hanahoush.local",
        "first_name": "Super",
        "last_name": "Admin",
        "role": "SUPER_ADMIN",
    },
    "companyadmin": {
        "password": "CompanyAdmin@123456",
        "email": "companyadmin@hanahoush.local",
        "first_name": "Company",
        "last_name": "Admin",
        "role": "COMPANY_ADMIN",
    },
    "contentmanager": {
        "password": "ContentManager@123456",
        "email": "contentmanager@hanahoush.local",
        "first_name": "Content",
        "last_name": "Manager",
        "role": "CONTENT_MANAGER",
    },
    "projectmanager": {
        "password": "ProjectManager@123456",
        "email": "projectmanager@hanahoush.local",
        "first_name": "Project",
        "last_name": "Manager",
        "role": "PROJECT_MANAGER",
    },
    "editor": {
        "password": "Editor@123456",
        "email": "editor@hanahoush.local",
        "first_name": "Editor",
        "last_name": "User",
        "role": "EDITOR",
    },
    "viewer": {
        "password": "Viewer@123456",
        "email": "viewer@hanahoush.local",
        "first_name": "Viewer",
        "last_name": "User",
        "role": "VIEWER",
    },
}

# Users that may access the Django admin (management roles).
STAFF_USERS = {"superadmin", "companyadmin", "contentmanager", "projectmanager"}


def seed_permissions() -> list[Permission]:
    """Create the permission catalog if missing."""
    created = []
    for name, codename, module in PERMISSION_DEFINITIONS:
        perm, was_created = Permission.objects.get_or_create(
            codename=codename,
            defaults={"name": name, "module": module},
        )
        if was_created:
            created.append(perm)
    if created:
        logger.info("Created %d permissions.", len(created))
    return Permission.objects.all()


def seed_roles() -> list[Role]:
    """Create roles and assign their permissions (idempotent)."""
    roles = []
    for codename, definition in ROLE_DEFINITIONS.items():
        role, _ = Role.objects.get_or_create(
            codename=codename,
            defaults={
                "name": definition["name"],
                "description": definition["description"],
                "is_system": True,
            },
        )
        role.permissions.set(Permission.objects.filter(codename__in=definition["permissions"]))
        roles.append(role)
    logger.info("Ensured %d roles.", len(roles))
    return roles


def seed_demo_users() -> list[User]:
    """Create the demo users (idempotent); superadmin is a superuser."""
    roles_by_codename = {r.codename: r for r in seed_roles()}
    users = []
    for username, definition in DEMO_USERS.items():
        user, was_created = User.objects.get_or_create(
            username=username,
            defaults={
                "email": definition["email"],
                "first_name": definition["first_name"],
                "last_name": definition["last_name"],
                "is_staff": username in STAFF_USERS,
            },
        )
        if was_created:
            user.set_password(definition["password"])
        if username == "superadmin":
            user.is_superuser = True
            user.is_staff = True
        user.role = roles_by_codename.get(definition["role"])
        user.save()
        users.append(user)
    logger.info("Ensured %d demo users.", len(users))
    return users


def seed_superuser() -> User | None:
    """Ensure at least one superuser exists (created via demo users)."""
    if not User.objects.filter(is_superuser=True).exists():
        # seed_demo_users creates superadmin; fall back to a safe default.
        user = User.objects.create_superuser(
            username="superadmin",
            email="superadmin@hanahoush.local",
            password="SuperAdmin@123456",
        )
        super_admin_role = Role.objects.filter(codename="SUPER_ADMIN").first()
        if super_admin_role:
            user.role = super_admin_role
            user.save()
        return user
    return None
