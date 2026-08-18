"""Media library API tests (Phase 8G): upload validation + permissions."""
import struct
import zlib

from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.media_library.models import MediaFile


def make_png() -> bytes:
    def chunk(typ: bytes, data: bytes) -> bytes:
        body = struct.pack(">I", len(data)) + typ + data
        return body + struct.pack(">I", zlib.crc32(typ + data) & 0xFFFFFFFF)

    ihdr = struct.pack(">IIBBBBB", 1, 1, 8, 2, 0, 0, 0)
    idat = zlib.compress(b"\x00\xff\x00\x00")
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b"")


PNG_1x1 = make_png()


class MediaAPITests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(username="madmin", email="mad@h.local", password="pass12345")

    def test_upload_requires_auth(self):
        response = self.client.post("/api/v1/media/", {}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_upload_valid_png(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post("/api/v1/media/", {"file": SimpleUploadedFile("pixel.png", PNG_1x1, "image/png")}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()["data"]
        self.assertEqual(data["width"], 1)
        self.assertEqual(data["height"], 1)
        self.assertEqual(data["mime_type"], "image/png")

    def test_upload_rejects_dangerous_type(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post("/api/v1/media/", {"file": SimpleUploadedFile("evil.exe", b"MZ...", "application/octet-stream")}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("file", response.json()["errors"])

    def test_upload_rejects_unsupported_extension(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post("/api/v1/media/", {"file": SimpleUploadedFile("doc.php", b"<?php", "text/html")}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_requires_auth(self):
        response = self.client.get("/api/v1/media/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_and_search(self):
        self.client.force_authenticate(user=self.admin)
        MediaFile.objects.create(file="media/a.png", original_name="hero.png", mime_type="image/png", size=10, created_by=self.admin)
        response = self.client.get("/api/v1/media/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("hero.png", [m["original_name"] for m in response.json()["data"]])
        filtered = self.client.get("/api/v1/media/?q=hero")
        self.assertEqual(len(filtered.json()["data"]), 1)

    def test_metadata_edit_is_staff_only(self):
        media = MediaFile.objects.create(file="media/a.png", original_name="hero.png", mime_type="image/png", size=10)
        response = self.client.patch(f"/api/v1/media/{media.pk}/", {"title_en": "Changed"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_metadata_edit_updates_localized_fields(self):
        self.client.force_authenticate(user=self.admin)
        media = MediaFile.objects.create(file="media/a.png", original_name="hero.png", mime_type="image/png", size=10, created_by=self.admin)
        response = self.client.patch(
            f"/api/v1/media/{media.pk}/",
            {"title_en": "Hero title", "alt_text_fa": "متن جایگزین", "caption_ar": "شرح", "is_public": False},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        media.refresh_from_db()
        self.assertEqual(media.title_en, "Hero title")
        self.assertEqual(media.alt_text_fa, "متن جایگزین")
        self.assertEqual(media.caption_ar, "شرح")
        self.assertFalse(media.is_public)

    def _create_media(self, name="hero.png"):
        return MediaFile.objects.create(
            file="media/a.png",
            original_name=name,
            mime_type="image/png",
            size=10,
            created_by=self.admin,
        )

    def test_destroy_is_soft_delete_and_restorable(self):
        self.client.force_authenticate(user=self.admin)
        media = self._create_media()
        response = self.client.delete(f"/api/v1/media/{media.pk}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        media.refresh_from_db()
        self.assertTrue(media.is_deleted)
        # Soft-deleted rows disappear from the list and can be restored.
        response = self.client.get("/api/v1/media/")
        self.assertEqual(len(response.json()["data"]), 0)
        restored = self.client.post(f"/api/v1/media/{media.pk}/restore/")
        self.assertEqual(restored.status_code, status.HTTP_200_OK)
        media.refresh_from_db()
        self.assertFalse(media.is_deleted)

    def test_list_reports_reference_count(self):
        from apps.articles.models import Article

        self.client.force_authenticate(user=self.admin)
        media = self._create_media()
        Article.objects.create(
            title_en="Covered article",
            slug="covered-article",
            status="published",
            cover_image=media,
            created_by=self.admin,
        )
        response = self.client.get(f"/api/v1/media/{media.pk}/")
        self.assertEqual(response.json()["data"]["reference_count"], 1)

    def test_reference_count_zero_when_unused(self):
        self.client.force_authenticate(user=self.admin)
        media = self._create_media()
        response = self.client.get(f"/api/v1/media/{media.pk}/")
        self.assertEqual(response.json()["data"]["reference_count"], 0)


class AboutPageDataTests(APITestCase):
    def test_about_page_composition_published_only(self):
        from apps.core.models import Status
        from apps.page_builder.models import Page, PageSection

        page = Page.objects.create(title_en="About", slug="about", status=Status.PUBLISHED, version=1)
        for order, section_type in enumerate(["company_story", "about", "team", "offices", "social_links", "cta"], start=1):
            PageSection.objects.create(page=page, section_type=section_type, sort_order=order, config={})

        response = self.client.get("/api/v1/pages/about/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        types = {s["type"] for s in response.json()["data"]["sections"]}
        self.assertIn("company_story", types)
        self.assertIn("team", types)
        self.assertIn("offices", types)

    def test_draft_page_not_public(self):
        from apps.core.models import Status
        from apps.page_builder.models import Page

        Page.objects.create(title_en="Contact Draft", slug="contact", status=Status.DRAFT, version=1)
        response = self.client.get("/api/v1/pages/contact/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
