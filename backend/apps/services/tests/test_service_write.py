"""Phase 15.5: staff write path for ``Service`` (public<->studio parity).

Covers: staff can create/update services, validation enforces Persian
title+description for publishing, anonymous/non-staff cannot write, and the
public list stays draft-protected.
"""
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.services.models import Service, ServiceSection


class ServiceWriteTests(APITestCase):
    def setUp(self):
        self.staff = User.objects.create_user(
            username="svc-staff", email="svc@h.local", password="pass12345", is_staff=True
        )
        self.plain = User.objects.create_user(
            username="svc-visitor", email="svc-v@h.local", password="pass12345"
        )
        self.section = ServiceSection.objects.create(title_en="Software", slug="software")
        self.service = Service.objects.create(
            title_en="Web Development",
            title_fa="توسعه وب",
            slug="web-development",
            description_en="Full description",
            description_fa="توضیح کامل",
            section=self.section,
            status="draft",
        )

    def url(self):
        return f"/api/v1/services/{self.service.pk}/"

    def test_staff_can_create_service(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.post(
            "/api/v1/services/",
            {
                "title_en": "API Design",
                "title_fa": "طراحی API",
                "slug": "api-design",
                "description_en": "Design APIs.",
                "description_fa": "طراحی API.",
                "section": self.section.pk,
                "status": "draft",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Service.objects.filter(slug="api-design").exists())

    def test_staff_can_update_service(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.patch(
            self.url(), {"title_en": "Web Development 2", "sort_order": 3}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.service.refresh_from_db()
        self.assertEqual(self.service.title_en, "Web Development 2")
        self.assertEqual(self.service.sort_order, 3)

    def test_publish_requires_persian_fields(self):
        Service.objects.filter(pk=self.service.pk).update(title_fa="", description_fa="")
        self.client.force_authenticate(user=self.staff)
        response = self.client.patch(self.url(), {"status": "published"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_anonymous_cannot_write(self):
        response = self.client.post(
            "/api/v1/services/", {"title_en": "x", "slug": "x"}, format="json"
        )
        self.assertIn(
            response.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)
        )

    def test_non_staff_cannot_write(self):
        self.client.force_authenticate(user=self.plain)
        response = self.client.patch(self.url(), {"title_en": "nope"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_public_list_hides_drafts(self):
        response = self.client.get("/api/v1/services/draft-web-development-x/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
