"""Shared HTTP provider base for backend-to-ERP calls.

Provider-agnostic (no Odoo assumptions): timeouts, bounded retries with
exponential backoff + jitter, request-ID propagation, HTTP-status-based error
normalization onto the ERP taxonomy, secret redaction and structured safe
logging. Cross-cutting retry/backoff policy is centralized here so behaviour is
identical for every provider (ADR-0011).
"""
from __future__ import annotations

import json
import logging
import random
import time
from collections.abc import Mapping
from dataclasses import dataclass
from typing import Any
from urllib.parse import urljoin

from apps.integration.domain.exceptions.erp_errors import (
    ERPAuthError,
    ERPConnectionError,
    ERPRateLimitedError,
    ERPResponseParseError,
    ERPTimeoutError,
    ERPTransientError,
    ERPValidationError,
)
from apps.integration.infrastructure.redaction import redact_headers, redact_url
from apps.integration.infrastructure.transport.http_transport import (
    HTTPResponse,
    HTTPTransport,
    HTTPTransportError,
    build_default_transport,
)

logger = logging.getLogger("apps.integration")
error_logger = logging.getLogger("apps.integration.errors")

# HTTP statuses eligible for retry (network-level retries are handled separately).
RETRYABLE_STATUS_CODES = {408, 429, 500, 502, 503, 504}

AUTH_STATUS_CODES = {401, 403}
VALIDATION_STATUS_CODES = {400, 422}


@dataclass(frozen=True)
class ProviderConfig:
    """Configuration consumed by HTTP-based providers (never secrets in logs)."""

    base_url: str = ""
    connect_timeout: float = 5.0
    read_timeout: float = 15.0
    timeout: float = 30.0
    retry_count: int = 3
    retry_backoff: float = 1.0
    retry_backoff_cap: float = 30.0


