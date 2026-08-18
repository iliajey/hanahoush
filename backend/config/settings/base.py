"""Base settings shared by every environment.

Every value that can differ between environments is read from environment
variables (via django-environ). Never hard-code secrets here.
"""
import os
from datetime import timedelta
from pathlib import Path

import environ

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
ROOT_DIR = Path(__file__).resolve().parent.parent.parent  # <project>/backend
APPS_DIR = ROOT_DIR / "apps"

# ---------------------------------------------------------------------------
# Environment
# ---------------------------------------------------------------------------
env = environ.Env()

# Read .env from the backend root if present.
environ.Env.read_env(ROOT_DIR / ".env")

# ---------------------------------------------------------------------------
# Core
# ---------------------------------------------------------------------------
SECRET_KEY = env("DJANGO_SECRET_KEY", default="insecure-dev-key-change-me")
DEBUG = env.bool("DJANGO_DEBUG", default=False)

ALLOWED_HOSTS = env.list(
    "DJANGO_ALLOWED_HOSTS", default=["localhost", "127.0.0.1", "0.0.0.0"]
)

# Environment indicator (local/ci/production) surfaced by /api/health,
# /api/version and the admin dashboard. Never a secret.
ENVIRONMENT = env("DJANGO_ENVIRONMENT", default="local")

# Application version surfaced by /api/version and the admin dashboard.
APP_VERSION = env("APP_VERSION", default="1.0.0")

# Public base URL used to build absolute URLs (sitemap, robots, canonical).
SITE_URL = env("SITE_URL", default="http://localhost:5173")

# ---------------------------------------------------------------------------
# Applications
# ---------------------------------------------------------------------------
DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

THIRD_PARTY_APPS = [
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "drf_spectacular",
    "drf_spectacular_sidecar",
    "corsheaders",
    "django_filters",
    "import_export",
    "django_ckeditor_5",
    "adminsortable2",
]

LOCAL_APPS = [
    "apps.common",
    "apps.core",
    "apps.accounts",
    "apps.media_library",
    "apps.articles",
    "apps.projects",
    "apps.services",
    "apps.company",
    "apps.analytics",
    "apps.page_builder",
    "apps.editorial",
    "apps.search",
    "apps.seo",
    "apps.integration",
    # Phase-1 reference scaffold retained untouched (no models).
    "apps.user",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

# ---------------------------------------------------------------------------
# Middleware
# ---------------------------------------------------------------------------
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.locale.LocaleMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "config.middleware.request_id.RequestIDMiddleware",
    "config.middleware.api_logging.APILoggingMiddleware",
    "config.middleware.security_headers.SecurityHeadersMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

ASGI_APPLICATION = "config.asgi.application"
WSGI_APPLICATION = "config.wsgi.application"

# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------
DATABASES = {
    "default": env.db_url(
        "DATABASE_URL", default=f"postgres://postgres:postgres@localhost:5432/hanahoush"
    )
}

# ---------------------------------------------------------------------------
# Authentication
# ---------------------------------------------------------------------------
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# Custom user model defined in apps.accounts (extends AbstractUser).
AUTH_USER_MODEL = env("AUTH_USER_MODEL", default="accounts.User")

# ---------------------------------------------------------------------------
# Caching
# ---------------------------------------------------------------------------
# Process-local cache by default (safe for single-node deployments and tests).
# No secret values are ever cached. Invalidation of the sitemap cache is wired
# through signals in ``apps.seo`` whenever published content changes.
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "hanahoush-cache",
        "TIMEOUT": 300,
    }
}

# Minimum query length for the global search endpoint.
SEARCH_MIN_QUERY_LENGTH = env.int("SEARCH_MIN_QUERY_LENGTH", default=2)

# Optional analytics event allowlist (empty = accept any sanitized event name).
# When set (comma-separated), only these event names are persisted.
ANALYTICS_EVENT_ALLOWLIST = env.list("ANALYTICS_EVENT_ALLOWLIST", default=[])

# ---------------------------------------------------------------------------
# ERP integration (Phase 9B — connector foundation)
# ---------------------------------------------------------------------------
# Master switch. When False (the default) the app runs with the NullProvider
# and behaves exactly as before Phase 9B. Never leave True without a verified
# ERP_BASE_URL and scoped credentials in the environment.
ERP_ENABLED = env.bool("ERP_ENABLED", default=False)

# Active provider key: "null" or "odoo_hanrp". Unknown keys fall back to null.
ERP_PROVIDER = env("ERP_PROVIDER", default="null")

# Authentication mechanism the adapter may use (reserved; consumed once the
# real hanRP API surface is verified): oauth2 | api_key | service_account.
ERP_AUTH_TYPE = env("ERP_AUTH_TYPE", default="api_key")

# ERP base URL (no trailing slash). Never a caller-supplied value; only the
# configured URL is ever contacted (SSRF-controlled).
ERP_BASE_URL = env("ERP_BASE_URL", default="")

