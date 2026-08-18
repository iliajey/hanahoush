"""Tests for the sitemap.xml / robots.txt SEO endpoints (Phase 8H)."""
from django.test import TestCase
from django.test.utils import override_settings

from apps.articles.models import Article
from apps.page_builder.models import Page
from apps.projects.models import Project
from apps.services.models import Service


@override_settings(SITE_URL="http://testserver")
class SitemapTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.page = Page.objects.create(title_en="About", slug="about", status="published")
        cls.draft_page = Page.objects.create(title_en="Draft", slug="draft", status="draft")
        cls.article = Article.objects.create(
            title_en="Published Post",
            slug="published-post",
            description_en="Body",
            status="published",
            is_public=True,
        )
        cls.draft_article = Article.objects.create(
            title_en="Unpublished", slug="unpublished", description_en="x", status="draft", is_public=True
        )
        cls.project = Project.objects.create(
            title_en="Project X", slug="project-x", description_en="x", status="published", is_public=True
        )
        cls.service = Service.objects.create(
            title_en="Service Y", slug="service-y", description_en="x", status="published", is_public=True
        )

    def test_sitemap_is_xml(self):
        response = self.client.get("/sitemap.xml")
        self.assertEqual(response.status_code, 200)
        self.assertIn("application/xml", response["Content-Type"])

    def test_sitemap_includes_published_content(self):
        response = self.client.get("/sitemap.xml")
        body = response.content.decode()
        self.assertIn("/about", body)
        self.assertIn("/articles/published-post/", body)
        self.assertIn("/projects/project-x/", body)
        self.assertIn("/services/service-y/", body)

    def test_sitemap_excludes_drafts(self):
        response = self.client.get("/sitemap.xml")
        body = response.content.decode()
        self.assertNotIn("/draft", body)
        self.assertNotIn("/unpublished", body)

    def test_sitemap_home_uses_root(self):
        Page.objects.create(title_en="Home", slug="home", status="published")
        response = self.client.get("/sitemap.xml")
        self.assertIn("<loc>http://testserver/</loc>", response.content.decode())

    def test_sitemap_uses_site_url(self):
        response = self.client.get("/sitemap.xml")
        self.assertIn("http://testserver", response.content.decode())

    def test_sitemap_is_cached_and_invalidated(self):
        response = self.client.get("/sitemap.xml")
        self.assertIn("/articles/published-post/", response.content.decode())

        self.article.delete()
        response = self.client.get("/sitemap.xml")
        self.assertNotIn("/articles/published-post/", response.content.decode())

    def test_invalidates_on_publish(self):
        self.client.get("/sitemap.xml")
        Article.objects.create(
            title_en="Newly Published",
            slug="newly-published",
            description_en="Body",
            status="published",
            is_public=True,
        )
        response = self.client.get("/sitemap.xml")
        self.assertIn("/articles/newly-published/", response.content.decode())


class RobotsTests(TestCase):
    def test_robots_txt(self):
        response = self.client.get("/robots.txt")
        self.assertEqual(response.status_code, 200)
        self.assertIn("text/plain", response["Content-Type"])
        body = response.content.decode()
        self.assertIn("User-agent: *", body)
        self.assertIn("Disallow: /admin/", body)
        self.assertIn("Sitemap:", body)
