"""Regression tests for the Phase-10 browser-verification fixes:

1. Workflow list must accept the `content_type=articles.article` LABEL filter
   (it was declared as a filterset FK field and rejected valid labels with a
   400, breaking the workspace "workflow for content" queries).
2. Workflow detail must return the standard `{success, data, ...}` envelope
   (the default DRF retrieve returned a flat serializer payload, so the
   frontend `data.data` unwrap resolved to `undefined`).
"""
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.articles.models import Article
from apps.editorial.models import ContentWorkflow, WorkflowStage

API = "/api/v1/editorial"


class WorkflowAPIRegressionTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.superuser = User.objects.create_superuser(
            username="editorial-super", email="editorial-super@hanahoush.local", password="pass12345"
        )
        cls.stage = WorkflowStage.objects.create(code="draft", name="Draft", order=0)
        cls.article = Article.objects.create(
            title_fa="مقاله ویراستاری",
            title_en="Editorial Article",
            slug="editorial-article",
            description_fa="متن",
            description_en="Body",
            status="draft",
            is_public=False,
        )
        cls.workflow = ContentWorkflow.objects.create(
            content_object=cls.article, stage=cls.stage, version=0
        )

    def setUp(self):
        self.client.force_authenticate(self.superuser)

    def test_workflow_list_accepts_content_type_label_filter(self):
        # The list endpoint must accept the SAME label format the workspace
        # sends (`articles.article`). Regression: previously the DjangoFilter
        # FK field rejected the label with a 400 before get_queryset could
        # resolve it.
        response = self.client.get(
            f"{API}/workflows/?content_type=articles.article&object_id={self.article.pk}"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.json()
        self.assertTrue(body["success"])
        ids = [item["id"] for item in body["data"]]
        self.assertIn(self.workflow.pk, ids)

    def test_workflow_detail_uses_standard_envelope(self):
        response = self.client.get(f"{API}/workflows/{self.workflow.pk}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.json()
        # Regression: the default DRF retrieve returned a FLAT payload with no
        # envelope, so the frontend `data.data` unwrap resolved to undefined.
        self.assertIn("success", body)
        self.assertIn("data", body)
        self.assertTrue(body["success"])
        self.assertEqual(body["data"]["object_id"], self.article.pk)

    def test_workflow_list_requires_auth(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(f"{API}/workflows/")
        self.assertIn(response.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))