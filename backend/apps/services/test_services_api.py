"""API tests for the public Services endpoints."""
from rest_framework import status
from rest_framework.test import APITestCase

from apps.services.models import Service, ServiceSection


class ServicesAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.section = ServiceSection.objects.create(
            title_fa="نرم‌افزار",
            title_en="Software",
            slug="software",
        )
        cls.service = Service.objects.create(
            title_fa="توسعه وب",
            title_en="Web Development",
            slug="web-development",
            short_description_fa="توضیح کوتاه",
            short_description_en="Short description",
            description_fa="توضیح کامل",
            description_en="Full description",
            section=cls.section,
            status="published",
            is_public=True,
            is_featured=True,
        )
        Service.objects.create(
            title_fa="پیش‌نویس",
            title_en="Draft Service",
            slug="draft-service",
            section=cls.section,
            status="draft",
            is_public=True,
        )

    def test_public_list_only_returns_published(self):
        response = self.client.get("/api/v1/services/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.json()
        self.assertTrue(body["success"])
        self.assertEqual(len(body["data"]), 1)
        self.assertEqual(body["data"][0]["slug"], "web-development")
        self.assertIn("pagination", body)

    def test_filter_is_featured(self):
        response = self.client.get("/api/v1/services/?is_featured=true")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()["data"]), 1)

    def test_filter_by_section(self):
        response = self.client.get(f"/api/v1/services/?section={self.section.id}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()["data"]), 1)

    def test_search(self):
        response = self.client.get("/api/v1/services/?q=Development")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()["data"]), 1)

    def test_retrieve_detail(self):
        response = self.client.get(f"/api/v1/services/{self.service.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.json()
        self.assertEqual(body["data"]["slug"], "web-development")
        self.assertIn("description_en", body["data"])

    def test_localized_title_via_accept_language(self):
        response = self.client.get("/api/v1/services/", HTTP_ACCEPT_LANGUAGE="fa")
        item = response.json()["data"][0]
        self.assertEqual(item["title"], "توسعه وب")

    def test_draft_never_visible(self):
        response = self.client.get("/api/v1/services/draft-service/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_service_sections_envelope(self):
        response = self.client.get("/api/v1/service-sections/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.json()
        self.assertTrue(body["success"])
        self.assertEqual(len(body["data"]), 1)
        self.assertEqual(body["data"][0]["services_count"], 1)
