"""Phase 18: server attention bucket, pagination, counts, failure surfacing."""
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import Permission, Role, User
from apps.articles.models import Article
from apps.editorial.models import AuditEvent
from apps.editorial.services import PUBLISH_DUE_BATCH_SIZE, ScheduleService, WorkflowService


def _user(username, *codenames, staff=True):
    user = User.objects.create_user(username=username, password="pass12345")
    if staff:
        user.is_staff = True
    role = Role.objects.create(codename=f"p18_{username}", name=username)
    perms = [
        Permission.objects.get_or_create(codename=code, defaults={"name": code})[0]
        for code in codenames
    ]
    role.permissions.set(perms)
    user.role = role
    user.save()
    return user


def _ready_article(slug, **kw):
    kw.setdefault("title_en", "Ready title")
    kw.setdefault("description_en", "Ready body content here.")
    return Article.objects.create(slug=slug, status="draft", **kw)


def _approved_workflow(article, user):
    from apps.editorial.seed import seed_workflow_stages
    from apps.editorial.services import ApprovalService

    seed_workflow_stages()
    wf = WorkflowService.get_or_create(article)
    WorkflowService.submit_for_review(wf, user)
    ApprovalService.decide(wf.approvals.first(), user, approved=True)
    wf = WorkflowService.transition(wf, "seo_review", user)
    ApprovalService.decide(wf.approvals.filter(stage__code="seo_review").first(), user, approved=True)
    return WorkflowService.transition(wf, "approved", user)


class TimelineServerTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        from apps.editorial.seed import seed_workflow_stages

        seed_workflow_stages()

    def _managed(self, username):
        return _user(username, "editorial.view", "editorial.manage", "editorial.schedule")

    def test_attention_bucket_catches_overdue_blocked_and_failed(self):
        mgr = self._managed("attn1")
        # Overdue item (healthy — cron will publish it, so create the
        # attention assertion BEFORE publish_due, then verify it cleared).
        overdue_article = _ready_article("p18-overdue")
        overdue_wf = _approved_workflow(overdue_article, mgr)
        overdue = WorkflowService.schedule(
            overdue_wf, timezone.now() - timezone.timedelta(minutes=5), mgr
        )
        self.client.force_authenticate(mgr)
        pre = self.client.get("/api/v1/editorial/schedules/?bucket=attention")
        self.assertIn(overdue.pk, {row["id"] for row in pre.json()["data"]})
        overdue_article.title_en = ""
        overdue_article.save()
        # Blocked-health item (break content after scheduling).
        blocked_article = _ready_article("p18-blocked")
        blocked_wf = _approved_workflow(blocked_article, mgr)
        blocked = WorkflowService.schedule(
            blocked_wf, timezone.now() + timezone.timedelta(hours=2), mgr
        )
        blocked_article.title_en = ""
        blocked_article.save()
        # Failed-publication item.
        failed_article = _ready_article("p18-failed")
        failed_wf = _approved_workflow(failed_article, mgr)
        failed = WorkflowService.schedule(
            failed_wf, timezone.now() - timezone.timedelta(minutes=5), mgr
        )
        failed_article.title_en = ""
        failed_article.save()
        self.assertEqual(len(ScheduleService.publish_due()), 0)
        # Healthy future item stays out of attention.
        good_article = _ready_article("p18-good")
        good_wf = _approved_workflow(good_article, mgr)
        good = WorkflowService.schedule(
            good_wf, timezone.now() + timezone.timedelta(hours=2), mgr
        )
        self.client.force_authenticate(mgr)
        resp = self.client.get("/api/v1/editorial/schedules/?bucket=attention")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        ids = {row["id"] for row in resp.json()["data"]}
        self.assertTrue({overdue.pk, blocked.pk, failed.pk} <= ids)
        self.assertNotIn(good.pk, ids)
        # Failed row surfaces failure state on the payload.
        failed_row = next(r for r in resp.json()["data"] if r["id"] == failed.pk)
        self.assertTrue(failed_row["has_failed"])
        self.assertTrue(failed_row["last_failed_details"])
        self.assertTrue(failed_row["last_failed_at"])

    def test_failure_clears_after_successful_retry(self):
        mgr = self._managed("attn2")
        article = _ready_article("p18-retry")
        wf = _approved_workflow(article, mgr)
        sched = WorkflowService.schedule(
            wf, timezone.now() - timezone.timedelta(minutes=5), mgr
        )
        article.title_en = ""
        article.save()
        self.assertEqual(len(ScheduleService.publish_due()), 0)
        article.title_en = "Fixed title"
        article.save()
        self.assertEqual(len(ScheduleService.publish_due()), 1)
        sched.refresh_from_db()
        self.assertEqual(sched.status, "published")
        # No unresolved failure remains for this workflow.
        self.client.force_authenticate(mgr)
        failed = self.client.get("/api/v1/admin/dashboard/").json()["data"]["editorial"]["failed_count"]
        self.assertEqual(failed, 0)

    def test_list_is_paginated_and_counts_are_lightweight(self):
        mgr = self._managed("attn3")
        for i in range(3):
            article = _ready_article(f"p18-page-{i}")
            wf = _approved_workflow(article, mgr)
            WorkflowService.schedule(wf, timezone.now() + timezone.timedelta(hours=i + 1), mgr)
        self.client.force_authenticate(mgr)
        page = self.client.get("/api/v1/editorial/schedules/?page_size=1")
        self.assertEqual(page.status_code, status.HTTP_200_OK)
        self.assertIn("pagination", page.json())
        self.assertEqual(len(page.json()["data"]), 1)
        self.assertEqual(page.json()["pagination"]["count"], 3)
        counts = self.client.get("/api/v1/editorial/schedules/counts/")
        self.assertEqual(counts.status_code, status.HTTP_200_OK)
        body = counts.json()["data"]
        for key in ("total", "upcoming", "overdue", "today", "attention", "published", "cancelled", "failed"):
            self.assertIn(key, body)
        self.assertEqual(body["total"], 3)

    def test_done_buckets_and_dashboard_failed_surface(self):
        mgr = self._managed("attn4")
        article = _ready_article("p18-done")
        wf = _approved_workflow(article, mgr)
        sched = WorkflowService.schedule(
            wf, timezone.now() + timezone.timedelta(hours=1), mgr
        )
        ScheduleService.cancel(sched, mgr)
        self.client.force_authenticate(mgr)
        for bucket, want in (("cancelled", True), ("done", True), ("published", False)):
            resp = self.client.get(f"/api/v1/editorial/schedules/?bucket={bucket}")
            self.assertEqual(resp.status_code, status.HTTP_200_OK)
            self.assertEqual(any(r["id"] == sched.pk for r in resp.json()["data"]), want)
        dash = self.client.get("/api/v1/admin/dashboard/").json()["data"]["editorial"]
        self.assertIn("failed_count", dash)
        self.assertIn("failed", dash)

    def test_anonymous_rejected_and_viewer_read_only(self):
        mgr = self._managed("attn5")
        viewer = _user("attnviewer", "editorial.view")
        anon = self.client.get("/api/v1/editorial/schedules/counts/")
        self.assertEqual(anon.status_code, status.HTTP_401_UNAUTHORIZED)
        self.client.force_authenticate(viewer)
        denied = self.client.get("/api/v1/editorial/schedules/counts/")
        self.assertEqual(denied.status_code, status.HTTP_200_OK)
        article = _ready_article("p18-noview")
        wf = _approved_workflow(article, mgr)
        sched = WorkflowService.schedule(wf, timezone.now() + timezone.timedelta(hours=1), mgr)
        cant = self.client.post(f"/api/v1/editorial/schedules/{sched.pk}/cancel/", {}, format="json")
        self.assertEqual(cant.status_code, status.HTTP_403_FORBIDDEN)

    def test_publish_due_batch_cap_exists(self):
        self.assertGreaterEqual(PUBLISH_DUE_BATCH_SIZE, 1)
        mgr = self._managed("attn6")
        article = _ready_article("p18-batch")
        wf = _approved_workflow(article, mgr)
        sched = WorkflowService.schedule(
            wf, timezone.now() - timezone.timedelta(minutes=1), mgr
        )
        self.assertEqual(len(ScheduleService.publish_due(batch_size=1)), 1)
        sched.refresh_from_db()
        self.assertEqual(sched.status, "published")

    def test_search_points_services_at_hub(self):
        from apps.search.services import search_content
        from apps.services.models import Service, ServiceSection

        section = ServiceSection.objects.create(title_en="S", slug="s-p18")
        Service.objects.create(
            title_en="Unique P18 consulting service",
            description_en="Body",
            slug="p18-svc",
            status="published",
            is_public=True,
            section=section,
        )
        hits = search_content("Unique P18 consulting", type_filter="service")
        self.assertTrue(hits)
        for hit in hits:
            self.assertEqual(hit["url"], "/services")

    def test_unresolved_failure_ignores_old_failures_after_publish(self):
        mgr = self._managed("attn7")
        article = _ready_article("p18-oldfail")
        wf = _approved_workflow(article, mgr)
        AuditEvent.objects.create(workflow=wf, action="publish.failed", details="old")
        AuditEvent.objects.create(workflow=wf, action="workflow.publish", details="fixed")
        self.client.force_authenticate(mgr)
        counts = self.client.get("/api/v1/editorial/schedules/counts/").json()["data"]
        self.assertEqual(counts["failed"], 0)
