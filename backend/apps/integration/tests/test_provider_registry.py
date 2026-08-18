"""Tests for ERP configuration and provider selection (registry)."""
from django.test import SimpleTestCase
from django.test.utils import override_settings

from apps.integration.infrastructure.providers.null_provider import NullProvider
from apps.integration.infrastructure.providers.odoo_hanrp import OdooHanRPProvider
from apps.integration.infrastructure.providers.registry import (
    KNOWN_PROVIDERS,
    get_provider,
    provider_config,
    validate_erp_config,
)

GOOD_CONFIG = {
    "ERP_ENABLED": True,
    "ERP_PROVIDER": "odoo_hanrp",
    "ERP_BASE_URL": "https://erp.example.com/api",
    "ERP_TIMEOUT": 30,
    "ERP_CONNECT_TIMEOUT": 5,
    "ERP_READ_TIMEOUT": 15,
    "ERP_RETRY_COUNT": 3,
    "ERP_RETRY_BACKOFF": 1,
    "ERP_RETRY_BACKOFF_CAP": 30,
}


class ValidateConfigTests(SimpleTestCase):
    def test_valid_config_no_problems(self):
        with override_settings(**GOOD_CONFIG):
            self.assertEqual(validate_erp_config(), [])

    def test_disabled_is_valid_by_definition(self):
        with override_settings(ERP_ENABLED=False, ERP_PROVIDER="unknown"):
            self.assertEqual(validate_erp_config(), [])

    def test_unknown_provider_reported(self):
        with override_settings(**{**GOOD_CONFIG, "ERP_PROVIDER": "not_a_provider"}):
            problems = validate_erp_config()
            self.assertTrue(any("ERP_PROVIDER" in p for p in problems))

    def test_missing_base_url_reported(self):
        with override_settings(**{**GOOD_CONFIG, "ERP_BASE_URL": ""}):
            problems = validate_erp_config()
            self.assertTrue(any("ERP_BASE_URL" in p for p in problems))

    def test_invalid_base_url_scheme_reported(self):
        with override_settings(**{**GOOD_CONFIG, "ERP_BASE_URL": "ftp://erp.example.com"}):
            problems = validate_erp_config()
            self.assertTrue(any("absolute http(s)" in p for p in problems))


class ProviderConfigTests(SimpleTestCase):
    def test_safe_defaults(self):
        with override_settings(
            ERP_ENABLED=False,
            ERP_BASE_URL="",
            ERP_TIMEOUT=0,
            ERP_CONNECT_TIMEOUT=-1,
            ERP_RETRY_COUNT="oops",
        ):
            config = provider_config()
            self.assertEqual(config.base_url, "")
            self.assertEqual(config.timeout, 30.0)  # invalid -> default
            self.assertEqual(config.connect_timeout, 5.0)
            self.assertEqual(config.retry_count, 3)


class ProviderSelectionTests(SimpleTestCase):
    def test_known_provider_keys(self):
        self.assertIn("null", KNOWN_PROVIDERS)
        self.assertIn("odoo_hanrp", KNOWN_PROVIDERS)

    def test_disabled_returns_null_provider(self):
        with override_settings(ERP_ENABLED=False, ERP_PROVIDER="odoo_hanrp", ERP_BASE_URL=""):
            self.assertIsInstance(get_provider(), NullProvider)

    def test_enabled_unknown_provider_falls_back_to_null(self):
        with override_settings(
            **{**GOOD_CONFIG, "ERP_PROVIDER": "future_mystery_provider"}
        ):
            self.assertIsInstance(get_provider(), NullProvider)

    def test_enabled_misconfigured_falls_back_to_null(self):
        with override_settings(**{**GOOD_CONFIG, "ERP_BASE_URL": ""}):
            self.assertIsInstance(get_provider(), NullProvider)

    def test_enabled_valid_returns_odoo_hanrp(self):
        with override_settings(**GOOD_CONFIG):
            self.assertIsInstance(get_provider(), OdooHanRPProvider)
