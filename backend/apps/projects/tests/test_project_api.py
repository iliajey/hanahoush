"""API tests for the Project CRUD endpoints.

Verifies CRUD, pagination, filtering, searching, ordering, validation and
the standardized response envelope.
"""
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.projects.models import Project, ProjectCategory, Technology


class ProjectAPITestCase(APITestCase):
    """Base test case with shared fixtures."""

    @classmethod
    def setUpTestData(cls):
        cls.category = ProjectCategory.objects.create(
            title_fa="وب",
            title_en="Web",
            slug="web",
        )
        cls.tech = Technology.objects.create(title_en="Django", slug="django")
        cls.tech2 = Technology.objects.create(title_en="React", slug="react")

        cls.project = Project.objects.create(
            title_fa="پروژه فروشگاه",
            title_en="E-commerce Project",
            title_ar="",
            slug="ecommerce-project",
            short_description_fa="خلاصه",
            short_description_en="Summary",
            description_fa="متن کامل پروژه",
            description_en="Full project description",
            status="published",
            is_featured=True,
            is_public=True,
            client="Acme Corp",
            location="Tehran",
            category=cls.category,
        )
        cls.project.technologies.add(cls.tech)

    def url(self, pk=None):
        base = "/api/v1/projects/"
        return base if pk is None else f"{base}{pk}/"

    def valid_payload(self, **overrides):
        payload = {
            "title_fa": "پروژه جدید",
            "title_en": "New Project",
            "title_ar": "",
            "slug": "new-project",
            "short_description_fa": "خلاصه جدید",
            "short_description_en": "New summary",
            "short_description_ar": "",
            "description_fa": "متن کامل جدید",
            "description_en": "New full description",
            "description_ar": "",
            "status": "draft",
            "is_public": True,
            "is_featured": False,
            "client": "Test Client",
            "location": "Tehran",
        }
        payload.update(overrides)
        return payload


class ProjectReadTests(ProjectAPITestCase):
    """Read operations: list, retrieve, pagination, filter, search, order."""

    def test_list_returns_standard_envelope(self):
        response = self.client.get(self.url())
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.json()
        self.assertTrue(body["success"])
        self.assertIn("data", body)
        self.assertIn("pagination", body)

    def test_retrieve_detail_includes_gallery(self):
        response = self.client.get(self.url(self.project.pk))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.json()["data"]
        self.assertEqual(body["slug"], "ecommerce-project")
        self.assertIn("technologies", body)
        self.assertEqual(body["client"], "Acme Corp")

    def test_retrieve_not_found(self):
        response = self.client.get(self.url(99999))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_pagination(self):
        for i in range(3):
            Project.objects.create(
                title_fa=f"پروژه {i}",
                title_en=f"Project {i}",
                slug=f"project-{i}",
                description_fa="متن",
                description_en="Body",
                status="published",
                is_public=True,
            )
        response = self.client.get(self.url() + "?page_size=2")
        body = response.json()
        self.assertEqual(body["pagination"]["count"], 4)
        self.assertEqual(len(body["data"]), 2)

    def test_filter_by_category(self):
        response = self.client.get(self.url() + f"?category={self.category.pk}")
        for item in response.json()["data"]:
            self.assertEqual(item["category"]["id"], self.category.pk)

    def test_filter_by_technology(self):
        response = self.client.get(self.url() + f"?technologies={self.tech.pk}")
        for item in response.json()["data"]:
            self.assertEqual(item["id"], self.project.pk)

    def test_filter_by_status(self):
        response = self.client.get(self.url() + "?status=published")
        for item in response.json()["data"]:
            self.assertEqual(item["status"], "published")

    def test_search(self):
        response = self.client.get(self.url() + "?q=E-commerce")
        slugs = [item["slug"] for item in response.json()["data"]]
        self.assertIn("ecommerce-project", slugs)

    def test_search_by_client(self):
        response = self.client.get(self.url() + "?q=Acme")
        slugs = [item["slug"] for item in response.json()["data"]]
        self.assertIn("ecommerce-project", slugs)

    def test_ordering(self):
        response = self.client.get(self.url() + "?ordering=-title_en")
        titles = [item["title_en"] for item in response.json()["data"]]
        self.assertEqual(titles, sorted(titles, reverse=True))


class ProjectWriteTests(ProjectAPITestCase):
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

    def test_create_project(self):
        response = self.client.post(self.url(), self.valid_payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        body = response.json()
        self.assertTrue(body["success"])
        self.assertTrue(Project.objects.filter(slug="new-project").exists())

    def test_create_duplicate_slug_rejected(self):
        response = self.client.post(
            self.url(),
            self.valid_payload(slug="ecommerce-project"),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("slug", response.json()["errors"])

    def test_create_validation_requires_persian_fields_for_publish(self):
        response = self.client.post(
            self.url(),
            self.valid_payload(title_fa="", description_fa="", status="published"),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        errors = response.json()["errors"]
        self.assertIn("title_fa", errors)
        self.assertIn("description_fa", errors)

    def test_update_project(self):
        response = self.client.put(
            self.url(self.project.pk),
            self.valid_payload(title_en="Updated Project"),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.project.refresh_from_db()
        self.assertEqual(self.project.title_en, "Updated Project")

    def test_partial_update(self):
        response = self.client.patch(
            self.url(self.project.pk),
            {"client": "New Client"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.project.refresh_from_db()
        self.assertEqual(self.project.client, "New Client")

    def test_delete_project(self):
        response = self.client.delete(self.url(self.project.pk))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Project.objects.filter(pk=self.project.pk).exists())

    def test_soft_delete_restore(self):
        response = self.client.post(self.url(self.project.pk) + "soft-delete/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.project.refresh_from_db()
        self.assertTrue(self.project.is_deleted)

        response = self.client.post(self.url(self.project.pk) + "restore/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.project.refresh_from_db()
        self.assertFalse(self.project.is_deleted)
