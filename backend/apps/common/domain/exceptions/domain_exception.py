"""Base domain exception. All domain errors inherit from this."""


class DomainException(Exception):
    """Base class for all domain-level errors.

    Attributes:
        code: machine-readable error code for the API layer.
    """

    def __init__(self, message: str, code: str = "domain_error") -> None:
        self.code = code
        super().__init__(message)


class EntityNotFoundException(DomainException):
    def __init__(self, message: str = "Entity not found") -> None:
        super().__init__(message, code="entity_not_found")


class ValidationException(DomainException):
    def __init__(self, message: str = "Validation failed") -> None:
        super().__init__(message, code="validation_error")
