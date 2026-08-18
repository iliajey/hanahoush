"""Production settings. All secrets must come from the environment."""
import environ

from .base import *  # noqa: F403

env = environ.Env()

# ---------------------------------------------------------------------------
DEBUG = False

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

# Serve static files from the same domain (or a CDN later).
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.ManifestStaticFilesStorage"},
}
