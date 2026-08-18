"""API tests for health, version, and ping endpoints."""
from rest_framework import status
from rest_framework.test import APITestCase


class HealthEndpointTests(APITestCase):
    """Verify health, version, and ping endpoints + standard envelope."""

    def test_ping(self):
        response = self.client.get("/api/ping/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.json()
        self.assertTrue(body["success"])
        self.assertEqual(body["data"]["status"], "ok")

    def test_version(self):
        response = self.client.get("/api/version/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.json()
        self.assertTrue(body["success"])
        self.assertIn("api_version", body["data"])
        self.assertEqual(body["data"]["api_version"], "v1")
        self.assertIn("app_version", body["data"])

    def test_health(self):
        response = self.client.get("/api/health/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.json()
        self.assertIn("data", body)
        self.assertIn("checks", body["data"])
        self.assertEqual(body["data"]["status"], "healthy")

    def test_standard_error_envelope_on_not_found(self):
        response = self.client.get("/api/v1/articles/99999/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        body = response.json()
        self.assertFalse(body["success"])
        self.assertIsNone(body["data"])
        self.assertIn("errors", body)


class APIVersionTests(APITestCase):
    """Verify versioned routing is mounted under /api/v1/."""

    def test_v1_articles_route(self):
        response = self.client.get("/api/v1/articles/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_v1_projects_route(self):
        response = self.client.get("/api/v1/projects/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_unknown_api_route_returns_404(self):
        response = self.client.get("/api/v9/unknown/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
