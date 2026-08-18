"""Local development settings. Not for production use."""
from .base import *  # noqa: F403
from .base import env

# ---------------------------------------------------------------------------
DEBUG = True

ALLOWED_HOSTS = ["*"]

INSTALLED_APPS += [  # noqa: F405
    "django_extensions",
    "debug_toolbar",
]

MIDDLEWARE = [  # noqa: F405
    "debug_toolbar.middleware.DebugToolbarMiddleware",
    *MIDDLEWARE,
]

# ---------------------------------------------------------------------------
# Local database defaults (PostgreSQL run directly on the machine)
# ---------------------------------------------------------------------------
DATABASES = {
    "default": env.db_url(
        "DATABASE_URL", default="postgres://hanahoush:hanahoush@localhost:5432/hanahoush"
    )
}

# ---------------------------------------------------------------------------
# Debug Toolbar only allows localhost
# ---------------------------------------------------------------------------
INTERNAL_IPS = [
    "127.0.0.1",
    "localhost",
]

# ---------------------------------------------------------------------------
CORS_ALLOW_ALL_ORIGINS = True

# Speed up password hashing during development.
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
