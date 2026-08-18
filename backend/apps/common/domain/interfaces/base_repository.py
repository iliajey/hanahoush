"""Interfaces (ports) that the application layer depends upon.

Repositories, services and gateways are declared here as abstract classes
so that domain/application layers never import from the infrastructure layer.
"""
from abc import ABC, abstractmethod
from typing import Any, Generic, TypeVar

T = TypeVar("T")


class BaseRepository(ABC, Generic[T]):
    """Contract every repository implementation must satisfy."""

    @abstractmethod
    def get(self, *args: Any, **kwargs: Any) -> T: ...

    @abstractmethod
    def list(self, *args: Any, **kwargs: Any) -> list[T]: ...

    @abstractmethod
    def create(self, *args: Any, **kwargs: Any) -> T: ...

    @abstractmethod
    def update(self, *args: Any, **kwargs: Any) -> T: ...

    @abstractmethod
    def delete(self, *args: Any, **kwargs: Any) -> None: ...


class BaseUnitOfWork(ABC):
    """Contract for atomic transaction boundaries (outbox ready)."""

    @abstractmethod
    def __enter__(self) -> "BaseUnitOfWork": ...

    @abstractmethod
    def __exit__(self, *args: Any) -> None: ...

    @abstractmethod
    def commit(self) -> None: ...

    @abstractmethod
    def rollback(self) -> None: ...
