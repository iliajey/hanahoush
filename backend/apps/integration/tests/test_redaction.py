"""Tests for secret redaction helpers (Phase 9B security rules)."""
from django.test import SimpleTestCase

from apps.integration.infrastructure.redaction import (
    REDACTED,
    redact_headers,
    redact_url,
    redact_value,
    sanitize_payload,
)


class RedactValueTests(SimpleTestCase):
    def test_empty_value_stays_empty(self):
        self.assertEqual(redact_value(""), "")
        self.assertEqual(redact_value(None), "")

    def test_non_empty_value_masked(self):
        self.assertEqual(redact_value("supersecret"), REDACTED)


class RedactHeaderTests(SimpleTestCase):
    def test_sensitive_headers_masked(self):
        safe = redact_headers(
            {"Authorization": "Bearer abc", "X-Api-Key": "k", "X-Request-ID": "rid-1"}
        )
        self.assertEqual(safe["Authorization"], REDACTED)
        self.assertEqual(safe["X-Api-Key"], REDACTED)
        # Request ID is a correlation value, not a secret — preserved.
        self.assertEqual(safe["X-Request-ID"], "rid-1")

    def test_none_safe(self):
        self.assertEqual(redact_headers(None), {})


class RedactUrlTests(SimpleTestCase):
    def test_plain_url_unchanged(self):
        self.assertEqual(redact_url("https://erp.example.com/v1"), "https://erp.example.com/v1")

    def test_sensitive_query_param_masked(self):
        url = "https://erp.example.com/api?token=abc123&page=2"
        redacted = redact_url(url)
        self.assertNotIn("abc123", redacted)
        self.assertIn("page=2", redacted)

    def test_userinfo_masked(self):
        redacted = redact_url("https://user:secret@erp.example.com/path")
        self.assertNotIn("secret", redacted)
        self.assertNotIn("user", redacted.split("@")[0])
        self.assertIn("erp.example.com", redacted)


class SanitizePayloadTests(SimpleTestCase):
    def test_nested_secret_keys_masked(self):
        payload = {
            "name": "Ali",
            "credentials": {"api_key": "x", "token": "y"},
            "items": [{"key": "z"}],
        }
        cleaned = sanitize_payload(payload)
        self.assertEqual(cleaned["name"], "Ali")
        self.assertEqual(cleaned["credentials"]["api_key"], REDACTED)
        self.assertEqual(cleaned["credentials"]["token"], REDACTED)
        self.assertEqual(cleaned["items"][0]["key"], REDACTED)
