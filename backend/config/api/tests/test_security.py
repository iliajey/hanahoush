"""Tests for security hardening middleware (Phase 8H)."""
from rest_framework import status
from rest_framework.test import APITestCase


class SecurityHeaderTests(APITestCase):
    def test_security_headers_on_public_endpoint(self):
        response = self.client.get("/api/v1/articles/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["X-Content-Type-Options"], "nosniff")
        self.assertEqual(response["Referrer-Policy"], "strict-origin-when-cross-origin")
        self.assertIn("Permissions-Policy", response)

    def test_cache_control_no_store_on_auth_endpoint(self):
        response = self.client.post("/api/v1/auth/login/", {"username": "x", "password": "y"}, format="json")
        self.assertEqual(response["Cache-Control"], "no-store")

    def test_cache_control_no_store_on_admin_endpoint(self):
        response = self.client.get("/api/v1/admin/dashboard/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response["Cache-Control"], "no-store")

    def test_public_cms_not_no_store(self):
        response = self.client.get("/api/v1/articles/")
        self.assertNotEqual(response.get("Cache-Control"), "no-store")
