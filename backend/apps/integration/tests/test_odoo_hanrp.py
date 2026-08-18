"""Tests for OdooHanRPProvider (Phase 9B skeleton — nothing assumed)."""
from django.test import SimpleTestCase

from apps.integration.domain.exceptions.erp_errors import ERPOperationNotSupportedError
from apps.integration.domain.value_objects.provider_health import (
    HEALTH_ERROR,
    HEALTH_OK,
    HEALTH_UNAVAILABLE,
)
from apps.integration.infrastructure.providers.base_http_provider import ProviderConfig
from apps.integration.infrastructure.providers.odoo_hanrp import OdooHanRPProvider
from apps.integration.infrastructure.transport.http_transport import (
    HTTPResponse,
    HTTPTransportError,
)


class StubTransport:
    def __init__(self, result=None):
        self.result = result
        self.calls = []

    def request(self, *args, **kwargs):
        self.calls.append(kwargs)
        if isinstance(self.result, Exception):
            raise self.result
        return self.result or HTTPResponse(status=200, body=b"ok")


class OdooHanRPProviderTests(SimpleTestCase):
    def test_name(self):
        self.assertEqual(OdooHanRPProvider().name, "odoo_hanrp")

    def test_capabilities_unverified(self):
        caps = OdooHanRPProvider().get_capabilities()
        self.assertFalse(caps.verified)
        self.assertFalse(caps.read)
        self.assertFalse(caps.write)
        self.assertFalse(caps.events)
        self.assertEqual(caps.supported_operations, ("health_check", "get_capabilities"))

    def test_resource_operations_raise_not_supported(self):
        provider = OdooHanRPProvider()
        for call in (
            lambda: provider.get_resource("lead", "1"),
            lambda: provider.create_resource("lead", {}),
            lambda: provider.update_resource("lead", "1", {}),
            lambda: provider.send_event("lead.created", {}),
        ):
            with self.assertRaises(ERPOperationNotSupportedError):
                call()

    def test_health_ok_when_reachable(self):
        transport = StubTransport(result=HTTPResponse(status=200, body=b"ok"))
        provider = OdooHanRPProvider(
            ProviderConfig(base_url="https://erp.example.com/api"), transport=transport
        )
        health = provider.health_check()
        self.assertEqual(health.status, HEALTH_OK)
        self.assertGreaterEqual(health.latency_ms, 0)
        self.assertEqual(health.details["status"], 200)

    def test_health_error_when_base_url_missing(self):
        health = OdooHanRPProvider().health_check()
        self.assertEqual(health.status, HEALTH_ERROR)

    def test_health_unavailable_on_transport_failure(self):
        transport = StubTransport(result=HTTPTransportError("refused"))
        provider = OdooHanRPProvider(
            ProviderConfig(base_url="https://erp.example.com/api"), transport=transport
        )
        health = provider.health_check()
        self.assertEqual(health.status, HEALTH_UNAVAILABLE)
        self.assertIsNotNone(health.error)

    def test_health_never_raises(self):
        transport = StubTransport(result=HTTPTransportError("timeout", timeout=True))
        provider = OdooHanRPProvider(
            ProviderConfig(base_url="https://erp.example.com/api"), transport=transport
        )
        health = provider.health_check()  # must not raise
        self.assertEqual(health.status, HEALTH_UNAVAILABLE)
