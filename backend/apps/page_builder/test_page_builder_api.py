"""API tests for the Page Builder endpoints."""
from rest_framework import status
from rest_framework.test import APITestCase

from apps.core.models import Status

from .models import (
    AnnouncementBar,
    FooterConfiguration,
    HeroConfiguration,
    NavigationItem,
    NavigationMenu,
    Page,
    PageSection,
    SectionConfiguration,
    SEOConfiguration,
)


def make_page(slug="home", **overrides):
    defaults = {
        "title_fa": "خانه",
        "title_en": "Home",
        "slug": slug,
        "status": Status.PUBLISHED,
        "is_home": slug == "home",
        "version": 1,
    }
    defaults.update(overrides)
    return Page.objects.create(**defaults)


class PageBuilderAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.page = make_page()
        PageSection.objects.create(
            page=cls.page,
            section_type="hero",
            sort_order=1,
            config={"headline": {"fa": "تیتر", "en": "Headline", "ar": "عنوان"}},
        )
        PageSection.objects.create(page=cls.page, section_type="services", sort_order=2, config={})
        PageSection.objects.create(
            page=cls.page,
            section_type="faq",
            sort_order=3,
            is_enabled=False,
            config={},
        )

        cls.menu = NavigationMenu.objects.create(name="Main", code="main", is_default=True)
        NavigationItem.objects.create(
            menu=cls.menu,
            label_fa="خدمات",
            label_en="Services",
            url="/services",
            sort_order=1,
            is_highlight=False,
        )
        NavigationItem.objects.create(
            menu=cls.menu,
            label_fa="تماس",
            label_en="Contact",
            url="/contact",
            sort_order=2,
            is_highlight=True,
        )

        FooterConfiguration.objects.create(pk=1, show_socials=True)
        AnnouncementBar.objects.create(
            pk=1,
            text_fa="اعلان",
            text_en="Announcement",
            is_enabled=False,
        )
        HeroConfiguration.objects.create(
            pk=1,
            headline_fa="تیتر قهرمان",
            headline_en="Hero headline",
        )
        SectionConfiguration.objects.create(
            section_type="hero",
            name="Hero",
            available_locales=["fa", "en", "ar"],
        )
        SEOConfiguration.objects.create(
            page=None,
            meta_title_en="Default SEO",
            robots="index,follow",
        )

    def test_list_pages_returns_envelope(self):
        response = self.client.get("/api/v1/pages/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.json()
        self.assertTrue(body["success"])
        self.assertEqual(len(body["data"]), 1)
        self.assertIn("pagination", body)

    def test_retrieve_page_by_slug(self):
        response = self.client.get("/api/v1/pages/home/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.json()
        self.assertEqual(body["data"]["slug"], "home")
        self.assertEqual(body["data"]["version"], 1)
        self.assertIn("seo", body["data"])

    def test_sections_ordered_and_enabled_only(self):
        response = self.client.get("/api/v1/pages/home/")
        sections = response.json()["data"]["sections"]
        types = [s["type"] for s in sections]
        self.assertEqual(types, ["hero", "services"])  # faq disabled → excluded
        self.assertEqual(sections[0]["order"], 1)

    def test_localized_config_and_title(self):
        response = self.client.get("/api/v1/pages/home/", HTTP_ACCEPT_LANGUAGE="fa")
        body = response.json()["data"]
        self.assertEqual(body["title"], "خانه")
        self.assertEqual(body["sections"][0]["config"]["headline"], "تیتر")

    def test_draft_page_not_publicly_visible(self):
        draft = make_page(slug="draft-page", status=Status.DRAFT)
        listed = [p["slug"] for p in self.client.get("/api/v1/pages/").json()["data"]]
        self.assertNotIn("draft-page", listed)
        response = self.client.get("/api/v1/pages/draft-page/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        draft.delete()

    def test_page_builder_registry(self):
        response = self.client.get("/api/v1/page-builder/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()["data"]
        self.assertIn("section_types", data)
        self.assertIn("pages", data)
        types = {t["section_type"] for t in data["section_types"]}
        self.assertIn("hero", types)

    def test_navigation_shape_and_localization(self):
        response = self.client.get("/api/v1/navigation/", HTTP_ACCEPT_LANGUAGE="fa")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()["data"]
        self.assertEqual(data["items"][0]["label"], "خدمات")
        self.assertEqual(data["cta"]["label"], "تماس")
        self.assertEqual(data["cta"]["href"], "/contact")

    def test_footer_shape(self):
        response = self.client.get("/api/v1/footer/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()["data"]
        self.assertIn("columns", data)
        self.assertIn("socials", data)
        self.assertIn("company", data)

    def test_announcement(self):
        response = self.client.get("/api/v1/announcement/", HTTP_ACCEPT_LANGUAGE="en")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["data"]["text"], "Announcement")

    def test_seo_by_slug_and_default(self):
        response = self.client.get("/api/v1/seo/?slug=home")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["data"]["page_slug"], "home")
        response = self.client.get("/api/v1/seo/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["data"]["robots"], "index,follow")

    def test_hero_config(self):
        response = self.client.get("/api/v1/hero/", HTTP_ACCEPT_LANGUAGE="fa")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["data"]["headline"], "تیتر قهرمان")

    def test_version_increments_on_republish(self):
        page = self.page
        page.status = Status.DRAFT
        page.save()
        page.status = Status.PUBLISHED
        page.save()
        page.refresh_from_db()
        self.assertGreaterEqual(page.version, 2)

    def test_services_page_composition(self):
        """The Services page is composed of the expected configured sections."""
        from .models import Page, PageSection

        page = Page.objects.create(
            title_fa="خدمات",
            title_en="Services",
            slug="services",
            status=Status.PUBLISHED,
            version=1,
        )
        order = [
            "hero",
            "journey",
            "services",
            "comparison",
            "stack",
            "process",
            "faq",
            "projects",
            "articles",
            "cta",
        ]
        for i, section_type in enumerate(order, start=1):
            is_core = section_type == "services"
            config = {
                "title": {"en": section_type},
                "items" if is_core else "dummy": [{"title": "Core Service"}] if is_core else [],
            }
            PageSection.objects.create(
                page=page,
                section_type=section_type,
                sort_order=i,
                is_enabled=True,
                config=config,
            )

        response = self.client.get("/api/v1/pages/services/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        sections = response.json()["data"]["sections"]
        self.assertEqual([s["type"] for s in sections], order)

        core = next(s for s in sections if s["type"] == "services")
        self.assertTrue("config" in core)
