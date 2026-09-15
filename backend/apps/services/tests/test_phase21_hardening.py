"""Phase 21: PublicationSchedule dead `publishing` value removed; Service exposes og_image."""
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.editorial.models import PublicationSchedule
from apps.services.models import Service


class Phase21HardeningTests(APITestCase):
    def setUp(self):
        self.staff = User.objects.create_user(
            username="p21-staff", email="p21@h.local", password="pass12345", is_staff=True
        )

    def test_schedule_status_choices_have_no_publishing(self):
        choices = dict(PublicationSchedule.STATUS_CHOICES)
        self.assertNotIn("publishing", choices)
        self.assertEqual(set(choices), {"scheduled", "published", "cancelled"})

    def test_service_detail_exposes_og_image_and_icon(self):
        self.client.force_authenticate(user=self.staff)
        service = Service.objects.create(
            title_en="OG test",
            title_fa="تست",
            slug="og-test",
            description_en="body",
            description_fa="متن",
            icon="code",
            status="draft",
        )
        response = self.client.get(f"/api/v1/services/{service.pk}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()["data"]
        self.assertIn("og_image", data)
        self.assertEqual(data["icon"], "code")

    def test_service_write_accepts_og_image_and_icon(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.post(
            "/api/v1/services/",
            {
                "title_en": "Write OG",
                "title_fa": "نوشتن",
                "slug": "write-og",
                "description_en": "body",
                "description_fa": "متن",
                "icon": "cloud",
                "status": "draft",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        service = Service.objects.get(slug="write-og")
        self.assertEqual(service.icon, "cloud")
