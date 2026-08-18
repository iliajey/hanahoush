"""Abstract base entity shared by all domain entities."""
from abc import ABC
from dataclasses import dataclass


@dataclass
class BaseEntity(ABC):
    """Marker base class for all domain entities.

    Domain entities are plain Python objects (no ORM). Persistence mapping
    happens in the infrastructure layer.
    """

    id: int | None = None
