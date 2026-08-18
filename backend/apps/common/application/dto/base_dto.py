"""Data Transfer Object base class."""
from dataclasses import asdict, dataclass


@dataclass(frozen=True)
class BaseDTO:
    """Immutable data carrier between layers.

    DTOs decouple the application layer from both the domain entities and
    the ORM models.
    """

    def to_dict(self) -> dict:
        return asdict(self)
