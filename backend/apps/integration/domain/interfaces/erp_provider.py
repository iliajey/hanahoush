"""ERP provider port (contract).

The single boundary between Hanahoush and any ERP. Domain and application code
depend only on this interface — never on an adapter — mirroring
``apps.common.domain.interfaces.BaseRepository`` (ADR-0006).

Rules:
- No Django, HTTP or Odoo imports in this module.
- Adapters are the only place that knows provider specifics.
- Only operations that are actually supported are implemented; anything else
  raises :class:`~apps.integration.domain.exceptions.erp_errors.ERPOperationNotSupportedError`.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any

from apps.integration.domain.value_objects.provider_health import (
    ProviderCapabilities,
    ProviderHealth,
)


class ERPProvider(ABC):
    """Contract every ERP adapter must satisfy."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Stable provider key used in configuration and logs (e.g. ``odoo_hanrp``)."""

    @abstractmethod
    def health_check(self) -> ProviderHealth:
        """Return the provider connectivity state (never raises).

        Implementations must not throw; failures are reported through the
        returned :class:`ProviderHealth`.
        """

    @abstractmethod
    def get_capabilities(self) -> ProviderCapabilities:
        """Return the provider's declared capabilities."""

    @abstractmethod
    def get_resource(self, resource_type: str, resource_id: str, **kwargs: Any) -> dict:
        """Read one resource from the ERP (read-only).

        Raises :class:`ERPOperationNotSupportedError` when the provider cannot
        yet perform the read (no verified mapping).
        """

    @abstractmethod
    def create_resource(
        self,
        resource_type: str,
        payload: dict,
        *,
        idempotency_key: str | None = None,
        request_id: str | None = None,
    ) -> dict:
        """Create one resource in the ERP (mutating).

        ``idempotency_key`` is propagated to the ERP when supported so replays
        are harmless (see ``docs/architecture/erp-security.md`` §2).
        """

    @abstractmethod
    def update_resource(
        self,
        resource_type: str,
        resource_id: str,
        payload: dict,
        *,
        idempotency_key: str | None = None,
        request_id: str | None = None,
    ) -> dict:
        """Update one resource in the ERP (mutating)."""

    @abstractmethod
    def send_event(
        self,
        event_type: str,
        payload: dict,
        *,
        idempotency_key: str | None = None,
        request_id: str | None = None,
    ) -> dict:
        """Deliver an event to the ERP (mutating, at-least-once)."""
