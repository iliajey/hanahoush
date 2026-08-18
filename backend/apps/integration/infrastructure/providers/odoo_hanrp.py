"""OdooHanRPProvider adapter (Phase 9B foundation).

Per the Phase 9B rules, NO hanRP/Odoo API surface is assumed. Only two
provider-agnostic operations are implemented:

- ``health_check`` — a bounded, read-only connectivity probe against the
  configured ``ERP_BASE_URL`` (no auth, no endpoints assumed, never raises).
- ``get_capabilities`` — declares that nothing is verified yet.

Every resource/event operation raises :class:`ERPOperationNotSupportedError`
until the real hanRP/Odoo mapping is verified by discovery
(``docs/reports/phase-09B-discovery.md``) — those belong to Phase 9C+.
"""
from __future__ import annotations

import logging
import time
from typing import Any

from django.utils import timezone

from apps.integration.domain.exceptions.erp_errors import (
    ERPError,
    ERPOperationNotSupportedError,
)
from apps.integration.domain.interfaces.erp_provider import ERPProvider
from apps.integration.domain.value_objects.provider_health import (
    HEALTH_ERROR,
    HEALTH_OK,
    HEALTH_UNAVAILABLE,
    ProviderCapabilities,
    ProviderHealth,
)
from apps.integration.infrastructure.providers.base_http_provider import (
    BaseHTTPProvider,
    ProviderConfig,
)

logger = logging.getLogger("apps.integration")

UNSUPPORTED_MESSAGE = (
    "Operation requires a verified hanRP/Odoo mapping; "
    "not implemented until Phase 9C (see phase-09B-discovery.md)."
)


class OdooHanRPProvider(BaseHTTPProvider, ERPProvider):
    """Adapter skeleton for hanRP/Odoo behind the provider port."""

    name = "odoo_hanrp"

    def __init__(self, config: ProviderConfig | None = None, **kwargs: Any) -> None:
        super().__init__(config or ProviderConfig(), **kwargs)

    # -- implemented operations ------------------------------------------------

    def health_check(self) -> ProviderHealth:
        started = time.monotonic()
        request_id = "erp-health"
        try:
            if not self.config.base_url:
                return ProviderHealth(
                    status=HEALTH_ERROR,
                    checked_at=timezone.now(),
                    latency_ms=None,
                    details={"provider": self.name, "base_url": ""},
                    error="ERP base URL is not configured.",
                )
            status_code = self.probe("/", request_id=request_id)
            latency_ms = int((time.monotonic() - started) * 1000)
            # Any HTTP response proves reachability; a 4xx/5xx may be an
            # incomplete server config but the host is alive.
            return ProviderHealth(
                status=HEALTH_OK,
                checked_at=timezone.now(),
                latency_ms=latency_ms,
                details={
                    "provider": self.name,
                    "base_url": self.config.base_url,
                    "status": status_code,
                },
            )
        except ERPError as exc:
            latency_ms = int((time.monotonic() - started) * 1000)
            logger.warning(
                "ERP health probe failed",
                extra={"provider": self.name, "request_id": request_id, "error": exc.code},
            )
            return ProviderHealth(
                status=HEALTH_UNAVAILABLE,
                checked_at=timezone.now(),
                latency_ms=latency_ms,
                details={"provider": self.name, "error_category": exc.code},
                error=exc.redacted_message(),
            )
        except Exception as exc:  # pragma: no cover - defensive, never raise
            logger.exception("Unexpected ERP health probe failure", exc_info=exc)
            return ProviderHealth(
                status=HEALTH_ERROR,
                checked_at=timezone.now(),
                latency_ms=None,
                details={"provider": self.name},
                error="Unexpected ERP health probe failure.",
            )

    def get_capabilities(self) -> ProviderCapabilities:
        return ProviderCapabilities(
            provider=self.name,
            enabled=True,
            verified=False,
            read=False,
            write=False,
            events=False,
            supported_operations=("health_check", "get_capabilities"),
            notes=(
                "hanRP/Odoo API surface not yet verified; only connectivity and "
                "capability introspection are available.",
            ),
        )

    # -- not yet verified operations -------------------------------------------

    def get_resource(self, resource_type: str, resource_id: str, **kwargs: Any) -> dict:
        raise ERPOperationNotSupportedError(UNSUPPORTED_MESSAGE)

    def create_resource(
        self,
        resource_type: str,
        payload: dict,
        *,
        idempotency_key: str | None = None,
        request_id: str | None = None,
    ) -> dict:
        raise ERPOperationNotSupportedError(UNSUPPORTED_MESSAGE)

    def update_resource(
        self,
        resource_type: str,
        resource_id: str,
        payload: dict,
        *,
        idempotency_key: str | None = None,
        request_id: str | None = None,
    ) -> dict:
        raise ERPOperationNotSupportedError(UNSUPPORTED_MESSAGE)

    def send_event(
        self,
        event_type: str,
        payload: dict,
        *,
        idempotency_key: str | None = None,
        request_id: str | None = None,
    ) -> dict:
        raise ERPOperationNotSupportedError(UNSUPPORTED_MESSAGE)
