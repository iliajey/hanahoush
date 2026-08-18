"""Configuration-driven ERP provider selection (Part F).

``ERP_PROVIDER`` selects the adapter; ``ERP_ENABLED`` is the master switch.
Unknown/misconfigured providers fall back to :class:`NullProvider` so the
application always keeps working — never guesses, never fails hard.
"""
from __future__ import annotations

import logging
from urllib.parse import urlsplit

from django.conf import settings

from apps.integration.domain.interfaces.erp_provider import ERPProvider
from apps.integration.infrastructure.providers.base_http_provider import ProviderConfig
from apps.integration.infrastructure.providers.null_provider import NullProvider
from apps.integration.infrastructure.providers.odoo_hanrp import OdooHanRPProvider

logger = logging.getLogger("apps.integration")

PROVIDERS: dict[str, type[ERPProvider]] = {
    "null": NullProvider,
    "odoo_hanrp": OdooHanRPProvider,
}

KNOWN_PROVIDERS = tuple(sorted(PROVIDERS.keys()))


def _int_setting(name: str, default: int) -> int:
    value = getattr(settings, name, default)
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _positive(value: int, default: int, name: str) -> int:
    try:
        parsed = int(value)
        return parsed if parsed > 0 else default
    except (TypeError, ValueError):
        logger.warning("ERP setting %s is invalid; using default %d.", name, default)
        return default


def provider_config() -> ProviderConfig:
    """Build the ProviderConfig from Django settings (safe defaults applied)."""
    return ProviderConfig(
        base_url=(getattr(settings, "ERP_BASE_URL", "") or "").strip(),
        connect_timeout=float(
            _positive(getattr(settings, "ERP_CONNECT_TIMEOUT", 5), 5, "ERP_CONNECT_TIMEOUT")
        ),
        read_timeout=float(
            _positive(getattr(settings, "ERP_READ_TIMEOUT", 15), 15, "ERP_READ_TIMEOUT")
        ),
        timeout=float(_positive(getattr(settings, "ERP_TIMEOUT", 30), 30, "ERP_TIMEOUT")),
        retry_count=_positive(getattr(settings, "ERP_RETRY_COUNT", 3), 3, "ERP_RETRY_COUNT"),
        retry_backoff=float(
            _positive(getattr(settings, "ERP_RETRY_BACKOFF", 1), 1, "ERP_RETRY_BACKOFF")
        ),
        retry_backoff_cap=float(
            _positive(getattr(settings, "ERP_RETRY_BACKOFF_CAP", 30), 30, "ERP_RETRY_BACKOFF_CAP")
        ),
    )


def validate_erp_config() -> list[str]:
    """Return a list of configuration problems (empty when valid).

    Never raises; the registry uses this to decide the safe fallback.
    """
    problems: list[str] = []
    if not getattr(settings, "ERP_ENABLED", False):
        return problems

    provider_key = getattr(settings, "ERP_PROVIDER", "null")
    if provider_key not in PROVIDERS:
        problems.append(f"ERP_PROVIDER '{provider_key}' is not a known provider.")
        return problems

    base_url = (getattr(settings, "ERP_BASE_URL", "") or "").strip()
    if not base_url:
        problems.append("ERP_BASE_URL is required when ERP_ENABLED=true.")
        return problems
    parts = urlsplit(base_url)
    if parts.scheme not in ("http", "https") or not parts.hostname:
        problems.append("ERP_BASE_URL must be an absolute http(s) URL.")

    timeout = getattr(settings, "ERP_TIMEOUT", 30)
    connect = getattr(settings, "ERP_CONNECT_TIMEOUT", 5)
    read = getattr(settings, "ERP_READ_TIMEOUT", 15)
    retry = getattr(settings, "ERP_RETRY_COUNT", 3)
    if _positive(timeout, 30, "ERP_TIMEOUT") <= 0:
        problems.append("ERP_TIMEOUT must be positive.")
    if _positive(connect, 5, "ERP_CONNECT_TIMEOUT") <= 0:
        problems.append("ERP_CONNECT_TIMEOUT must be positive.")
    if _positive(read, 15, "ERP_READ_TIMEOUT") <= 0:
        problems.append("ERP_READ_TIMEOUT must be positive.")
    if _positive(retry, 3, "ERP_RETRY_COUNT") < 0:
        problems.append("ERP_RETRY_COUNT must be >= 0.")
    return problems


def get_provider() -> ERPProvider:
    """Return the active provider.

    - ``ERP_ENABLED=false`` → ``NullProvider`` (never network).
    - enabled but unknown/misconfigured provider → ``NullProvider`` + warning.
    - enabled and configured → the requested adapter.
    """
    if not getattr(settings, "ERP_ENABLED", False):
        return NullProvider()

    provider_key = getattr(settings, "ERP_PROVIDER", "null")
    problems = validate_erp_config()
    if problems or provider_key not in PROVIDERS:
        for problem in problems:
            logger.warning("ERP configuration problem: %s", problem)
        logger.warning(
            "ERP enabled but not configured safely; falling back to NullProvider."
        )
        return NullProvider()

    provider_class = PROVIDERS[provider_key]
    if provider_class is NullProvider:
        return NullProvider()
    return provider_class(provider_config())
