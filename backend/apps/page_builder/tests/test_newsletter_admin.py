"""Newsletter admin API tests (Phase 8G): staff-only operations + privacy."""
import csv
import io

from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.page_builder.models import NewsletterSubscription


class NewsletterAdminAPITests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            username="nladmin", email="nla@h.local", password="pass12345"
        )
        self.sub = NewsletterSubscription.objects.create(
            email="reader@example.com",
            locale="en",
            source="articles-newsletter",
            unsubscribe_token="secret-abc-123",
        )
        NewsletterSubscription.objects.create(
            email="fa@example.com",
            locale="fa",
            source="footer",
            unsubscribe_token="secret-fa-123",
        )

    def test_list_requires_staff(self):
        response = self.client.get("/api/v1/admin/newsletter/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_is_paginated_and_never_exposes_tokens(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/v1/admin/newsletter/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.json()
        self.assertIn("pagination", body)
        emails = {item["email"] for item in body["data"]}
        self.assertEqual(emails, {"reader@example.com", "fa@example.com"})
        self.assertTrue(all("unsubscribe_token" not in item for item in body["data"]))

    def test_filter_by_locale_and_search(self):
        self.client.force_authenticate(user=self.admin)
        fa = self.client.get("/api/v1/admin/newsletter/?locale=fa")
        self.assertEqual(len(fa.json()["data"]), 1)
        self.assertEqual(fa.json()["data"][0]["email"], "fa@example.com")
        search = self.client.get("/api/v1/admin/newsletter/?q=reader")
        self.assertEqual(len(search.json()["data"]), 1)

    def test_deactivate_and_activate(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(f"/api/v1/admin/newsletter/{self.sub.pk}/deactivate/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.sub.refresh_from_db()
        self.assertFalse(self.sub.is_active)
        self.assertIsNotNone(self.sub.unsubscribed_at)
        active_response = self.client.post(f"/api/v1/admin/newsletter/{self.sub.pk}/activate/")
        self.assertEqual(active_response.status_code, status.HTTP_200_OK)
        self.sub.refresh_from_db()
        self.assertTrue(self.sub.is_active)
        self.assertIsNone(self.sub.unsubscribed_at)

    def test_export_csv_is_staff_only_and_safe(self):
        response = self.client.get("/api/v1/admin/newsletter/export/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/v1/admin/newsletter/export/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "text/csv")
        rows = list(csv.DictReader(io.StringIO(response.content.decode("utf-8"))))
        self.assertEqual(len(rows), 2)
        self.assertEqual({r["email"] for r in rows}, {"reader@example.com", "fa@example.com"})
        self.assertNotIn("unsubscribe_token", rows[0])

    def test_export_respects_current_filters(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/v1/admin/newsletter/export/?locale=fa")
        rows = list(csv.DictReader(io.StringIO(response.content.decode("utf-8"))))
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["email"], "fa@example.com")

    def test_no_public_listing_endpoint(self):
        # The public newsletter surface is subscribe/unsubscribe only.
        response = self.client.get("/api/v1/newsletter/")
        self.assertIn(
            response.status_code,
            (status.HTTP_404_NOT_FOUND, status.HTTP_405_METHOD_NOT_ALLOWED),
        )
