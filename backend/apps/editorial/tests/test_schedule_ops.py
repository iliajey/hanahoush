"""Phase 16: schedule cancel/reschedule, bucket filters, idempotent publish."""
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import Permission, Role, User
from apps.articles.models import Article
from apps.editorial.models import PublicationSchedule
from apps.editorial.services import ScheduleService, WorkflowError, WorkflowService


def _user(username, *codenames):
    user = User.objects.create_user(username=username, password="pass12345")
    role = Role.objects.create(codename=f"r16_{username}", name=username)
    perms = [
        Permission.objects.get_or_create(codename=code, defaults={"name": code})[0]
        for code in codenames
    ]
    role.permissions.set(perms)
    user.role = role
    user.save()
    return user


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


class ScheduleOpsTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        from apps.editorial.seed import seed_workflow_stages

        seed_workflow_stages()

    def test_cancel_and_reschedule_service(self):
        user = _user("sched1")
        article = Article.objects.create(title_en="S1", slug="s1", description_en="b", status="draft")
        wf = _approved_workflow(article, user)
        sched = WorkflowService.schedule(wf, timezone.now() + timezone.timedelta(hours=2), user)
        nxt = timezone.now() + timezone.timedelta(hours=5)
        ScheduleService.reschedule(sched, nxt, user)
        sched.refresh_from_db()
        self.assertEqual(sched.status, "scheduled")
        ScheduleService.cancel(sched, user)
        sched.refresh_from_db()
        self.assertEqual(sched.status, "cancelled")
        with self.assertRaises(WorkflowError):
            ScheduleService.reschedule(sched, nxt, user)

    def test_reschedule_rejects_past(self):
        user = _user("sched2")
        article = Article.objects.create(title_en="S2", slug="s2", description_en="b", status="draft")
        wf = _approved_workflow(article, user)
        sched = WorkflowService.schedule(wf, timezone.now() + timezone.timedelta(hours=2), user)
        with self.assertRaises(WorkflowError):
            ScheduleService.reschedule(sched, timezone.now() - timezone.timedelta(minutes=1), user)

    def test_publish_due_idempotent_and_skips_cancelled(self):
        user = _user("sched3")
        article = Article.objects.create(title_en="S3", slug="s3", description_en="b", status="draft")
        wf = _approved_workflow(article, user)
        sched = WorkflowService.schedule(wf, timezone.now() - timezone.timedelta(minutes=1), user)
        self.assertEqual(len(ScheduleService.publish_due()), 1)
        # Second run publishes nothing new.
        self.assertEqual(len(ScheduleService.publish_due()), 0)
        sched.refresh_from_db()
        self.assertEqual(sched.status, "published")

    def test_schedule_api_cancel_reschedule_and_buckets(self):
        manager = _user("mgr16", "editorial.view", "editorial.manage", "editorial.schedule")
        viewer = _user("view16", "editorial.view")
        article = Article.objects.create(title_en="S4", slug="s4", description_en="b", status="draft")
        wf = _approved_workflow(article, manager)
        self.client.force_authenticate(manager)
        resp = self.client.post(
            f"/api/v1/editorial/workflows/{wf.pk}/schedule/",
            {"scheduled_for": (timezone.now() + timezone.timedelta(hours=3)).isoformat()},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        sched_id = resp.json()["data"]["id"]
        # bucket filter
        upcoming = self.client.get("/api/v1/editorial/schedules/?bucket=upcoming")
        self.assertEqual(upcoming.status_code, status.HTTP_200_OK)
        self.assertTrue(any(r["id"] == sched_id for r in upcoming.json()["data"]))
        # viewer cannot cancel
        self.client.force_authenticate(viewer)
        denied = self.client.post(f"/api/v1/editorial/schedules/{sched_id}/cancel/", {}, format="json")
        self.assertEqual(denied.status_code, status.HTTP_403_FORBIDDEN)
        # manager reschedules then cancels
        self.client.force_authenticate(manager)
        res = self.client.post(
            f"/api/v1/editorial/schedules/{sched_id}/reschedule/",
            {"scheduled_for": (timezone.now() + timezone.timedelta(hours=6)).isoformat()},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        cancelled = self.client.post(f"/api/v1/editorial/schedules/{sched_id}/cancel/", {}, format="json")
        self.assertEqual(cancelled.status_code, status.HTTP_200_OK)
        self.assertEqual(cancelled.json()["data"]["status"], "cancelled")
        self.assertIn("content_label", cancelled.json()["data"])