# Timeouts (seconds): overall budget, connect, and per-read.
ERP_TIMEOUT = env.int("ERP_TIMEOUT", default=30)
ERP_CONNECT_TIMEOUT = env.int("ERP_CONNECT_TIMEOUT", default=5)
ERP_READ_TIMEOUT = env.int("ERP_READ_TIMEOUT", default=15)

# Retry policy: max retries beyond the initial attempt, exponential backoff
# base and cap (seconds), per ADR-0011.
ERP_RETRY_COUNT = env.int("ERP_RETRY_COUNT", default=3)
ERP_RETRY_BACKOFF = env.int("ERP_RETRY_BACKOFF", default=1)
ERP_RETRY_BACKOFF_CAP = env.int("ERP_RETRY_BACKOFF_CAP", default=30)

# Credentials (never default to real values; injected from the secret store).
# Reserved for Phase 9C (outbound API key) and Phase 9D (webhook HMAC secret).
ERP_API_KEY = env("ERP_API_KEY", default="")
ERP_WEBHOOK_SECRET = env("ERP_WEBHOOK_SECRET", default="")

# ---------------------------------------------------------------------------
# Django REST Framework + JWT
# ---------------------------------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    # Phase 4: AllowAny by default. Authentication lands in the next phase.
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.AllowAny",
    ),
    "DEFAULT_PAGINATION_CLASS": "config.api.base.pagination.DefaultPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_RENDERER_CLASSES": (
        "rest_framework.renderers.JSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer",
    ),
    "DEFAULT_VERSIONING_CLASS": (
        "rest_framework.versioning.NamespaceVersioning"
    ),
    "EXCEPTION_HANDLER": "config.api.base.responses.hanahoush_exception_handler",
    # Phase 6: rate limiting hooks for authentication endpoints.
    "DEFAULT_THROTTLE_RATES": {
        "login": env("THROTTLE_LOGIN", default="10/min"),
        "refresh": env("THROTTLE_REFRESH", default="30/min"),
    "password_reset": env("THROTTLE_PASSWORD_RESET", default="5/hour"),
    "user": env("THROTTLE_USER", default="120/min"),
    "contact": env("THROTTLE_CONTACT", default="10/min"),
    "newsletter": env("THROTTLE_NEWSLETTER", default="5/min"),
    "search": env("THROTTLE_SEARCH", default="60/min"),
    "analytics": env("THROTTLE_ANALYTICS", default="120/min"),
    },
}

# ---------------------------------------------------------------------------
# Account lockout (Phase 6)
# ---------------------------------------------------------------------------
AUTH_MAX_FAILED_ATTEMPTS = env.int("AUTH_MAX_FAILED_ATTEMPTS", default=5)
AUTH_LOCKOUT_MINUTES = env.int("AUTH_LOCKOUT_MINUTES", default=15)

# Refresh token lifetime when "remember me" is unchecked (short session).
AUTH_SHORT_SESSION_DAYS = env.int("AUTH_SHORT_SESSION_DAYS", default=1)

# Frontend base URL used to build password-reset links.
FRONTEND_URL = env("FRONTEND_URL", default="http://localhost:5173")

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(
        minutes=env.int("JWT_ACCESS_TOKEN_LIFETIME_MINUTES", default=30)
    ),
    "REFRESH_TOKEN_LIFETIME": timedelta(
        days=env.int("JWT_REFRESH_TOKEN_LIFETIME_DAYS", default=7)
    ),
    "ROTATE_REFRESH_TOKENS": env.bool("JWT_ROTATE_REFRESH_TOKENS", default=True),
    "BLACKLIST_AFTER_ROTATION": env.bool("JWT_BLACKLIST_AFTER_ROTATION", default=True),
    "AUTH_HEADER_TYPES": ("Bearer",),
    "AUTH_COOKIE": env.bool("JWT_AUTH_COOKIE", default=True),
    "AUTH_COOKIE_ACCESS": "access_token",
    "AUTH_COOKIE_REFRESH": "refresh_token",
    "AUTH_COOKIE_SECURE": env.bool("JWT_AUTH_COOKIE_SECURE", default=False),
    "AUTH_COOKIE_HTTP_ONLY": True,
    "AUTH_COOKIE_SAMESITE": "Lax",
}

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
CORS_ALLOWED_ORIGINS = env.list(
    "CORS_ALLOWED_ORIGINS",
    default=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:6006",
        "http://127.0.0.1:6006",
    ],
)
CORS_ALLOW_CREDENTIALS = True

# ---------------------------------------------------------------------------
# Internationalization
# ---------------------------------------------------------------------------
LANGUAGE_CODE = env("LANGUAGE_CODE", default="en")
LANGUAGES = [
    ("en", "English"),
    ("fa", "Persian"),
    ("ar", "Arabic"),
]
LOCALE_PATHS = [ROOT_DIR / "locale"]

TIME_ZONE = env("TIME_ZONE", default="UTC")
USE_I18N = True
USE_L10N = True
USE_TZ = True

# ---------------------------------------------------------------------------
# Static & Media
# ---------------------------------------------------------------------------
STATIC_URL = "/static/"
STATIC_ROOT = ROOT_DIR / "staticfiles"
STATICFILES_DIRS = []

