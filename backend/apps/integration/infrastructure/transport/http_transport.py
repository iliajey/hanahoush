"""Minimal stdlib HTTP transport for backend-to-ERP calls.

Uses ``http.client`` — no third-party dependency (``requests`` is intentionally
not installed). Supports separate connect and read timeouts plus an overall
budget, matching the `ERP_CONNECT_TIMEOUT` / `ERP_READ_TIMEOUT` / `ERP_TIMEOUT`
settings. The transport is wrapped in a class so tests substitute a fake and the
normal test suite never touches the network.

Every failure is wrapped into :class:`HTTPTransportError`; raw socket/HTTP
exceptions never escape this module.
"""
from __future__ import annotations

import http.client
import socket
import ssl
import time as _time
from collections.abc import Mapping
from dataclasses import dataclass, field
from urllib.parse import urlparse

HTTP_METHODS = {"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"}


class HTTPTransportError(Exception):
    """Low-level transport failure marker (internal, not part of the ERP taxonomy).

    Attributes:
        timeout: True when the failure was a timeout.
        status_code: HTTP status when one was received.
        retry_after: parsed ``Retry-After`` seconds when present.
    """

    def __init__(
        self,
        message: str,
        *,
        timeout: bool = False,
        status_code: int | None = None,
        retry_after: float | None = None,
    ) -> None:
        self.timeout = timeout
        self.status_code = status_code
        self.retry_after = retry_after
        super().__init__(message)


@dataclass(frozen=True)
class HTTPResponse:
    """Normalized HTTP response (no response object leaks to providers)."""

    status: int
    body: bytes = b""
    headers: dict[str, str] = field(default_factory=dict)

    @property
    def text(self) -> str:
        return self.body.decode("utf-8", errors="replace")

    def header(self, name: str, default: str | None = None) -> str | None:
        for key, value in self.headers.items():
            if key.lower() == name.lower():
                return value
        return default


def build_default_transport() -> HTTPTransport:
    """Return the real HTTP transport used by providers."""
    return HTTPTransport()


class HTTPTransport:
    """HTTP/1.1 transport with connect/read/overall timeout handling."""

    def request(
        self,
        method: str,
        url: str,
        *,
        headers: Mapping[str, str] | None = None,
        body: bytes | None = None,
        connect_timeout: float = 5.0,
        read_timeout: float = 15.0,
        overall_timeout: float = 30.0,
    ) -> HTTPResponse:
        method = method.upper()
        if method not in HTTP_METHODS:
            raise HTTPTransportError(f"Unsupported HTTP method ({method}).")
        scheme, host, port, target = self._split_url(url)
        conn: http.client.HTTPConnection | None = None
        try:
            conn = self._connect(scheme, host, port, connect_timeout)
            start = _time.monotonic()
            deadline = start + overall_timeout

            def _guard() -> None:
                if _time.monotonic() > deadline:
                    raise HTTPTransportError("ERP overall request budget exceeded.", timeout=True)

            conn.request(method, target, body=body, headers=dict(headers or {}))
            if conn.sock is not None:
                conn.sock.settimeout(read_timeout)
            _guard()
            response = conn.getresponse()
            _guard()
            payload = response.read()
            _guard()
            return HTTPResponse(
                status=response.status,
                body=payload,
                headers={k.lower(): v for k, v in response.getheaders()},
            )
        except HTTPTransportError:
            raise
        except TimeoutError as exc:
            raise HTTPTransportError("ERP request timed out.", timeout=True) from exc
        except (socket.gaierror, ConnectionRefusedError, ConnectionResetError,
                OSError, http.client.HTTPException, ssl.SSLError) as exc:
            raise HTTPTransportError(
                f"ERP transport error ({exc.__class__.__name__})."
            ) from exc
        finally:
            if conn is not None:
                conn.close()

    @staticmethod
    def _split_url(url: str) -> tuple[str, str, int, str]:
        parsed = urlparse(url)
        scheme = parsed.scheme.lower()
        if scheme not in ("http", "https"):
            raise HTTPTransportError("Unsupported ERP URL scheme (http/https required).")
        host = parsed.hostname or ""
        if not host:
            raise HTTPTransportError("ERP URL is missing a host.")
        port = parsed.port or (443 if scheme == "https" else 80)
        path = parsed.path or "/"
        target = path + ("?" + parsed.query if parsed.query else "")
        return scheme, host, port, target

    @staticmethod
    def _connect(scheme: str, host: str, port: int, connect_timeout: float):
        if scheme == "https":
            return http.client.HTTPSConnection(
                host, port, timeout=connect_timeout, context=ssl.create_default_context()
            )
        return http.client.HTTPConnection(host, port, timeout=connect_timeout)
