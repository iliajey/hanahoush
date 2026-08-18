"""ERP status service — the application-layer facade above the provider port.

Presentation code depends only on this service (and the port), never on the
registry or adapters. Computes the operational status payload used by the
staff-only health endpoint.
"""
from __future__ import annotations

import time
from typing import Any

from django.conf import settings
from django.utils import timezone

from apps.integration.domain.interfaces.erp_provider import ERPProvider
from apps.integration.infrastructure.providers.registry import get_provider

# Cache key for the last health snapshot so repeated status reads are cheap
# and never hammer the ERP host. Bounded to a short TTL.
LAST_HEALTH_CACHE_KEY = "erp:last_health"
LAST_HEALTH_TTL = 15


class ErpStatusService:
    """Computes ERP operational status for staff surfaces."""

    def __init__(self, provider: ERPProvider | None = None) -> None:
        self._provider = provider

    @property
    def provider(self) -> ERPProvider:
        if self._provider is None:
            self._provider = get_provider()
        return self._provider

    @property
    def enabled(self) -> bool:
        return bool(getattr(settings, "ERP_ENABLED", False))

    def health_payload(self, *, probe: bool = False) -> dict[str, Any]:
        """Build the health payload in the standard envelope shape.

        ``probe=False`` (default) returns the last cached snapshot or a fresh
        disabled state without any network call. ``probe=True`` performs a
        bounded connectivity probe (only safe because it targets the
        configured ``ERP_BASE_URL``, never caller-supplied input).
        """
        from django.core.cache import cache

        if not self.enabled:
            return self._payload_from(
                provider=self.provider.name,
                enabled=False,
                connectivity="disabled",
                latency_ms=None,
                details={"provider": self.provider.name, "enabled": False},
                checked_at=timezone.now(),
            )
        if not probe:
            cached = cache.get(LAST_HEALTH_CACHE_KEY)
            if cached is not None:
                return cached

        started = time.monotonic()
        health = self.provider.health_check()
        latency = health.latency_ms
        if latency is None:
            latency = int((time.monotonic() - started) * 1000)

        payload = self._payload_from(
            provider=self.provider.name,
            enabled=True,
            connectivity=health.status,
            latency_ms=latency,
            details=health.details,
            checked_at=health.checked_at,
            error=health.error,
        )
        cache.set(LAST_HEALTH_CACHE_KEY, payload, LAST_HEALTH_TTL)
        return payload
    def capabilities_payload(self) -> dict[str, Any]:
        capabilities = self.provider.get_capabilities()
        return {
            "provider": capabilities.provider,
            "enabled": capabilities.enabled,
            "verified": capabilities.verified,
            "read": capabilities.read,
            "write": capabilities.write,
            "events": capabilities.events,
            "supported_operations": list(capabilities.supported_operations),
            "notes": list(capabilities.notes),
        }

    @staticmethod
    def _payload_from(
        *,
        provider: str,
        enabled: bool,
        connectivity: str,
        latency_ms: int | None,
        details: dict[str, Any],
        checked_at: Any,
        error: str | None = None,
    ) -> dict[str, Any]:
        from apps.integration.infrastructure.redaction import redact_url

        safe_details: dict[str, Any] = {}
        for key, value in details.items():
            if key in ("base_url", "url", "endpoint") and isinstance(value, str):
                safe_details[key] = redact_url(value)
            else:
                safe_details[key] = value
        return {
            "provider": provider,
            "enabled": enabled,
            "connectivity": connectivity,
            "latency_ms": latency_ms,
            "details": safe_details,
            "checked_at": (
                checked_at.isoformat() if hasattr(checked_at, "isoformat") else checked_at
            ),
            "error": error,
        }
