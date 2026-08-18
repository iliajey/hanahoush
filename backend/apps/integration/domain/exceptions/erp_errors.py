"""ERP provider error taxonomy.

One normalized error model for every provider. Domain and application code catch
only these exceptions (never raw transport/HTTP errors), mirroring the rules in
``docs/architecture/erp-security.md`` (§2) and ADR-0011.

Taxonomy rules:
- ``retryable`` exceptions may be retried by the caller (network, timeout,
  transient HTTP 408/429/5xx).
- Non-retryable exceptions surface immediately (auth, validation, unsupported,
  provider disabled).
- Messages must never contain credentials, tokens, payload bodies, signatures
  or raw ERP responses. Use :meth:`ERPError.redacted_message`.
"""
from __future__ import annotations

from typing import Any


class ERPError(Exception):
    """Base class for every ERP integration error.

    Attributes:
        code: machine-readable category (mirrors the DRF error bucket).
        retryable: whether the operation may be retried.
        status_code: optional HTTP status that triggered the error.
        retry_after: seconds to wait before retry (from an ERP ``Retry-After``).
        request_id: correlation id attached at failure time (never a secret).
    """

    code = "erp_error"
    retryable = False
    category = "erp"

    def __init__(
        self,
        message: str,
        *,
        status_code: int | None = None,
        retry_after: float | None = None,
        request_id: str | None = None,
    ) -> None:
        self.status_code = status_code
        self.retry_after = retry_after
        self.request_id = request_id
        super().__init__(message)

    def redacted_message(self) -> str:
        """Return a log-safe message.

        The base message is constructed by callers to never contain secrets;
        this method is the single place that guarantees the invariant.
        """
        return str(self.args[0]) if self.args else self.__class__.__name__


class ERPConnectionError(ERPError):
    """Network-level failure (DNS, refused, reset)."""

    code = "erp_connection_error"
    retryable = True
    category = "connection"


class ERPTimeoutError(ERPError):
    """Connect/read/overall timeout budget exceeded."""

    code = "erp_timeout"
    retryable = True
    category = "timeout"


class ERPTransientError(ERPError):
    """Transient HTTP failure eligible for retry (408/429/5xx)."""

    code = "erp_transient_error"
    retryable = True
    category = "transient"


class ERPRateLimitedError(ERPTransientError):
    """ERP rate limit (429). ``retry_after`` carries the ERP hint."""

    code = "erp_rate_limited"
    retryable = True
    category = "rate_limited"


class ERPAuthError(ERPError):
    """Authentication/authorization failure (401/403). Never retried."""

    code = "erp_auth_error"
    retryable = False
    category = "auth"


class ERPValidationError(ERPError):
    """The ERP rejected the payload (400/422). Never retried."""

    code = "erp_validation_error"
    retryable = False
    category = "validation"


class ERPOperationNotSupportedError(ERPError):
    """The provider does not support the operation (not yet verified).

    Raised by ``NullProvider`` for every operation and by
    ``OdooHanRPProvider`` for resource/event operations whose hanRP mapping
    has not been verified by discovery (Phase 9B rules).
    """

    code = "erp_operation_not_supported"
    retryable = False
    category = "not_supported"


class ERPProviderUnavailableError(ERPError):
    """Provider disabled or circuit breaker open — fail fast, never retried."""

    code = "erp_provider_unavailable"
    retryable = False
    category = "provider_unavailable"


class ERPResponseParseError(ERPError):
    """The ERP response could not be parsed safely. Never retried."""

    code = "erp_response_parse_error"
    retryable = False
    category = "response_parse"


def normalize_error(exc: Any, *, request_id: str | None = None) -> ERPError:
    """Map a generic exception onto the ERP taxonomy (safety net).

    Transport-layer exceptions are already normalized by the HTTP provider;
    this handles anything that escapes, so no raw error ever crosses the
    boundary. ``exc`` may be an ERP error (passed through) or a standard
    library exception.
    """
    if isinstance(exc, ERPError):
        if request_id and exc.request_id is None:
            exc.request_id = request_id
        return exc

    name = exc.__class__.__name__  # safe: class name only, never the arg string
    if isinstance(exc, TimeoutError):
        return ERPTimeoutError("ERP request timed out.", request_id=request_id)
    if isinstance(exc, (ConnectionError, OSError)):
        return ERPConnectionError(f"ERP connection error ({name}).", request_id=request_id)
    return ERPError(f"Unexpected ERP error ({name}).", request_id=request_id)