class BaseHTTPProvider:
    """Shared outbound HTTP behaviour. Subclasses add provider-specific auth."""

    def __init__(
        self,
        config: ProviderConfig,
        transport: HTTPTransport | None = None,
        *,
        clock: Any = time.monotonic,
        sleep: Any = time.sleep,
    ) -> None:
        self.config = config
        self.transport = transport if transport is not None else build_default_transport()
        self._clock = clock
        self._sleep = sleep

    # -- public request helper -------------------------------------------------

    def request(
        self,
        method: str,
        path: str,
        *,
        json_body: Any = None,
        raw_body: bytes | None = None,
        headers: Mapping[str, str] | None = None,
        request_id: str | None = None,
        extra_headers: Mapping[str, str] | None = None,
        timeout_override: float | None = None,
    ) -> HTTPResponse:
        """Perform a request with bounded retries and normalized errors.

        Raises only :class:`~apps.integration.domain.exceptions.erp_errors.ERPError`
        subclasses. ``path`` is joined onto the configured ``base_url`` (never an
        arbitrary caller-supplied host).
        """
        url = self._build_url(path)
        payload = json.dumps(json_body).encode("utf-8") if json_body is not None else raw_body
        request_headers = self._merge_headers(request_id, headers, extra_headers)

        last_erp_error: Exception | None = None
        for attempt in range(self.config.retry_count + 1):
            if attempt > 0:
                delay = self._backoff_delay(attempt)
                self._sleep(delay)
            try:
                response = self.transport.request(
                    method,
                    url,
                    headers=request_headers,
                    body=payload,
                    connect_timeout=self.config.connect_timeout,
                    read_timeout=self.config.read_timeout,
                    overall_timeout=timeout_override or self.config.timeout,
                )
                self._log_attempt(method, path, attempt, response.status, request_id)
                if response.status in RETRYABLE_STATUS_CODES:
                    if attempt < self.config.retry_count:
                        last_erp_error = self._transient_for(response, request_id)
                        continue
                    raise self._transient_for(response, request_id)
                if response.status in AUTH_STATUS_CODES:
                    raise ERPAuthError(
                        "ERP authentication failed.",
                        status_code=response.status,
                        request_id=request_id,
                    )
                if response.status in VALIDATION_STATUS_CODES:
                    raise ERPValidationError(
                        "ERP rejected the payload.",
                        status_code=response.status,
                        request_id=request_id,
                    )
                if response.status >= 400:
                    raise self._transient_for(response, request_id)
                return response
            except HTTPTransportError as exc:
                last_erp_error = self._from_transport(exc, request_id)
                if attempt < self.config.retry_count:
                    continue
                raise last_erp_error from exc

        # Unreachable in practice (loop returns or raises), defensive fallback.
        raise last_erp_error or ERPConnectionError(
            "ERP request failed after retries.", request_id=request_id
        )

    # -- helpers ---------------------------------------------------------------

    def probe(self, path: str = "/", *, request_id: str | None = None) -> int:
        """Single, non-retried connectivity probe.

        Returns the HTTP status on any received response (reachable) or raises
        an ERP error subclass on transport failure. Used by health checks where
        a 404/5xx still proves the host is reachable.
        """
        try:
            response = self.transport.request(
                "GET",
                self._build_url(path),
                headers={"Accept": "application/json"},
                connect_timeout=self.config.connect_timeout,
                read_timeout=self.config.read_timeout,
                overall_timeout=min(self.config.timeout, 5.0),
            )
            return response.status
        except HTTPTransportError as exc:
            raise self._from_transport(exc, request_id) from exc
        except (ERPConnectionError, ERPTimeoutError):
            raise
        except Exception as exc:  # pragma: no cover - defensive
            raise ERPConnectionError(
                "ERP connection error.", request_id=request_id
            ) from exc

    def _build_url(self, path: str) -> str:
        base = (self.config.base_url or "").rstrip("/")
        if not base:
            raise ERPConnectionError("ERP base URL is not configured.")
        return urljoin(base + "/", path.lstrip("/"))

    def _merge_headers(
        self,
        request_id: str | None,
        headers: Mapping[str, str] | None,
        extra_headers: Mapping[str, str] | None,
    ) -> dict[str, str]:
        merged: dict[str, str] = {}
        if headers:
            merged.update(headers)
        if extra_headers:
            merged.update(extra_headers)
        if request_id:
            merged.setdefault("X-Request-ID", request_id)
        merged.setdefault("Accept", "application/json")
        return merged

    def _backoff_delay(self, attempt: int) -> float:
        """Exponential backoff with jitter: ``base * 2^(attempt-1)`` capped."""
        raw = self.config.retry_backoff * (2 ** (attempt - 1))
        capped = min(raw, self.config.retry_backoff_cap)
        # Jitter uses a non-cryptographic PRNG (S311); no security boundary here.
        return round(random.uniform(0.5 * capped, capped), 3)  # noqa: S311

    def _from_transport(self, exc: HTTPTransportError, request_id: str | None) -> Exception:
        if exc.timeout:
            return ERPTimeoutError(
                "ERP request timed out.", status_code=exc.status_code, request_id=request_id
            )
        return ERPConnectionError(
            "ERP connection error.", status_code=exc.status_code, request_id=request_id
        )

    def _transient_for(self, response: HTTPResponse, request_id: str | None) -> Exception:
        if response.status == 429:
            retry_after = self._parse_retry_after(response.header("retry-after"))
            return ERPRateLimitedError(
                "ERP rate limit exceeded.",
                status_code=response.status,
                retry_after=retry_after,
                request_id=request_id,
            )
        return ERPTransientError(
            "ERP transient failure.",
            status_code=response.status,
            request_id=request_id,
        )

    @staticmethod
    def _parse_retry_after(value: str | None) -> float | None:
        if not value:
            return None
        try:
            return float(value)
        except (TypeError, ValueError):
            return None

    # -- safe logging ----------------------------------------------------------

    def _log_attempt(
        self, method: str, path: str, attempt: int, status: int, request_id: str | None
    ) -> None:
        logger.info(
            "ERP outbound attempt",
            extra={
                "provider": "http",
                "method": method,
                "path": path,
                "attempt": attempt,
                "status": status,
                "request_id": request_id,
                "integration_id": redact_url(self.config.base_url),
            },
        )

    # -- response parsing ------------------------------------------------------

    @staticmethod
    def parse_json(response: HTTPResponse, *, request_id: str | None = None) -> Any:
        """Parse a JSON response body; malformed bodies raise a normalized error."""
        try:
            return json.loads(response.text)
        except (ValueError, TypeError) as exc:
            raise ERPResponseParseError(
                "ERP returned an unparseable response.",
                status_code=response.status,
                request_id=request_id,
            ) from exc

    # -- logging-safe introspection --------------------------------------------

    def safe_summary(self, request_id: str | None = None) -> dict[str, Any]:
        """Operational summary with every secret redacted."""
        return {
            "provider": "http",
            "base_url": redact_url(self.config.base_url),
            "connect_timeout": self.config.connect_timeout,
            "read_timeout": self.config.read_timeout,
            "timeout": self.config.timeout,
            "retry_count": self.config.retry_count,
            "headers": redact_headers({"authorization": "hidden"}),
            "request_id": request_id,
        }
