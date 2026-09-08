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
# Local database defaults (PostgreSQL by default; USE_SQLITE=true switches to
# db.sqlite3 for fully portable local development)
# ---------------------------------------------------------------------------
DATABASES = build_database_config()

# ---------------------------------------------------------------------------
# Debug Toolbar only allows localhost
# ---------------------------------------------------------------------------
INTERNAL_IPS = [
    "127.0.0.1",
    "localhost",
]

# ---------------------------------------------------------------------------
CORS_ALLOW_ALL_ORIGINS = True

# Strong hashing by default (PBKDF2). MD5 stays in the list ONLY so legacy
# hashes migrated from older dev databases can still be verified and upgraded
# on the next successful login/password change.
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.PBKDF2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher",
    "django.contrib.auth.hashers.ScryptPasswordHasher",
    "django.contrib.auth.hashers.MD5PasswordHasher",
]

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
