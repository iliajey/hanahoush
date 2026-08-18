"""API tests for the Article CRUD endpoints.

Verifies CRUD, pagination, filtering, searching, ordering, validation and
the standardized response envelope.
"""
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.articles.models import Article, Category, Tag


class ArticleAPITestCase(APITestCase):
    """Base test case with shared fixtures."""

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(username="editor", email="editor@hanahoush.local", password="pass12345")

        cls.category = Category.objects.create(
            title_fa="تکنولوژی",
            title_en="Technology",
            slug="technology",
        )
        cls.tag = Tag.objects.create(title_en="Django", slug="django")
        cls.tag2 = Tag.objects.create(title_en="API", slug="api")

        cls.article = Article.objects.create(
            title_fa="مقاله آزمایشی",
            title_en="Test Article",
            title_ar="",
            slug="test-article",
            short_description_fa="خلاصه",
            short_description_en="Summary",
            description_fa="متن کامل مقاله",
            description_en="Full body of the article",
            status="published",
            is_featured=True,
            is_public=True,
            author=cls.user,
            category=cls.category,
        )
        cls.article.tags.add(cls.tag)

    def url(self, pk=None):
        base = "/api/v1/articles/"
        return base if pk is None else f"{base}{pk}/"

    def valid_payload(self, **overrides):
        payload = {
            "title_fa": "مقاله جدید",
            "title_en": "New Article",
            "title_ar": "",
            "slug": "new-article",
            "short_description_fa": "خلاصه جدید",
            "short_description_en": "New summary",
            "short_description_ar": "",
            "description_fa": "متن کامل جدید",
            "description_en": "New full body",
            "description_ar": "",
            "status": "draft",
            "is_public": True,
            "is_featured": False,
        }
        payload.update(overrides)
        return payload


class ArticleReadTests(ArticleAPITestCase):
    """Read operations: list, retrieve, pagination, filter, search, order."""

    def test_list_returns_standard_envelope(self):
        response = self.client.get(self.url())
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.json()
        self.assertIn("success", body)
        self.assertIn("message", body)
        self.assertIn("data", body)
        self.assertIn("errors", body)
        self.assertTrue(body["success"])

    def test_list_contains_only_public_published_for_anonymous(self):
        Article.objects.create(
            title_fa="خصوصی",
            title_en="Private",
            slug="private-article",
            description_fa="متن",
            description_en="Body",
            status="draft",
            is_public=False,
        )
        response = self.client.get(self.url())
        titles = [item["slug"] for item in response.json()["data"]]
        self.assertIn("test-article", titles)
        self.assertNotIn("private-article", titles)

    def test_retrieve_detail(self):
        response = self.client.get(self.url(self.article.pk))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.json()["data"]
        self.assertEqual(body["slug"], "test-article")
        self.assertEqual(body["category"]["id"], self.category.pk)
        self.assertIn("description_en", body)

    def test_retrieve_not_found(self):
        response = self.client.get(self.url(99999))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertFalse(response.json()["success"])

    def test_pagination(self):
        for i in range(5):
            Article.objects.create(
                title_fa=f"مقاله {i}",
                title_en=f"Article {i}",
                slug=f"article-{i}",
                description_fa="متن",
                description_en="Body",
                status="published",
                is_public=True,
            )
        response = self.client.get(self.url() + "?page_size=2")
        body = response.json()
        self.assertEqual(body["pagination"]["count"], 6)  # 1 fixture + 5 new
        self.assertEqual(len(body["data"]), 2)
        self.assertEqual(body["pagination"]["current_page"], 1)

    def test_filter_by_status(self):
        response = self.client.get(self.url() + "?status=published")
        for item in response.json()["data"]:
            self.assertEqual(item["status"], "published")

    def test_filter_by_is_featured(self):
        response = self.client.get(self.url() + "?is_featured=true")
        for item in response.json()["data"]:
            self.assertTrue(item["is_featured"])

    def test_filter_by_category(self):
        response = self.client.get(self.url() + f"?category={self.category.pk}")
        for item in response.json()["data"]:
            self.assertEqual(item["category"]["id"], self.category.pk)

    def test_filter_by_tags(self):
        response = self.client.get(self.url() + f"?tags={self.tag.pk}")
        for item in response.json()["data"]:
            self.assertEqual(item["id"], self.article.pk)

    def test_search(self):
        response = self.client.get(self.url() + "?q=Test")
        slugs = [item["slug"] for item in response.json()["data"]]
        self.assertIn("test-article", slugs)

    def test_search_persian(self):
        response = self.client.get(self.url() + f"?q={self.article.title_fa}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_ordering(self):
        Article.objects.create(
            title_fa="الف",
            title_en="Alpha",
            slug="alpha",
            description_fa="متن",
            description_en="Body",
            status="published",
            is_public=True,
        )
        response = self.client.get(self.url() + "?ordering=title_en")
        titles = [item["title_en"] for item in response.json()["data"]]
        self.assertEqual(titles, sorted(titles))


class ArticleWriteTests(ArticleAPITestCase):
    """Write operations: create, update, partial update, delete, validation.

    Writes are staff-only (Phase 8H hardening) — every write test authenticates
    a staff user.
    """

    def setUp(self):
        self.staff = User.objects.create_user(
            username="staff-writer", email="staff-writer@hanahoush.local", password="pass12345", is_staff=True
        )
        self.client.force_authenticate(self.staff)

    def test_anonymous_cannot_create(self):
        self.client.force_authenticate(user=None)
        response = self.client.post(self.url(), self.valid_payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_article(self):
        response = self.client.post(self.url(), self.valid_payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        body = response.json()
        self.assertTrue(body["success"])
        self.assertEqual(body["data"]["slug"], "new-article")
        self.assertTrue(Article.objects.filter(slug="new-article").exists())

    def test_create_duplicate_slug_rejected(self):
        response = self.client.post(
            self.url(),
            self.valid_payload(slug="test-article"),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("slug", response.json()["errors"])

    def test_create_validation_requires_persian_title(self):
        response = self.client.post(self.url(), self.valid_payload(title_fa="", status="published"), format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("title_fa", response.json()["errors"])

    def test_create_validation_requires_persian_description(self):
        response = self.client.post(
            self.url(), self.valid_payload(description_fa="", status="published"), format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("description_fa", response.json()["errors"])

    def test_update_article(self):
        response = self.client.put(
            self.url(self.article.pk),
            self.valid_payload(title_en="Updated Article"),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.article.refresh_from_db()
        self.assertEqual(self.article.title_en, "Updated Article")

    def test_partial_update(self):
        response = self.client.patch(
            self.url(self.article.pk),
            {"title_en": "Partially Updated"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.article.refresh_from_db()
        self.assertEqual(self.article.title_en, "Partially Updated")

    def test_delete_article(self):
        response = self.client.delete(self.url(self.article.pk))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Article.objects.filter(pk=self.article.pk).exists())

    def test_soft_delete_restore(self):
        response = self.client.post(self.url(self.article.pk) + "soft-delete/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.article.refresh_from_db()
        self.assertTrue(self.article.is_deleted)

        response = self.client.post(self.url(self.article.pk) + "restore/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.article.refresh_from_db()
        self.assertFalse(self.article.is_deleted)
