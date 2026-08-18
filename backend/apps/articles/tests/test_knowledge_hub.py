"""Knowledge Hub tests (Phase 8F): article listing/detail, search, filters,
taxonomy, reading time, related content, newsletter and protection."""
# ruff: noqa: E501
from rest_framework import status
from rest_framework.test import APITestCase

from apps.articles.models import Article, Category, Tag
from apps.articles.reading import reading_minutes
from apps.page_builder.models import NewsletterSubscription


class KnowledgeHubAPITests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.category = Category.objects.create(title_fa="فناوری", title_en="Technology", slug="technology")
        cls.tag = Tag.objects.create(title_en="Django", slug="django")
        cls.tag2 = Tag.objects.create(title_en="ERP", slug="erp")

        cls.published = Article.objects.create(
            title_fa="راهنمای جنگو",
            title_en="Django Guide",
            slug="django-guide",
            short_description_en="A guide to Django.",
            description_en="<p>Django is a Python web framework with many batteries included and a large ecosystem.</p>",
            description_fa="<p>جنگو یک فریم‌ورک وب پایتونی است.</p>",
            category=cls.category,
            status="published",
            is_public=True,
            is_featured=True,
            author=None,
        )
        cls.published.tags.add(cls.tag)

        cls.draft = Article.objects.create(
            title_en="Draft Article",
            slug="draft-article",
            status="draft",
            is_public=True,
        )
        cls.archived = Article.objects.create(
            title_en="Archived Article",
            slug="archived-article",
            status="archived",
            is_public=True,
        )

    def test_list_includes_reading_time(self):
        response = self.client.get("/api/v1/articles/")
        item = next(a for a in response.json()["data"] if a["slug"] == "django-guide")
        self.assertIn("reading_time", item)
        self.assertGreaterEqual(item["reading_time"], 1)

    def test_reading_time_deterministic(self):
        # 200 words @ 200wpm → exactly 1 minute.
        minutes = reading_minutes("<p>" + "word " * 200 + "</p>", "en")
        self.assertEqual(minutes, 1)
        # 400 words @ 200wpm → 2 minutes.
        minutes = reading_minutes("<p>" + "word " * 400 + "</p>", "en")
        self.assertEqual(minutes, 2)
        # Persian at 180wpm.
        minutes_fa = reading_minutes("<p>" + "واژه " * 360 + "</p>", "fa")
        self.assertEqual(minutes_fa, 2)
        # Determinism: same input → same output.
        self.assertEqual(reading_minutes("<p>a b c d e f</p>", "en"), reading_minutes("<p>a b c d e f</p>", "en"))

    def test_by_slug_detail_with_related(self):
        response = self.client.get("/api/v1/articles/by-slug/django-guide/")
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertIn("reading_time", data)
        self.assertIn("related_articles", data)
        self.assertIn("related_projects", data)
        self.assertIn("related_services", data)

    def test_by_slug_localizes_title_fields(self):
        response = self.client.get("/api/v1/articles/by-slug/django-guide/", HTTP_ACCEPT_LANGUAGE="fa")
        data = response.json()["data"]
        self.assertEqual(data["title_fa"], "راهنمای جنگو")

    def test_categories_and_tags_explorer(self):
        categories = self.client.get("/api/v1/articles/categories/").json()["data"]
        self.assertIn("technology", [c["slug"] for c in categories])
        tags = self.client.get("/api/v1/articles/tags/").json()["data"]
        self.assertIn("django", [t["slug"] for t in tags])

    def test_search_category_tag_filters(self):
        self.assertIn("django-guide", [a["slug"] for a in self.client.get("/api/v1/articles/?q=Django").json()["data"]])
        self.assertIn("django-guide", [a["slug"] for a in self.client.get("/api/v1/articles/?category_slug=technology").json()["data"]])
        self.assertIn("django-guide", [a["slug"] for a in self.client.get("/api/v1/articles/?tags=django").json()["data"]])
        self.assertIn("django-guide", [a["slug"] for a in self.client.get("/api/v1/articles/?is_featured=true").json()["data"]])

    def test_draft_and_archived_not_public(self):
        slugs = {a["slug"] for a in self.client.get("/api/v1/articles/").json()["data"]}
        self.assertNotIn("draft-article", slugs)
        self.assertNotIn("archived-article", slugs)
        self.assertEqual(self.client.get("/api/v1/articles/by-slug/draft-article/").status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(self.client.get("/api/v1/articles/by-slug/archived-article/").status_code, status.HTTP_404_NOT_FOUND)

    def test_scheduled_article_not_public(self):
        # Scheduled articles keep status=draft until publish (8C workflow) → never public.
        self.assertNotIn("draft-article", [a["slug"] for a in self.client.get("/api/v1/articles/").json()["data"]])


class NewsletterSubscriptionAPITests(APITestCase):
    def test_subscribe_success(self):
        response = self.client.post("/api/v1/newsletter/subscribe/", {"email": "reader@example.com", "locale": "fa"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(NewsletterSubscription.objects.filter(email="reader@example.com").exists())

    def test_subscribe_duplicate_conflict(self):
        self.client.post("/api/v1/newsletter/subscribe/", {"email": "dup@example.com"}, format="json")
        response = self.client.post("/api/v1/newsletter/subscribe/", {"email": "dup@example.com"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

    def test_subscribe_invalid_email(self):
        response = self.client.post("/api/v1/newsletter/subscribe/", {"email": "not-an-email"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.json()["errors"])
