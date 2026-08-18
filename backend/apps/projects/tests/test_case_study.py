"""Tests for the Projects case-study experience (Phase 8E)."""
from rest_framework import status
from rest_framework.test import APITestCase

from apps.articles.models import Article, Tag
from apps.projects.models import Project, ProjectCategory, Technology


class CaseStudyAPITests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.category = ProjectCategory.objects.create(title_fa="وب", title_en="Web", slug="web")
        cls.tech = Technology.objects.create(title_en="Django", slug="django")
        cls.tech2 = Technology.objects.create(title_en="React", slug="react")

        cls.project = Project.objects.create(
            title_fa="سیستم سازمانی",
            title_en="Enterprise System",
            slug="enterprise-system",
            description_en="A large enterprise build.",
            category=cls.category,
            status="published",
            is_public=True,
            is_featured=True,
            start_date="2024-01-01",
            end_date="2025-06-01",
            case_study={
                "challenge": {
                    "en": "Legacy systems slowed change.",
                    "fa": "سیستم‌های قدیمی تغییر را کند می‌کردند.",
                },
                "objectives": {"en": "Ship a scalable solution."},
                "architecture": {
                    "description": {"en": "Layered architecture."},
                    "nodes": [{"layer": "Backend", "labels": {"en": ["Django"]}}],
                },
            },
        )
        cls.project.technologies.set([cls.tech, cls.tech2])

        cls.draft = Project.objects.create(
            title_en="Draft Project",
            slug="draft-project",
            status="draft",
            is_public=True,
        )

        tag = Tag.objects.create(title_en="Django", slug="django-tag")
        cls.article = Article.objects.create(
            title_fa="مقاله",
            title_en="Django in Production",
            slug="django-production",
            description_en="Body",
            status="published",
            is_public=True,
        )
        cls.article.tags.add(tag)

    def test_list_includes_year_and_technologies(self):
        response = self.client.get("/api/v1/projects/")
        self.assertEqual(response.status_code, 200)
        item = next(p for p in response.json()["data"] if p["slug"] == "enterprise-system")
        self.assertEqual(item["year"], 2025)
        self.assertIn("django", [t["slug"] for t in item["technologies"]])

    def test_by_slug_returns_case_study_and_related(self):
        response = self.client.get("/api/v1/projects/by-slug/enterprise-system/")
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertIn("challenge", data["case_study"])
        self.assertIn("related_projects", data)
        self.assertIn("related_articles", data)

    def test_by_slug_localizes_case_study(self):
        response = self.client.get(
            "/api/v1/projects/by-slug/enterprise-system/",
            HTTP_ACCEPT_LANGUAGE="fa",
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("سیستم", response.json()["data"]["case_study"]["challenge"])

    def test_draft_project_not_publicly_visible(self):
        slugs = {p["slug"] for p in self.client.get("/api/v1/projects/").json()["data"]}
        self.assertNotIn("draft-project", slugs)
        response = self.client.get("/api/v1/projects/by-slug/draft-project/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_year_and_technology_filters(self):
        response = self.client.get("/api/v1/projects/?year=2025")
        self.assertIn("enterprise-system", [p["slug"] for p in response.json()["data"]])
        response = self.client.get("/api/v1/projects/?technologies=django")
        self.assertIn("enterprise-system", [p["slug"] for p in response.json()["data"]])
        response = self.client.get("/api/v1/projects/?category_slug=web")
        self.assertIn("enterprise-system", [p["slug"] for p in response.json()["data"]])

    def test_technologies_explorer_endpoint(self):
        response = self.client.get("/api/v1/projects/technologies/")
        self.assertEqual(response.status_code, 200)
        techs = {t["slug"]: t for t in response.json()["data"]}
        self.assertIn("django", techs)
        self.assertEqual(techs["django"]["projects_count"], 1)

    def test_related_articles_match_technologies(self):
        response = self.client.get("/api/v1/projects/by-slug/enterprise-system/")
        articles = response.json()["data"]["related_articles"]
        self.assertEqual(len(articles), 1)
        self.assertEqual(articles[0]["slug"], "django-production")
