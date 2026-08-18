"""Contact/inquiry + newsletter privacy tests (Phase 8G)."""
import uuid

from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.page_builder.models import NewsletterSubscription


def valid_payload(**overrides):
    payload = {
        "name": "QA User",
        "email": "qa@example.com",
        "phone": "+98",
        "company": "Acme",
        "subject": "ERP",
        "service_category": "ERP",
        "project_type": "Enterprise",
        "budget_range": "50k-100k",
        "preferred_contact": "email",
        "message": "We need an ERP.",
        "consent": True,
        "locale": "en",
        "source": "/contact",
    }
    payload.update(overrides)
    return payload


class ContactAPITests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(username="padmin", email="pad@h.local", password="pass12345")

    def test_public_submit_returns_request_id(self):
        response = self.client.post("/api/v1/contact/", valid_payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()["data"]
        self.assertEqual(data["status"], "new")
        uuid.UUID(data["request_id"])  # must be a valid correlation id

    def test_consent_required(self):
        response = self.client.post("/api/v1/contact/", valid_payload(consent=False), format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_validation_required_fields(self):
        response = self.client.post("/api/v1/contact/", {"name": "", "email": "bad", "message": ""}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("name", response.json()["errors"])

    def test_honeypot_flags_spam_silently(self):
        response = self.client.post("/api/v1/contact/", valid_payload(email="spam@example.com", website="http://spam"), format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.json()["data"]["status"], "spam")

    def test_visitor_cannot_list(self):
        response = self.client.get("/api/v1/admin/contact/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_staff_list_transition_mark_handled(self):
        self.client.force_authenticate(user=self.admin)
        self.client.post("/api/v1/contact/", valid_payload(), format="json")
        items = self.client.get("/api/v1/admin/contact/").json()["data"]
        self.assertEqual(len(items), 1)
        contact_id = items[0]["id"]
        response = self.client.patch(f"/api/v1/admin/contact/{contact_id}/", {"status": "in_progress"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response = self.client.post(f"/api/v1/admin/contact/{contact_id}/mark-handled/", {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_contact_submission_throttled(self):
        from apps.analytics.api.views import ContactRateThrottle

        class _Throttle(ContactRateThrottle):
            THROTTLE_RATES = {"contact": "2/min"}
            cache_format = "throttle_contact_test_%(ident)s"  # isolate from other tests

        throttle = _Throttle()
        request = self.client.post("/").wsgi_request
        request.META["REMOTE_ADDR"] = "10.9.9.9"
        view = object()
        self.assertTrue(throttle.allow_request(request, view))
        self.assertTrue(throttle.allow_request(request, view))
        self.assertFalse(throttle.allow_request(request, view))


class NewsletterPrivacyTests(APITestCase):
    def test_subscribe_unsubscribe_and_no_public_exposure(self):
        response = self.client.post("/api/v1/newsletter/subscribe/", {"email": "nl@example.com", "locale": "en"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        sub = NewsletterSubscription.objects.get(email="nl@example.com")
        self.assertTrue(sub.unsubscribe_token)

        # No public listing endpoint exposes subscribers.
        response = self.client.get("/api/v1/newsletter/")
        self.assertIn(response.status_code, (status.HTTP_404_NOT_FOUND, status.HTTP_405_METHOD_NOT_ALLOWED))

        # Unsubscribe with the token deactivates.
        response = self.client.post("/api/v1/newsletter/unsubscribe/", {"token": sub.unsubscribe_token}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        sub.refresh_from_db()
        self.assertFalse(sub.is_active)
        self.assertIsNotNone(sub.unsubscribed_at)

    def test_unsubscribe_bogus_token_does_not_enumerate(self):
        response = self.client.post("/api/v1/newsletter/unsubscribe/", {"token": "not-a-token"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)  # no information leaked


class ContactLifecycleTests(APITestCase):
    """Status lifecycle + envelope + enumeration protection (Phase 8G)."""

    def setUp(self):
        self.admin = User.objects.create_superuser(
            username="lcadmin", email="lca@h.local", password="pass12345"
        )

    def test_standard_envelope_on_all_responses(self):
        response = self.client.post("/api/v1/contact/", valid_payload(), format="json")
        body = response.json()
        self.assertEqual(set(body.keys()), {"success", "message", "data", "errors"})
        self.assertTrue(body["success"])
        self.assertIsNone(body["errors"])

    def test_invalid_input_uses_error_envelope(self):
        response = self.client.post("/api/v1/contact/", {"email": "bad"}, format="json")
        body = response.json()
        self.assertFalse(body["success"])
        self.assertIsNone(body["data"])
        self.assertIsNotNone(body["errors"])

    def test_request_id_correlates_admin_and_public_views(self):
        response = self.client.post("/api/v1/contact/", valid_payload(), format="json")
        request_id = response.json()["data"]["request_id"]
        self.client.force_authenticate(user=self.admin)
        items = self.client.get("/api/v1/admin/contact/").json()["data"]
        self.assertEqual(items[0]["request_id"], request_id)

    def test_status_transitions_record_handler(self):
        self.client.post("/api/v1/contact/", valid_payload(), format="json")
        self.client.force_authenticate(user=self.admin)
        contact_id = self.client.get("/api/v1/admin/contact/").json()["data"][0]["id"]

        for status_name in ("in_progress", "resolved", "closed", "spam"):
            patch = self.client.patch(
                f"/api/v1/admin/contact/{contact_id}/", {"status": status_name}, format="json"
            )
            self.assertEqual(patch.status_code, status.HTTP_200_OK, status_name)
            body = patch.json()["data"]
            self.assertEqual(body["status"], status_name)
            self.assertEqual(body["handled_by"], self.admin.username)

    def test_visitor_cannot_retrieve_others_requests(self):
        self.client.post(
            "/api/v1/contact/", valid_payload(email="victim@example.com"), format="json"
        )
        # No public detail endpoint exists; the admin endpoint rejects visitors.
        response = self.client.get("/api/v1/admin/contact/1/")
        self.assertIn(
            response.status_code,
            (status.HTTP_401_UNAUTHORIZED, status.HTTP_404_NOT_FOUND),
        )

    def test_spam_marking_flow_and_counts(self):
        self.client.post(
            "/api/v1/contact/", valid_payload(email="spam2@example.com"), format="json"
        )
        self.client.force_authenticate(user=self.admin)
        self.client.post(
            "/api/v1/contact/",
            valid_payload(email="spam3@example.com", website="fill-me"),
            format="json",
        )
        response = self.client.get("/api/v1/admin/contact/?status=spam")
        self.assertEqual(len(response.json()["data"]), 1)


class OpenAPISchemaTests(APITestCase):
    def test_schema_generates(self):
        import json

        response = self.client.get("/api/schema/", HTTP_ACCEPT="application/json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        schema = json.loads(response.content)
        self.assertIn("openapi", schema)
        paths = schema.get("paths", {})
        # New endpoints are documented.
        self.assertIn("/api/v1/contact/", paths)
        self.assertIn("/api/v1/media/", paths)
        self.assertIn("/api/v1/newsletter/subscribe/", paths)
        self.assertIn("/api/v1/admin/newsletter/", paths)
