"""Phase 15: staff write path for ``Project.case_study`` (public<->studio parity).

Covers: staff can persist structured case-study JSON, validation rejects bad
shapes, anonymous/non-staff cannot write, and the staff detail payload
exposes the raw (unresolved) JSON for the Studio editor.
"""
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.projects.models import Project


CASE_STUDY = {
    "challenge": {"en": "Legacy checkout.", "fa": "تسویه‌حساب قدیمی."},
    "objectives": {"en": "Ship a fast shop."},
    "solution_approach": {"en": "Django + React."},
    "implementation_stages": [
        {"stage": {"en": "Design"}, "detail": {"en": "UX first."}},
        {"stage": {"en": "Build"}, "detail": {"en": "API + storefront."}},
    ],
    "architecture": {
        "description": {"en": "Layered."},
        "nodes": [{"layer": "Backend", "labels": {"en": ["Django"]}}],
    },
    "results": {"en": "+40% conversion."},
}


class CaseStudyWriteTests(APITestCase):
    def setUp(self):
        self.staff = User.objects.create_user(
            username="cs-staff", email="cs@h.local", password="pass12345", is_staff=True
        )
        self.plain = User.objects.create_user(
            username="cs-visitor", email="cs-v@h.local", password="pass12345"
        )
        self.project = Project.objects.create(
            title_en="Online Shop Platform",
            title_fa="فروشگاه اینترنتی",
            slug="online-shop-platform",
            description_en="Body",
            description_fa="متن",
            status="draft",
        )

    def url(self):
        return f"/api/v1/projects/{self.project.pk}/"

    def test_staff_can_write_case_study(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.patch(self.url(), {"case_study": CASE_STUDY}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.project.refresh_from_db()
        self.assertEqual(self.project.case_study["results"], {"en": "+40% conversion."})

    def test_staff_detail_exposes_raw_case_study(self):
        self.project.case_study = CASE_STUDY
        self.project.save(update_fields=["case_study"])
        self.client.force_authenticate(user=self.staff)
        data = self.client.get(self.url()).json()["data"]
        self.assertEqual(data["case_study_raw"], CASE_STUDY)
        # Localized public shape still resolves.
        public = self.client.get("/api/v1/projects/by-slug/online-shop-platform/").json()["data"]
        self.assertIn("Legacy checkout.", public["case_study"]["challenge"])

    def test_rejects_unknown_keys(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.patch(self.url(), {"case_study": {"made_up": "x"}}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_rejects_bad_stage_shape(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.patch(
            self.url(), {"case_study": {"implementation_stages": ["not-an-object"]}}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_anonymous_cannot_write(self):
        response = self.client.patch(self.url(), {"case_study": CASE_STUDY}, format="json")
        self.assertIn(response.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))

    def test_non_staff_cannot_write(self):
        self.client.force_authenticate(user=self.plain)
        response = self.client.patch(self.url(), {"case_study": CASE_STUDY}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
