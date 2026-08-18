"""Tests for the admin intelligence dashboard API (Phase 8H)."""
from django.test.utils import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.articles.models import Article
from apps.page_builder.models import NewsletterSubscription

URL = "/api/v1/admin/dashboard/"


class AdminDashboardTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.staff = User.objects.create_user(
            username="staff", email="staff@hanahoush.local", password="pass12345", is_staff=True
        )
        cls.superuser = User.objects.create_superuser(
            username="root", email="root@hanahoush.local", password="pass12345"
        )
        cls.normal = User.objects.create_user(
            username="visitor", email="visitor@hanahoush.local", password="pass12345"
        )
        Article.objects.create(
            title_en="Dashboard Article",
            slug="dashboard-article",
            description_en="Body",
            status="published",
            is_public=True,
        )

    def test_anonymous_denied(self):
        response = self.client.get(URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_non_staff_denied(self):
        self.client.force_authenticate(self.normal)
        response = self.client.get(URL)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_staff_allowed(self):
        self.client.force_authenticate(self.staff)
        response = self.client.get(URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.json()
        self.assertTrue(body["success"])
        self.assertIn("content", body["data"])
        self.assertEqual(body["data"]["content"]["articles_published"], 1)

    def test_superuser_allowed(self):
        self.client.force_authenticate(self.superuser)
        response = self.client.get(URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_never_exposes_secrets(self):
        self.client.force_authenticate(self.staff)
        body = self.client.get(URL).json()["data"]
        serialized = str(body).lower()
        for secret in ("secret_key", "password", "token", "signing"):
            self.assertNotIn(secret, serialized)

    def test_system_section_for_staff(self):
        self.client.force_authenticate(self.staff)
        system = self.client.get(URL).json()["data"]["system"]
        self.assertIn("database", system)
        self.assertIn("cache", system)
        self.assertIn("migrations", system)
        self.assertIn("environment", system)
        self.assertIn("version", system)

    def test_dashboard_payload_is_cached(self):
        with override_settings(CACHES={"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache", "LOCATION": "dash-test"}}):
            self.client.force_authenticate(self.staff)
            first = self.client.get(URL).json()["data"]
            NewsletterSubscription.objects.create(email="new@hanahoush.local", locale="en")
            second = self.client.get(URL).json()["data"]
            self.assertEqual(first["engagement"]["newsletter_subscriptions"], second["engagement"]["newsletter_subscriptions"])
