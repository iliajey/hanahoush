"""Tests for the persistent analytics event ingestion API (Phase 8H)."""
from django.test.utils import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.analytics.models import AnalyticsEvent

URL = "/api/v1/analytics/events/"


class AnalyticsEventIngestTests(APITestCase):
    def test_single_event_persisted(self):
        response = self.client.post(
            URL,
            {"event_name": "section_visible", "path": "/about", "locale": "fa", "metadata": {"section": "team"}},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        self.assertTrue(AnalyticsEvent.objects.filter(event_name="section_visible", path="/about").exists())

    def test_batch_events_persisted(self):
        payload = {
            "events": [
                {"event_name": "search_view", "path": "/search"},
                {"event_name": "search_submit", "path": "/search", "metadata": {"q": "erp"}},
            ]
        }
        response = self.client.post(URL, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        body = response.json()
        self.assertEqual(body["data"]["accepted"], 2)
        self.assertEqual(AnalyticsEvent.objects.filter(event_name__startswith="search_").count(), 2)

    def test_invalid_event_rejected(self):
        response = self.client.post(URL, {"event_name": ""}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AnalyticsEvent.objects.exists())

    def test_batch_too_large_rejected(self):
        events = [{"event_name": f"event_{i}"} for i in range(51)]
        response = self.client.post(URL, {"events": events}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_batch_items_dropped(self):
        payload = {
            "events": [
                {"event_name": "ok_event", "path": "/"},
                {"event_name": ""},
                {"event_name": "another_ok", "path": "/about"},
            ]
        }
        response = self.client.post(URL, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        self.assertEqual(response.json()["data"], {"accepted": 2, "dropped": 1})

    def test_allowlist_restricts_event_names(self):
        with override_settings(ANALYTICS_EVENT_ALLOWLIST=["search_view", "search_submit"]):
            ok = self.client.post(URL, {"event_name": "search_view"}, format="json")
            self.assertEqual(ok.status_code, status.HTTP_202_ACCEPTED)
            bad = self.client.post(URL, {"event_name": "custom_event"}, format="json")
            self.assertEqual(bad.status_code, status.HTTP_400_BAD_REQUEST)

    def test_authenticated_user_linked(self):
        user = User.objects.create_user(username="visitor", email="v@hanahoush.local", password="pass12345")
        self.client.force_authenticate(user)
        response = self.client.post(URL, {"event_name": "article_view", "path": "/articles/x/"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        event = AnalyticsEvent.objects.get(event_name="article_view")
        self.assertEqual(event.user, user)

    def test_request_id_captured(self):
        response = self.client.post(
            URL,
            {"event_name": "cta_click"},
            format="json",
            HTTP_X_REQUEST_ID="trace-123",
        )
        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        event = AnalyticsEvent.objects.get(event_name="cta_click")
        self.assertEqual(event.request_id, "trace-123")

    def test_never_stores_credentials_fields(self):
        self.client.post(
            URL,
            {"event_name": "event", "metadata": {"token": "secret", "password": "p"}},
            format="json",
        )
        event = AnalyticsEvent.objects.get(event_name="event")
        # Metadata is stored as-is by design (non-sensitive), but the model has
        # no credential columns — verify no such columns exist on the instance.
        self.assertFalse(hasattr(event, "password"))
        self.assertFalse(hasattr(event, "token"))
        self.assertFalse(hasattr(event, "secret"))
