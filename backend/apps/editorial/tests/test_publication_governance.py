"""Phase 17: critical-health gate, publish_due safety, locale readiness."""
from django.core.cache import cache
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import Permission, Role, User
from apps.articles.models import Article
from apps.core.services.dashboard import DASHBOARD_CACHE_KEY
from apps.editorial.models import AuditEvent, PublicationSchedule
from apps.editorial.readiness import PublicationBlocked, blocking_issues, locale_readiness
from apps.editorial.services import ScheduleService, WorkflowError, WorkflowService


def _user(username, *codenames):
    user = User.objects.create_user(username=username, password="pass12345")
    role = Role.objects.create(codename=f"p17_{username}", name=username)
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


class ReadinessUnitTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        from apps.editorial.seed import seed_workflow_stages

        seed_workflow_stages()

    def test_blocking_missing_title_body_slug(self):
        a = Article(slug="", title_en="", description_en="")
        fields = {b["field"] for b in blocking_issues(a)}
        self.assertTrue({"slug", "title_en", "description_en"} <= fields)

    def test_warnings_do_not_block(self):
        # Long meta + missing FA/AR + missing cover must NOT block.
        a = _ready_article("p17-ok", meta_title="x" * 70, meta_description="y" * 170)
        self.assertEqual(blocking_issues(a), [])

    def test_invalid_slug_and_canonical_block(self):
        a = _ready_article("bad slug!!", canonical_url="not-a-url")
        fields = {b["field"] for b in blocking_issues(a)}
        self.assertTrue({"slug", "canonical_url"} <= fields)

    def test_locale_readiness_shape(self):
        a = _ready_article("p17-loc", title_fa="فا", description_fa="متن")
        r = locale_readiness(a)
        self.assertTrue(r["en"]["ready"])
        self.assertTrue(r["fa"]["ready"])
        self.assertFalse(r["ar"]["ready"])
        self.assertIn("Missing title", r["ar"]["issues"])


class ScheduleGateTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        from apps.editorial.seed import seed_workflow_stages

        seed_workflow_stages()

    def test_schedule_blocked_returns_422(self):
        manager = _user("gate1", "editorial.view", "editorial.manage", "editorial.schedule")
        article = Article.objects.create(title_en="", description_en="", slug="p17-block", status="draft")
        wf = _approved_workflow(article, manager)
        self.client.force_authenticate(manager)
        resp = self.client.post(
            f"/api/v1/editorial/workflows/{wf.pk}/schedule/",
            {"scheduled_for": (timezone.now() + timezone.timedelta(hours=2)).isoformat()},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertEqual(resp.json()["errors"]["code"], ["PUBLICATION_BLOCKED"])
        self.assertTrue(resp.json()["errors"]["blocking"])

    def test_schedule_allowed_after_fix(self):
        manager = _user("gate2", "editorial.view", "editorial.manage", "editorial.schedule")
        article = Article.objects.create(title_en="", description_en="body", slug="p17-fix", status="draft")
        wf = _approved_workflow(article, manager)
        self.client.force_authenticate(manager)
        blocked = self.client.post(
            f"/api/v1/editorial/workflows/{wf.pk}/schedule/",
            {"scheduled_for": (timezone.now() + timezone.timedelta(hours=2)).isoformat()},
            format="json",
        )
        self.assertEqual(blocked.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        article.title_en = "Fixed title"
        article.save()
        ok = self.client.post(
            f"/api/v1/editorial/workflows/{wf.pk}/schedule/",
            {"scheduled_for": (timezone.now() + timezone.timedelta(hours=2)).isoformat()},
            format="json",
        )
        self.assertEqual(ok.status_code, status.HTTP_200_OK)

    def test_publish_now_blocked(self):
        manager = _user("gate3", "editorial.view", "editorial.manage", "editorial.schedule")
        article = Article.objects.create(title_en="T", description_en="", slug="p17-pub", status="draft")
        wf = _approved_workflow(article, manager)
        with self.assertRaises(PublicationBlocked):
            WorkflowService.publish(wf, manager)

    def test_timeline_carries_locale_readiness(self):
        manager = _user("gate4", "editorial.view", "editorial.manage", "editorial.schedule")
        article = _ready_article("p17-tl", title_fa="فا", description_fa="متن")
        wf = _approved_workflow(article, manager)
        WorkflowService.schedule(wf, timezone.now() + timezone.timedelta(hours=2), manager)
        self.client.force_authenticate(manager)
        resp = self.client.get("/api/v1/editorial/schedules/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        row = resp.json()["data"][0]
        self.assertIn("locale_readiness", row)
        self.assertTrue(row["locale_readiness"]["en"]["ready"])
        self.assertFalse(row["locale_readiness"]["ar"]["ready"])


class PublishDueSafetyTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        from apps.editorial.seed import seed_workflow_stages

        seed_workflow_stages()

    def _due(self, slug, user, **kw):
        article = _ready_article(slug, **kw)
        wf = _approved_workflow(article, user)
        return WorkflowService.schedule(wf, timezone.now() - timezone.timedelta(minutes=1), user)

    def test_due_publishes_future_does_not(self):
        user = _user("due1")
        sched = self._due("p17-due", user)
        future_article = _ready_article("p17-future")
        future_wf = _approved_workflow(future_article, user)
        WorkflowService.schedule(future_wf, timezone.now() + timezone.timedelta(hours=1), user)
        self.assertEqual(len(ScheduleService.publish_due()), 1)
        sched.refresh_from_db()
        self.assertEqual(sched.status, "published")
        future_article.refresh_from_db()
        self.assertEqual(future_article.status, "published" if False else "draft")

    def test_cancelled_never_publishes(self):
        user = _user("due2")
        sched = self._due("p17-cancel", user)
        ScheduleService.cancel(sched, user)
        self.assertEqual(len(ScheduleService.publish_due()), 0)

    def test_no_double_publish_and_repeat_safe(self):
        user = _user("due3")
        sched = self._due("p17-once", user)
        self.assertEqual(len(ScheduleService.publish_due()), 1)
        self.assertEqual(len(ScheduleService.publish_due()), 0)
        sched.refresh_from_db()
        self.assertEqual(sched.status, "published")

    def test_blocking_health_prevents_publication_with_audit(self):
        user = _user("due4")
        article = Article.objects.create(slug="p17-sick", title_en="T", description_en="B", status="draft")
        wf = _approved_workflow(article, user)
        sched = WorkflowService.schedule(wf, timezone.now() - timezone.timedelta(minutes=1), user)
        # Break content after scheduling (simulates edited-into-invalid).
        article.title_en = ""
        article.save()
        self.assertEqual(len(ScheduleService.publish_due()), 0)
        sched.refresh_from_db()
        self.assertEqual(sched.status, "scheduled")
        self.assertTrue(
            AuditEvent.objects.filter(workflow=wf, action="publish.failed").exists()
        )

    def test_timezone_boundary_and_multiple_due(self):
        user = _user("due5")
        self._due("p17-m1", user)
        self._due("p17-m2", user)
        # Exactly-now boundary counts as due.
        article = _ready_article("p17-m3")
        wf = _approved_workflow(article, user)
        WorkflowService.schedule(wf, timezone.now(), user)
        self.assertEqual(len(ScheduleService.publish_due()), 3)

    def test_one_failure_does_not_corrupt_others(self):
        user = _user("due6")
        bad = Article.objects.create(slug="p17-bad", title_en="T", description_en="B", status="draft")
        bad_wf = _approved_workflow(bad, user)
        WorkflowService.schedule(bad_wf, timezone.now() - timezone.timedelta(minutes=1), user)
        bad.title_en = ""
        bad.save()
        good_sched = self._due("p17-good", user)
        self.assertEqual(len(ScheduleService.publish_due()), 1)
        good_sched.refresh_from_db()
        self.assertEqual(good_sched.status, "published")

    def test_cache_invalidated_and_audit_and_visibility(self):
        user = _user("due7")
        sched = self._due("p17-vis", user, is_public=True)
        cache.set(DASHBOARD_CACHE_KEY, {"stale": True}, 60)
        ScheduleService.publish_due()
        self.assertIsNone(cache.get(DASHBOARD_CACHE_KEY))
        sched.refresh_from_db()
        article = Article.objects.get(slug="p17-vis")
        self.assertEqual(article.status, "published")
        self.assertTrue(article.is_public)
        self.assertTrue(
            AuditEvent.objects.filter(workflow=sched.workflow, action="workflow.publish").exists()
        )

    def test_sitemap_only_hub_for_services(self):
        from apps.services.models import Service

        Service.objects.create(title_en="Svc", description_en="Body", slug="p17-svc", status="published")
        self.client.get("/sitemap.xml")
        content = self.client.get("/sitemap.xml").content.decode()
        self.assertIn("/services", content)
        self.assertNotIn("/services/p17-svc/", content)

    def test_rbac_viewer_cannot_schedule(self):
        _user("dueviewer", "editorial.view")
        manager = _user("duemgr", "editorial.view", "editorial.manage", "editorial.schedule")
        article = _ready_article("p17-rbac")
        wf = _approved_workflow(article, manager)
        viewer = User.objects.get(username="dueviewer")
        # Service layer has no role concept; API enforces 403.
        self.client.force_authenticate(viewer)
        resp = self.client.post(
            f"/api/v1/editorial/workflows/{wf.pk}/schedule/",
            {"scheduled_for": (timezone.now() + timezone.timedelta(hours=1)).isoformat()},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
