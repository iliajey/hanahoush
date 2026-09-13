"""Phase 14 regression: all serialized image URLs must be absolute.

Root cause fixed: the API returned relative ``/media/...`` paths while the
SPA runs on a different origin in development, so images resolved against
the frontend host and rendered broken. Serializers now join media paths
onto the request host via ``request.build_absolute_uri``.
"""
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.articles.models import Article
from apps.media_library.models import MediaFile
from apps.media_library.tests import PNG_1x1
from apps.projects.models import Project


class AbsoluteMediaUrlTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.admin = User.objects.create_superuser(
            username="imgadmin", email="img@h.local", password="pass12345"
        )

    def _upload(self, name="cover.png"):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            "/api/v1/media/",
            {"file": SimpleUploadedFile(name, PNG_1x1, "image/png")},
            format="multipart",
        )
        assert response.status_code == 201, response.content
        return response.json()["data"]

    def test_upload_returns_absolute_preview_url(self):
        data = self._upload()
        self.assertTrue(data["preview_url"].startswith("http"))
        self.assertIn("/media/", data["preview_url"])

    def test_article_cover_is_absolute(self):
        media = self._upload("article.png")
        article = Article.objects.create(
            title_en="Imaged",
            title_fa="تصویردار",
            slug="imaged-article",
            description_fa="متن",
            description_en="Body",
            status="published",
            is_public=True,
            cover_image_id=media["id"],
        )
        response = self.client.get(f"/api/v1/articles/{article.pk}/")
        cover = response.json()["data"]["cover_image"]
        self.assertTrue(cover["file"].startswith("http"))

    def test_project_cover_and_gallery_are_absolute(self):
        media = self._upload("project.png")
        project = Project.objects.create(
            title_en="Imaged project",
            title_fa="پروژه تصویردار",
            slug="imaged-project",
            description_fa="متن",
            description_en="Body",
            status="published",
            is_public=True,
            cover_image_id=media["id"],
        )
        gallery = MediaFile.objects.get(pk=media["id"])
        from apps.projects.models import ProjectImage

        ProjectImage.objects.create(project=project, image=gallery, sort_order=0)
        response = self.client.get(f"/api/v1/projects/{project.pk}/")
        body = response.json()["data"]
        self.assertTrue(body["cover_image"]["file"].startswith("http"))
        self.assertTrue(body["images"][0]["image_url"].startswith("http"))

    def test_search_images_are_absolute(self):
        media = self._upload("search.png")
        Article.objects.create(
            title_en="Searchable imaged piece",
            title_fa="قابل جستجو",
            slug="searchable-imaged",
            description_fa="متن",
            description_en="Body",
            status="published",
            is_public=True,
            cover_image_id=media["id"],
        )
        response = self.client.get("/api/v1/search/?q=Searchable")
        hits = response.json()["data"]
        self.assertTrue(hits)
        self.assertTrue(hits[0]["image"].startswith("http"))