MEDIA_URL = "/media/"
MEDIA_ROOT = ROOT_DIR / "media"

# Maximum accepted upload size for media files (bytes).
MEDIA_MAX_UPLOAD_SIZE = env.int("MEDIA_MAX_UPLOAD_SIZE", default=10 * 1024 * 1024)

# ---------------------------------------------------------------------------
# Security
# ---------------------------------------------------------------------------
CSRF_TRUSTED_ORIGINS = env.list(
    "CSRF_TRUSTED_ORIGINS",
    default=["http://localhost:3000", "http://localhost:5173"],
)
SESSION_COOKIE_HTTPONLY = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# ---------------------------------------------------------------------------
# Swagger / OpenAPI
# ---------------------------------------------------------------------------
SPECTACULAR_SETTINGS = {
    "TITLE": "Hanahoush API",
    "DESCRIPTION": "REST API for the Hanahoush platform.\n\n"
    "Standard response envelope: {success, message, data, errors}.",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "SERVE_PUBLIC": env.bool("SWAGGER_PUBLIC", default=True),
    "SWAGGER_UI_DIST": "SIDECAR",
    "SWAGGER_UI_FAVICON_HREF": "SIDECAR",
    "REDOC_DIST": "SIDECAR",
    "COMPONENT_SPLIT_REQUEST": True,
    "SCHEMA_PATH_PREFIX": r"/api/v[0-9]+",
    "SCHEMA_PATH_PREFIX_TRIM": False,
    "ENUM_NAME_OVERRIDES": {
        "StatusEnum": "apps.core.models.Status.choices",
    },
    "POSTPROCESSING_HOOKS": [
        "drf_spectacular.hooks.postprocess_schema_enums",
    ],
}

# ---------------------------------------------------------------------------
# Admin (Phase 3: enterprise admin)
# ---------------------------------------------------------------------------
# Custom AdminSite used for the whole Django admin (navigation + branding).
default_site = "apps.core.admin_site.HanahoushAdminSite"

# Default pagination inside the admin change lists.
ADMIN_LIST_PER_PAGE = env.int("ADMIN_LIST_PER_PAGE", default=50)

# django-import-export: allowed import/export formats (CSV, Excel, JSON).
from import_export.formats.base_formats import CSV, JSON, XLSX  # noqa: E402

IMPORT_EXPORT_FORMATS = [CSV, JSON, XLSX]

# django-ckeditor-5: rich text editing for publishable content.
CKEDITOR_5_CONFIGS = {
    "default": {
        "toolbar": [
            "heading",
            "|",
            "bold",
            "italic",
            "underline",
            "strikethrough",
            "|",
            "bulletedList",
            "numberedList",
            "blockQuote",
            "|",
            "link",
            "insertTable",
            "|",
            "undo",
            "redo",
        ],
        "height": 320,
        "width": "100%",
    },
}

# ---------------------------------------------------------------------------
# Bootstrap (Phase 3: automatic first-run superuser)
# ---------------------------------------------------------------------------
BOOTSTRAP_ADMIN_ENABLED = env.bool("BOOTSTRAP_ADMIN_ENABLED", default=True)
BOOTSTRAP_ADMIN_USERNAME = env("BOOTSTRAP_ADMIN_USERNAME", default="admin")
BOOTSTRAP_ADMIN_EMAIL = env("BOOTSTRAP_ADMIN_EMAIL", default="admin@hanahoush.local")
BOOTSTRAP_ADMIN_PASSWORD = env("BOOTSTRAP_ADMIN_PASSWORD", default="Admin@123456")

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "[{asctime}] {levelname} {name} {message}",
            "style": "{",
        },
        "json": {
            "format": '{"time": "%(asctime)s", "level": "%(levelname)s", '
                      '"logger": "%(name)s", "message": "%(message)s"}',
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "root": {"handlers": ["console"], "level": env("LOG_LEVEL", default="INFO")},
    "loggers": {
        "django": {"handlers": ["console"], "level": "INFO", "propagate": False},
        "django.request": {"handlers": ["console"], "level": "ERROR", "propagate": False},
        "apps": {"handlers": ["console"], "level": "DEBUG", "propagate": False},
        "api.request": {"handlers": ["console"], "level": "INFO", "propagate": False},
        # ERP integration (Phase 9B): operations + errors. Structured fields
        # (request_id/correlation_id/integration_id/sync_id) are attached via
        # the integration layer, never secrets (see erp-observability.md).
        "apps.integration": {"handlers": ["console"], "level": "INFO", "propagate": False},
        "apps.integration.errors": {
            "handlers": ["console"],
            "level": "WARNING",
            "propagate": False,
        },
    },
}

# ---------------------------------------------------------------------------
# Default primary key field type
# ---------------------------------------------------------------------------
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ---------------------------------------------------------------------------
# Email (stub - configure SMTP in a later phase)
# ---------------------------------------------------------------------------
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = env("EMAIL_HOST", default="localhost")
EMAIL_PORT = env.int("EMAIL_PORT", default=587)
EMAIL_USE_TLS = env.bool("EMAIL_USE_TLS", default=True)
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="noreply@hanahoush.local")
