"""Base use case contract.

A use case has a single entry point. Dependencies (repositories, gateways)
are injected through the constructor to honour the Dependency Inversion
Principle and enable easy testing.
"""
from abc import ABC, abstractmethod
from typing import Any


class BaseUseCase(ABC):
    @abstractmethod
    def execute(self, *args: Any, **kwargs: Any) -> Any: ...
