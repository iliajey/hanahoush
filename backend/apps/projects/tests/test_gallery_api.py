"""Phase 14 regression: project gallery staff API (cover + ordering).

Uses the existing normalized ``ProjectImage`` model — this only covers the
new ``/projects/{id}/gallery/`` actions (add / update / reorder / remove).
"""
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.media_library.models import MediaFile
from apps.media_library.tests import PNG_1x1
from apps.projects.models import Project
from django.core.files.uploadedfile import SimpleUploadedFile


class ProjectGalleryAPITests(APITestCase):
    def setUp(self):
        self.staff = User.objects.create_user(
            username="gallery-staff", email="gallery@h.local", password="pass12345", is_staff=True
        )
        self.project = Project.objects.create(
            title_en="Gallery project",
            title_fa="پروژه گالری",
            slug="gallery-project",
            description_fa="متن",
            description_en="Body",
            status="draft",
        )
        self.client.force_authenticate(user=self.staff)

    def _media(self, name="g.png"):
        return MediaFile.objects.create(
            file=SimpleUploadedFile(name, PNG_1x1, "image/png"),
            original_name=name,
            mime_type="image/png",
            size=len(PNG_1x1),
            width=1,
            height=1,
            created_by=self.staff,
        )

    def test_add_list_reorder_remove_gallery(self):
        first = self._media("g1.png")
        second = self._media("g2.png")

        base = f"/api/v1/projects/{self.project.pk}/gallery/"
        r1 = self.client.post(base, {"image": first.pk, "alt_text_en": "First"}, format="json")
        self.assertEqual(r1.status_code, status.HTTP_201_CREATED)
        r2 = self.client.post(base, {"image": second.pk, "alt_text_en": "Second"}, format="json")
        self.assertEqual(r2.status_code, status.HTTP_201_CREATED)

        listed = self.client.get(base)
        self.assertEqual(len(listed.json()["data"]), 2)
        self.assertTrue(listed.json()["data"][0]["image_url"].startswith("http"))

        row_ids = [row["id"] for row in listed.json()["data"]]
        reorder = self.client.post(
            f"/api/v1/projects/{self.project.pk}/gallery/reorder/",
            {"order": list(reversed(row_ids))},
            format="json",
        )
        self.assertEqual(reorder.status_code, status.HTTP_200_OK)
        self.assertEqual([r["id"] for r in reorder.json()["data"]], list(reversed(row_ids)))

        patch = self.client.patch(
            f"/api/v1/projects/{self.project.pk}/gallery/{row_ids[0]}/",
            {"alt_text_en": "Updated", "is_cover": True},
            format="json",
        )
        self.assertEqual(patch.status_code, status.HTTP_200_OK)

        delete = self.client.delete(f"/api/v1/projects/{self.project.pk}/gallery/{row_ids[1]}/")
        self.assertEqual(delete.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(len(self.client.get(base).json()["data"]), 1)

    def test_anonymous_cannot_write_gallery(self):
        self.client.force_authenticate(user=None)
        media = self._media("anon.png")
        response = self.client.post(
            f"/api/v1/projects/{self.project.pk}/gallery/", {"image": media.pk}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
