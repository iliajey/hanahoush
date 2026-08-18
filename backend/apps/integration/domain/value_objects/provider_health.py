"""Value objects returned by the ERP provider boundary.

Immutable, framework-free containers so domain/application code sees one
canonical shape regardless of the active provider. Follows the existing
``apps.common.domain.value_objects.BaseValueObject`` pattern.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

from apps.common.domain.value_objects.base_value_object import BaseValueObject

HEALTH_OK = "ok"
HEALTH_UNAVAILABLE = "unavailable"
HEALTH_DISABLED = "disabled"
HEALTH_ERROR = "error"


@dataclass(frozen=True)
class ProviderHealth(BaseValueObject):
    """Result of a provider health probe.

    ``status`` is one of ``ok`` / ``unavailable`` / ``disabled`` / ``error``.
    ``details`` and ``error`` are safe-to-log (never credentials, payloads or
    full internal URLs).
    """

    status: str
    checked_at: datetime
    latency_ms: int | None = None
    details: dict[str, Any] = field(default_factory=dict)
    error: str | None = None

    @property
    def ok(self) -> bool:
        return self.status == HEALTH_OK


@dataclass(frozen=True)
class ProviderCapabilities(BaseValueObject):
    """Declared capabilities of the active provider.

    ``verified`` is False until the real hanRP/Odoo API surface is confirmed by
    discovery. ``supported_operations`` lists exactly what may be called.
    """

    provider: str
    enabled: bool
    verified: bool
    read: bool
    write: bool
    events: bool
    supported_operations: tuple[str, ...] = field(default_factory=tuple)
    notes: tuple[str, ...] = field(default_factory=tuple)
