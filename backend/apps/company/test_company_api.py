"""API tests for the public Company content endpoints."""
from rest_framework import status
from rest_framework.test import APITestCase

from apps.company.models import (
    FAQ,
    AboutPage,
    Partner,
    SiteSettings,
    SocialLink,
    TeamMember,
    Timeline,
)
from apps.company.models import Testimonial as CompanyTestimonial


class CompanyAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.about = AboutPage.objects.create(
            title_fa="درباره ما",
            title_en="About Us",
            slug="about-us",
            description_fa="توضیح",
            description_en="Description",
            mission_fa="ماموریت",
            mission_en="Mission",
            vision_fa="چشم‌انداز",
            vision_en="Vision",
            status="published",
            is_public=True,
        )
        cls.member = TeamMember.objects.create(
            name="Ali", position_fa="مدیر", position_en="Manager"
        )
        cls.partner = Partner.objects.create(
            name="Arya", description_fa="شرکا", description_en="Partner"
        )
        cls.testimonial = CompanyTestimonial.objects.create(
            author_name="Reza",
            author_role="CTO",
            company="Arya",
            content_fa="عالی",
            content_en="Great",
            is_featured=True,
        )
        cls.faq = FAQ.objects.create(
            question_fa="سوال", question_en="Question", answer_fa="پاسخ", answer_en="Answer"
        )
        cls.timeline = Timeline.objects.create(
            title_fa="تأسیس", title_en="Founded", content_fa="شروع", content_en="Start"
        )
        cls.social = SocialLink.objects.create(platform="linkedin", label="LinkedIn", url="https://linkedin.example")
        cls.settings = SiteSettings.objects.create(
            pk=1,
            site_name="Hanahoush",
            tagline_fa="شعار",
            tagline_en="Tagline",
            contact_email="info@example.com",
            default_locale="fa",
            supported_locales=["fa", "en", "ar"],
        )

    def test_about_public(self):
        response = self.client.get("/api/v1/about/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.json()
        self.assertTrue(body["success"])
        self.assertEqual(body["data"][0]["slug"], "about-us")
        self.assertEqual(body["data"][0]["mission_en"], "Mission")

    def test_team_list(self):
        response = self.client.get("/api/v1/team/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["data"][0]["name"], "Ali")

    def test_team_localized_position(self):
        response = self.client.get("/api/v1/team/", HTTP_ACCEPT_LANGUAGE="fa")
        self.assertEqual(response.json()["data"][0]["position"], "مدیر")

    def test_partners_list(self):
        response = self.client.get("/api/v1/partners/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["data"][0]["name"], "Arya")

    def test_testimonials_featured_filter(self):
        response = self.client.get("/api/v1/testimonials/?is_featured=true")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()["data"]), 1)

    def test_faqs_localized(self):
        response = self.client.get("/api/v1/faqs/", HTTP_ACCEPT_LANGUAGE="fa")
        item = response.json()["data"][0]
        self.assertEqual(item["question"], "سوال")

    def test_timeline_list(self):
        response = self.client.get("/api/v1/timeline/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["data"][0]["title_en"], "Founded")

    def test_social_links(self):
        response = self.client.get("/api/v1/social-links/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["data"][0]["platform"], "linkedin")

    def test_site_settings_singleton(self):
        response = self.client.get("/api/v1/site-settings/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.json()
        self.assertEqual(body["data"]["site_name"], "Hanahoush")
        self.assertEqual(body["data"]["supported_locales"], ["fa", "en", "ar"])

    def test_site_settings_localized_tagline(self):
        response = self.client.get("/api/v1/site-settings/", HTTP_ACCEPT_LANGUAGE="fa")
        self.assertEqual(response.json()["data"]["tagline"], "شعار")

    def test_footer_envelope(self):
        response = self.client.get("/api/v1/footer/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()["data"]
        self.assertIn("columns", data)
        self.assertIn("socials", data)
        self.assertEqual(len(data["socials"]), 1)
        self.assertEqual(data["company"]["name"], "Hanahoush")
        self.assertEqual(data["company"]["contact_email"], "info@example.com")

    def test_maintenance_flag_exposed(self):
        response = self.client.get("/api/v1/site-settings/")
        self.assertIn("maintenance_mode", response.json()["data"])


