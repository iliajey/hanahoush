"""Production settings. All secrets must come from the environment."""
import environ

from .base import *  # noqa: F403

env = environ.Env()

# ---------------------------------------------------------------------------
DEBUG = False

# Fail fast: production never inherits localhost defaults. Operator must set
# real hosts/origins via environment (see backend/.env.example).
ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS")  # noqa: F405
CSRF_TRUSTED_ORIGINS = env.list("CSRF_TRUSTED_ORIGINS")  # noqa: F405
CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS")  # noqa: F405

# No wildcard CORS in production (base allowlist is replaced above).
CORS_ALLOW_ALL_ORIGINS = False

# First-run superuser bootstrap stays OFF unless operator opts in.
BOOTSTRAP_ADMIN_ENABLED = env.bool("BOOTSTRAP_ADMIN_ENABLED", default=False)

SECURE_SSL_REDIRECT = env.bool("DJANGO_SECURE_SSL_REDIRECT", default=True)
SESSION_COOKIE_SECURE = env.bool("DJANGO_SESSION_COOKIE_SECURE", default=True)
CSRF_COOKIE_SECURE = env.bool("DJANGO_CSRF_COOKIE_SECURE", default=True)
SECURE_HSTS_SECONDS = env.int("DJANGO_SECURE_HSTS_SECONDS", default=31536000)
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"

# Keep Django Debug Toolbar out of production.
INSTALLED_APPS = [app for app in INSTALLED_APPS if app not in ("debug_toolbar",)]  # noqa: F405

# Rotate the secret: application servers must set it explicitly.
SECRET_KEY = env("DJANGO_SECRET_KEY")  # noqa: F405

# JWT refresh cookie must be Secure behind HTTPS in production.
# NOTE: base.py already built the SIMPLE_JWT dict, so mutate the key.
SIMPLE_JWT["AUTH_COOKIE_SECURE"] = env.bool("JWT_AUTH_COOKIE_SECURE", default=True)  # noqa: F405

# Serve static files from the same domain (or a CDN later).
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.ManifestStaticFilesStorage"},
}
