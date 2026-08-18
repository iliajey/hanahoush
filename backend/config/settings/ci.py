"""CI settings: used by the test pipeline, fast and deterministic."""
from .base import *  # noqa: F403
from .base import env

# ---------------------------------------------------------------------------
DEBUG = False

SECRET_KEY = env("DJANGO_SECRET_KEY", default="ci-test-secret-key")

# Tests use the 'testserver' host by default.
ALLOWED_HOSTS = ["*"]

DATABASES = {
    "default": env.db_url(
        "DATABASE_URL", default="postgres://postgres:postgres@localhost:5432/hanahoush_test"
    )
}

# SQLite fallback makes unit tests runnable without PostgreSQL.
import sys

if "--sqlite" in sys.argv or env.bool("USE_SQLITE", default=False):
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": ROOT_DIR / "db.sqlite3",
        }
    }

PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]

EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

# Keep auth tests deterministic by lifting throttling in CI.
REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"] = {  # noqa: F405
    "login": "10000/min",
    "refresh": "10000/min",
    "password_reset": "10000/hour",
    "user": "10000/min",
    "contact": "10000/min",
    "newsletter": "10000/min",
}

# Fail fast in CI.
LOGGING["root"]["level"] = "WARNING"  # noqa: F405
