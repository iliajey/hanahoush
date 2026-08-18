"""Tests for the shared HTTP base provider (timeouts, retries, errors, IDs).

Uses a fake transport — the normal test suite never touches the network and
never depends on a real ERP server (Phase 9B testing rule).
"""
from django.test import SimpleTestCase

from apps.integration.domain.exceptions.erp_errors import (
    ERPAuthError,
    ERPConnectionError,
    ERPRateLimitedError,
    ERPResponseParseError,
    ERPTimeoutError,
    ERPTransientError,
    ERPValidationError,
)
from apps.integration.infrastructure.providers.base_http_provider import (
    BaseHTTPProvider,
    ProviderConfig,
)
from apps.integration.infrastructure.transport.http_transport import (
    HTTPResponse,
    HTTPTransportError,
)


class FakeTransport:
    """Queued responses / exceptions; the last item repeats once exhausted.

    Repeating the last item lets tests exercise "exhaust retries" cleanly
    without infinite loops. Every call is recorded for assertions.
    """

    def __init__(self, script=None):
        self.script = list(script or [])
        self.calls = []

    def request(self, method, url, *, headers=None, body=None, **kwargs):
        self.calls.append(
            {
                "method": method,
                "url": url,
                "headers": dict(headers or {}),
                "body": body,
                "kwargs": kwargs,
            }
        )
        if not self.script:
            return HTTPResponse(status=200, body=b"{}")
        item = self.script[0]
        if len(self.script) > 1:
            self.script.pop(0)
        if isinstance(item, Exception):
            raise item
        return item


CONFIG = ProviderConfig(base_url="https://erp.example.com/api")


def make_provider(script=None, config=None, sleep=None):
    return BaseHTTPProvider(
        config or CONFIG,
        FakeTransport(script),
        sleep=sleep or (lambda _seconds: None),
    )


class RequestIdPropagationTests(SimpleTestCase):
    def test_request_id_header_sent(self):
        transport = FakeTransport()
        provider = BaseHTTPProvider(CONFIG, transport, sleep=lambda _: None)
        provider.request("GET", "/ping", request_id="rid-123")
        self.assertEqual(transport.calls[0]["headers"].get("X-Request-ID"), "rid-123")

    def test_url_joined_to_configured_base(self):
        transport = FakeTransport()
        provider = BaseHTTPProvider(CONFIG, transport, sleep=lambda _: None)
        provider.request("GET", "ping", request_id="rid")
        self.assertEqual(transport.calls[0]["url"], "https://erp.example.com/api/ping")

    def test_accept_header_set(self):
        transport = FakeTransport()
        provider = BaseHTTPProvider(CONFIG, transport, sleep=lambda _: None)
        provider.request("GET", "/ping")
        self.assertEqual(transport.calls[0]["headers"].get("Accept"), "application/json")

    def test_json_body_encoded(self):
        transport = FakeTransport()
        provider = BaseHTTPProvider(CONFIG, transport, sleep=lambda _: None)
        provider.request("POST", "/lead", json_body={"name": "Ali"})
        self.assertIn(b'"name"', transport.calls[0]["body"])


class RetryBehaviourTests(SimpleTestCase):
    def test_transient_status_retried_then_success(self):
        provider = make_provider(
            script=[
                HTTPResponse(status=500, body=b""),
                HTTPResponse(status=502, body=b""),
                HTTPResponse(status=200, body=b"{}"),
            ]
        )
        response = provider.request("GET", "/ping")
        self.assertEqual(response.status, 200)
        self.assertEqual(len(provider.transport.calls), 3)

    def test_transient_status_exhausts_retries(self):
        provider = make_provider(script=[HTTPResponse(status=503, body=b"")])
        with self.assertRaises(ERPTransientError):
            provider.request("GET", "/ping")
        self.assertEqual(len(provider.transport.calls), CONFIG.retry_count + 1)

    def test_timeout_retried_then_success(self):
        provider = make_provider(
            script=[
                HTTPTransportError("timeout", timeout=True),
                HTTPTransportError("timeout", timeout=True),
                HTTPResponse(status=200, body=b"{}"),
            ]
        )
        response = provider.request("GET", "/ping")
        self.assertEqual(response.status, 200)

    def test_timeout_exhausts_retries(self):
        provider = make_provider(script=[HTTPTransportError("timeout", timeout=True)])
        with self.assertRaises(ERPTimeoutError):
            provider.request("GET", "/ping")

    def test_connection_error_normalized(self):
        provider = make_provider(script=[HTTPTransportError("refused")])
        with self.assertRaises(ERPConnectionError):
            provider.request("GET", "/ping")

    def test_429_rate_limited_not_retried_when_retry_count_zero(self):
        config = ProviderConfig(base_url="https://erp.example.com/api", retry_count=0)
        provider = make_provider(
            config=config,
            script=[HTTPResponse(status=429, body=b"", headers={"retry-after": "2"})],
        )
        with self.assertRaises(ERPRateLimitedError) as ctx:
            provider.request("GET", "/ping")
        self.assertEqual(ctx.exception.retry_after, 2.0)
        self.assertEqual(len(provider.transport.calls), 1)

    def test_backoff_is_bounded(self):
        config = ProviderConfig(
            base_url="https://erp.example.com/api",
            retry_backoff=1,
            retry_backoff_cap=4,
        )
        provider = make_provider(config=config)
        self.assertLessEqual(provider._backoff_delay(5), 4.0)


class NonRetryableErrorTests(SimpleTestCase):
    def test_validation_error_not_retried(self):
        provider = make_provider(script=[HTTPResponse(status=400, body=b"{}")])
        with self.assertRaises(ERPValidationError):
            provider.request("POST", "/lead", json_body={})
        self.assertEqual(len(provider.transport.calls), 1)

    def test_auth_failure_not_retried(self):
        provider = make_provider(script=[HTTPResponse(status=401, body=b"{}")])
        with self.assertRaises(ERPAuthError):
            provider.request("GET", "/ping")
        self.assertEqual(len(provider.transport.calls), 1)

    def test_auth_failure_403_not_retried(self):
        provider = make_provider(script=[HTTPResponse(status=403, body=b"{}")])
        with self.assertRaises(ERPAuthError):
            provider.request("GET", "/ping")

    def test_malformed_json_raises_parse_error(self):
        provider = make_provider(script=[HTTPResponse(status=200, body=b"not-json")])
        with self.assertRaises(ERPResponseParseError):
            provider.parse_json(provider.request("GET", "/ping"))


class ConfigSafetyTests(SimpleTestCase):
    def test_missing_base_url_raises_connection_error(self):
        provider = BaseHTTPProvider(
            ProviderConfig(base_url=""), FakeTransport(), sleep=lambda _: None
        )
        with self.assertRaises(ERPConnectionError):
            provider.request("GET", "/ping")

    def test_errors_never_include_payload(self):
        provider = make_provider(script=[HTTPResponse(status=400, body=b"")])
        try:
            provider.request("POST", "/lead", json_body={"secret": "value"})
        except ERPValidationError as exc:
            self.assertNotIn("value", exc.redacted_message())
        else:  # pragma: no cover
            self.fail("expected ERPValidationError")
