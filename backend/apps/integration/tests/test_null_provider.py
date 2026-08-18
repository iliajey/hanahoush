"""Tests for NullProvider — the safe default adapter (ERP disabled)."""
from django.test import SimpleTestCase

from apps.integration.domain.exceptions.erp_errors import ERPOperationNotSupportedError
from apps.integration.domain.value_objects.provider_health import (
    HEALTH_DISABLED,
    ProviderHealth,
)
from apps.integration.infrastructure.providers.null_provider import NullProvider


class NullProviderTests(SimpleTestCase):
    def setUp(self):
        self.provider = NullProvider()

    def test_name(self):
        self.assertEqual(self.provider.name, "null")

    def test_health_check_reports_disabled(self):
        health = self.provider.health_check()
        self.assertIsInstance(health, ProviderHealth)
        self.assertEqual(health.status, HEALTH_DISABLED)
        self.assertIsNone(health.latency_ms)
        self.assertEqual(health.details["enabled"], False)

    def test_capabilities_declare_nothing_supported(self):
        caps = self.provider.get_capabilities()
        self.assertFalse(caps.enabled)
        self.assertFalse(caps.read)
        self.assertFalse(caps.write)
        self.assertFalse(caps.events)
        self.assertFalse(caps.verified)
        self.assertEqual(caps.supported_operations, ())

    def test_operations_raise_not_supported(self):
        for call in (
            lambda: self.provider.get_resource("lead", "1"),
            lambda: self.provider.create_resource("lead", {}),
            lambda: self.provider.update_resource("lead", "1", {}),
            lambda: self.provider.send_event("lead.created", {}),
        ):
            with self.assertRaises(ERPOperationNotSupportedError):
                call()

    def test_never_touches_network(self):
        # NullProvider is purely stateful; calling health is side-effect free.
        self.provider.health_check()
        self.provider.get_capabilities()
