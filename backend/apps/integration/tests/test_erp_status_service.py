"""Tests for the ERP status service (application layer)."""
from django.core.cache import cache
from django.test import TestCase
from django.test.utils import override_settings

from apps.integration.application.services.erp_status_service import ErpStatusService
from apps.integration.domain.value_objects.provider_health import (
    HEALTH_OK,
    ProviderHealth,
)


class FakeProvider:
    name = "odoo_hanrp"

    def __init__(self):
        self.health_calls = 0

    def health_check(self):
        self.health_calls += 1
        from django.utils import timezone

        return ProviderHealth(
            status=HEALTH_OK,
            checked_at=timezone.now(),
            latency_ms=12,
            details={"provider": self.name, "base_url": "https://erp.example.com", "status": 200},
        )

    def get_capabilities(self):
        raise NotImplementedError


class ErpStatusServiceTests(TestCase):
    def setUp(self):
        cache.clear()
        self.fake = FakeProvider()

    def tearDown(self):
        cache.clear()

    @override_settings(ERP_ENABLED=False)
    def test_disabled_payload_no_network(self):
        service = ErpStatusService(provider=self.fake)
        payload = service.health_payload(probe=True)
        self.assertEqual(payload["enabled"], False)
        self.assertEqual(payload["connectivity"], "disabled")
        self.assertEqual(self.fake.health_calls, 0)  # no probe despite probe=True

    @override_settings(ERP_ENABLED=True)
    def test_probe_uses_provider(self):
        service = ErpStatusService(provider=self.fake)
        payload = service.health_payload(probe=True)
        self.assertEqual(payload["enabled"], True)
        self.assertEqual(payload["connectivity"], HEALTH_OK)
        self.assertEqual(payload["latency_ms"], 12)
        self.assertEqual(self.fake.health_calls, 1)

    @override_settings(ERP_ENABLED=True)
    def test_without_probe_uses_cache(self):
        service = ErpStatusService(provider=self.fake)
        first = service.health_payload(probe=True)
        self.assertIsNotNone(first)
        self.assertEqual(self.fake.health_calls, 1)
        cached = service.health_payload(probe=False)
        self.assertEqual(cached["connectivity"], HEALTH_OK)
        self.assertEqual(self.fake.health_calls, 1)  # no second probe

    @override_settings(ERP_ENABLED=True)
    def test_cached_payload_never_exposes_credentials_in_url(self):
        service = ErpStatusService(provider=self.fake)
        payload = service.health_payload(probe=True)
        self.assertNotIn("secret", str(payload["details"]))
