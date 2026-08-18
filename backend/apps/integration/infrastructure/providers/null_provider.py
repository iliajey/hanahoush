"""NullProvider — the safe default adapter.

Used whenever ERP integration is disabled (``ERP_ENABLED=false``) or the
configured provider is unknown/unconfigured. The application behaves exactly as
it did before Phase 9B: every ERP operation reports ``not_supported`` and the
health endpoint reports ``disabled``. No network calls are ever made.
"""
from __future__ import annotations

from typing import Any

from django.utils import timezone

from apps.integration.domain.exceptions.erp_errors import ERPOperationNotSupportedError
from apps.integration.domain.interfaces.erp_provider import ERPProvider
from apps.integration.domain.value_objects.provider_health import (
    HEALTH_DISABLED,
    ProviderCapabilities,
    ProviderHealth,
)


class NullProvider(ERPProvider):
    """Adapter that keeps the system fully functional with ERP disabled."""

    name = "null"

    def health_check(self) -> ProviderHealth:
        return ProviderHealth(
            status=HEALTH_DISABLED,
            checked_at=timezone.now(),
            latency_ms=None,
            details={"provider": self.name, "enabled": False},
        )

    def get_capabilities(self) -> ProviderCapabilities:
        return ProviderCapabilities(
            provider=self.name,
            enabled=False,
            verified=False,
            read=False,
            write=False,
            events=False,
            supported_operations=(),
            notes=("ERP integration is disabled; configure ERP_* settings and re-enable.",),
        )

    def get_resource(self, resource_type: str, resource_id: str, **kwargs: Any) -> dict:
        raise ERPOperationNotSupportedError("ERP integration is disabled.")

    def create_resource(
        self,
        resource_type: str,
        payload: dict,
        *,
        idempotency_key: str | None = None,
        request_id: str | None = None,
    ) -> dict:
        raise ERPOperationNotSupportedError("ERP integration is disabled.")

    def update_resource(
        self,
        resource_type: str,
        resource_id: str,
        payload: dict,
        *,
        idempotency_key: str | None = None,
        request_id: str | None = None,
    ) -> dict:
        raise ERPOperationNotSupportedError("ERP integration is disabled.")

    def send_event(
        self,
        event_type: str,
        payload: dict,
        *,
        idempotency_key: str | None = None,
        request_id: str | None = None,
    ) -> dict:
        raise ERPOperationNotSupportedError("ERP integration is disabled.")
