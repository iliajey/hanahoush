"""Secret redaction helpers for the ERP integration layer.

Guarantees the Phase 9B security rule: credentials, tokens, payload bodies,
signatures and raw ERP responses are never logged or returned by operational
surfaces. Used by the HTTP provider and the health endpoint.
"""
from __future__ import annotations

import re
from typing import Any

REDACTED = "***"

# Header names whose values must never be logged.
SENSITIVE_HEADER_PATTERN = re.compile(
    r"^(authorization|proxy-authorization|cookie|set-cookie|x-api-key|apikey)$",
    re.IGNORECASE,
)

# URL query parameters whose values must never be logged.
SENSITIVE_QUERY_PARAMS = {
    "token",
    "access_token",
    "refresh_token",
    "api_key",
    "apikey",
    "key",
    "secret",
    "signature",
    "password",
    "client_secret",
    "authorization_code",
}


def redact_value(value: str | None) -> str:
    """Return ``***`` for any non-empty value, keeping the empty string as-is."""
    if not value:
        return ""
    return REDACTED


def redact_headers(headers: dict[str, str] | None) -> dict[str, str]:
    """Return a copy of headers safe for logging (sensitive values masked)."""
    if not headers:
        return {}
    safe: dict[str, str] = {}
    for key, value in headers.items():
        if SENSITIVE_HEADER_PATTERN.match(key):
            safe[key] = REDACTED
        else:
            safe[key] = value
    return safe


def redact_url(url: str) -> str:
    """Return a URL with sensitive query parameters and userinfo masked.

    The host/path are kept so operators can still recognise the endpoint; the
    ``user:pass@`` prefix and sensitive query values are masked.
    """
    from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

    parts = urlsplit(url)
    netloc = parts.netloc
    if "@" in netloc:
        # ``user:pass@host:port`` → ``***@host:port``
        netloc = REDACTED + "@" + netloc.rsplit("@", 1)[1]
    if not parts.query:
        return urlunsplit((parts.scheme, netloc, parts.path, "", parts.fragment))
    cleaned = [
        (key, REDACTED if key in SENSITIVE_QUERY_PARAMS else value)
        for key, value in parse_qsl(parts.query)
    ]
    return urlunsplit((parts.scheme, netloc, parts.path, urlencode(cleaned), parts.fragment))


def sanitize_payload(payload: Any) -> Any:
    """Recursively mask sensitive keys inside a nested mapping payload."""
    if isinstance(payload, dict):
        return {
            key: REDACTED if key in SENSITIVE_QUERY_PARAMS else sanitize_payload(value)
            for key, value in payload.items()
        }
    if isinstance(payload, (list, tuple)):
        return [sanitize_payload(item) for item in payload]
    return payload
