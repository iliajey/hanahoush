"""Base value object pattern."""
from abc import ABC
from dataclasses import dataclass


@dataclass(frozen=True)
class BaseValueObject(ABC):
    """Immutable, equality-by-value container used across domains."""

    def __post_init__(self) -> None:
        self._validate()

    def _validate(self) -> None:
        """Subclasses override to enforce invariants."""
