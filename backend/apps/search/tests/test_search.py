"""Tests for the unified global search API (Phase 8H)."""
from datetime import timedelta

from django.db import connection
from django.test.utils import CaptureQueriesContext
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.articles.models import Article, Category
from apps.page_builder.models import Page
from apps.projects.models import Project, ProjectCategory
from apps.services.models import Service, ServiceSection


class SearchAPITestCase(APITestCase):
    """Shared fixtures: one published item per type + drafts/archived."""

    @classmethod
    def setUpTestData(cls):
        cls.now = timezone.now()
        cls.article_category = Category.objects.create(title_fa="تکنولوژی", title_en="Technology", slug="technology")
        cls.article = Article.objects.create(
            title_fa="مقاله ارگونومیک",
            title_en="Ergonomic Workplace Guide",
            slug="ergonomic-workplace",
            short_description_fa="خلاصه",
            short_description_en="A guide to healthy workspaces.",
            description_fa="متن کامل",
            description_en="Full body about ergonomics at work.",
            status="published",
            is_public=True,
            published_at=cls.now - timedelta(days=10),
            category=cls.article_category,
        )
        cls.draft_article = Article.objects.create(
            title_en="Secret Draft",
            slug="secret-draft",
            description_en="Unpublished body.",
            status="draft",
            is_public=True,
        )
        cls.archived_article = Article.objects.create(
            title_en="Old News",
            slug="old-news",
            description_en="Archived body.",
            status="archived",
            is_public=True,
        )

        cls.project_category = ProjectCategory.objects.create(title_fa="ساختمانی", title_en="Construction", slug="construction")
        cls.project = Project.objects.create(
            title_fa="پروژه برج",
            title_en="Tower Construction",
            slug="tower-construction",
            short_description_en="A landmark tower build.",
            description_en="Detailed project description.",
            status="published",
            is_public=True,
            published_at=cls.now - timedelta(days=5),
            category=cls.project_category,
        )

        cls.section = ServiceSection.objects.create(title_en="Consulting", slug="consulting")
        cls.service = Service.objects.create(
            title_fa="خدمت مشاوره",
            title_en="Consulting Service",
            slug="consulting-service",
            short_description_en="Expert consulting.",
            description_en="Full consulting description.",
            status="published",
            is_public=True,
            published_at=cls.now - timedelta(days=2),
            section=cls.section,
        )

        cls.page = Page.objects.create(
            title_fa="صفحه آزمایشی",
            title_en="Research Page",
            slug="research",
            status="published",
        )
        cls.draft_page = Page.objects.create(title_en="Draft Page", slug="draft-page", status="draft")

    def search(self, query=""):
        return self.client.get("/api/v1/search/", {"q": query})

    def slugs(self, response):
        return [(item["type"], item["slug"]) for item in response.json()["data"]]


class SearchQueryTests(SearchAPITestCase):
    def test_requires_minimum_query_length(self):
        response = self.client.get("/api/v1/search/", {"q": "a"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        body = response.json()
        self.assertFalse(body["success"])
        self.assertIn("errors", body)

    def test_missing_query_rejected(self):
        response = self.client.get("/api/v1/search/")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_empty_results_when_no_match(self):
        response = self.search("zzzz-no-such-term")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.json()
        self.assertTrue(body["success"])
        self.assertEqual(body["data"], [])
        self.assertEqual(body["pagination"]["count"], 0)


class SearchContentTests(SearchAPITestCase):
    def test_finds_all_types(self):
        response = self.search("guide construction consulting research")
        types = {t for t, _ in self.slugs(response)}
        self.assertIn("article", types)
        self.assertIn("project", types)
        self.assertIn("service", types)
        self.assertIn("page", types)

    def test_published_only_no_drafts_or_archived(self):
        response = self.search("draft old secret unpublished")
        slugs = [s for _, s in self.slugs(response)]
        self.assertNotIn("secret-draft", slugs)
        self.assertNotIn("old-news", slugs)
        self.assertNotIn("draft-page", slugs)

    def test_type_filter(self):
        response = self.client.get("/api/v1/search/", {"q": "guide", "type": "article"})
        for item_type, _ in self.slugs(response):
            self.assertEqual(item_type, "article")

    def test_category_filter(self):
        response = self.client.get("/api/v1/search/", {"q": "tower", "type": "project", "category": "construction"})
        for _, slug in self.slugs(response):
            self.assertEqual(slug, "tower-construction")

    def test_category_filter_excludes_other(self):
        response = self.client.get("/api/v1/search/", {"q": "guide", "type": "article", "category": "construction"})
        self.assertEqual(response.json()["data"], [])

    def test_localized_title_via_locale_param(self):
        response = self.client.get("/api/v1/search/", {"q": "برج", "locale": "fa", "type": "project"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for item in response.json()["data"]:
            self.assertEqual(item["type"], "project")

    def test_result_contains_unified_shape(self):
        response = self.search("guide")
        item = next(i for i in response.json()["data"] if i["type"] == "article")
        for key in ("type", "title", "slug", "excerpt", "url", "relevance", "published_at"):
            self.assertIn(key, item)
        self.assertTrue(item["url"].startswith("/articles/"))
        self.assertGreaterEqual(item["relevance"], 0)

    def test_relevance_prefers_exact_title(self):
        exact = Article.objects.create(
            title_en="Consulting Service",
            slug="consulting-service-exact",
            description_en="Body",
            status="published",
            is_public=True,
        )
        response = self.client.get("/api/v1/search/", {"q": "consulting service", "type": "article"})
        items = response.json()["data"]
        self.assertTrue(items)
        slugs = [i["slug"] for i in items]
        self.assertEqual(slugs[0], "consulting-service-exact")
        self.assertIn(exact.pk, [i["id"] for i in items])


class SearchPaginationTests(SearchAPITestCase):
    def test_pagination_envelope(self):
        response = self.search("construction")
        body = response.json()
        self.assertIn("pagination", body)
        self.assertGreaterEqual(body["pagination"]["count"], 1)
        self.assertEqual(body["pagination"]["current_page"], 1)

    def test_page_size_applied(self):
        response = self.client.get("/api/v1/search/", {"q": "guide construction consulting research", "page_size": 1})
        body = response.json()
        self.assertEqual(len(body["data"]), 1)
        self.assertEqual(body["pagination"]["page_size"], 1)
        self.assertGreater(body["pagination"]["num_pages"], 1)

    def test_ordering_by_published_at(self):
        response = self.client.get("/api/v1/search/", {"q": "guide construction consulting research", "ordering": "-published_at"})
        items = response.json()["data"]
        dates = [i["published_at"] for i in items if i["published_at"]]
        self.assertEqual(dates, sorted(dates, reverse=True))


class SearchPerformanceTests(SearchAPITestCase):
    def test_search_uses_bounded_queries(self):
        with CaptureQueriesContext(connection) as ctx:
            response = self.client.get("/api/v1/search/", {"q": "guide construction consulting research"})
            self.assertEqual(response.status_code, 200)
        # 4 content types + pagination overhead; must stay a small constant.
        self.assertLessEqual(len(ctx.captured_queries), 10)
