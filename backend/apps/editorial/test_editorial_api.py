"""Editorial workflow tests: transitions, approvals, revisions, schedule,
publish (soft/hard), comments, locks and the audit trail."""
# ruff: noqa: E501, S106
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import Permission, Role
from apps.articles.models import Article
from apps.editorial.models import (
    AuditEvent,
    ContentWorkflow,
)
from apps.editorial.services import (
    LockService,
    RevisionService,
    ScheduleService,
    WorkflowError,
    WorkflowService,
)

User = get_user_model()


def grant(user, *codenames):
    perms = []
    for code in codenames:
        perm, _ = Permission.objects.get_or_create(codename=code, defaults={"name": code})
        perms.append(perm)
    role = Role.objects.create(codename=f"role_{user.pk}", name=f"Role {user.pk}")
    role.permissions.set(perms)
    user.role = role
    user.save()


class EditorialBaseCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        from apps.editorial.seed import seed_workflow_stages

        seed_workflow_stages()

    def make_user(self, username, *codenames):
        user = User.objects.create_user(username=username, password="pass12345")
        if codenames:
            grant(user, *codenames)
        return user

    def make_article(self, title="Editorial Article"):
        return Article.objects.create(
            title_fa="مقاله",
            title_en=title,
            slug=title.lower().replace(" ", "-"),
            description_fa="متن",
            description_en="Body",
            status="draft",
        )


class WorkflowServiceTests(EditorialBaseCase):
    def setUp(self):
        self.user = self.make_user("author")
        self.article = self.make_article()

    def test_full_flow_with_approval_chain(self):
        wf = WorkflowService.get_or_create(self.article)
        self.assertEqual(wf.stage.code, "draft")

        wf = WorkflowService.submit_for_review(wf, self.user)
        self.assertEqual(wf.stage.code, "in_review")
        self.assertEqual(wf.approvals.filter(status="pending").count(), 1)

        # Cannot advance while approval is pending.
        with self.assertRaises(WorkflowError):
            WorkflowService.send_to_seo_review(wf, self.user)

        approval = wf.approvals.first()
        wf = self._approve_and_advance(wf, approval, "seo_review")
        wf = self._approve_and_advance(wf, wf.approvals.filter(stage__code="seo_review").first(), "approved")

        schedule = WorkflowService.schedule(wf, timezone.now() + timezone.timedelta(hours=1), self.user)
        self.assertEqual(wf.stage.code, "scheduled")
        self.assertEqual(schedule.status, "scheduled")

        WorkflowService.publish(wf, self.user)
        self.assertEqual(wf.stage.code, "published")
        self.article.refresh_from_db()
        self.assertEqual(self.article.status, "published")

        WorkflowService.archive(wf, self.user)
        self.assertEqual(wf.stage.code, "archived")
        self.article.refresh_from_db()
        self.assertEqual(self.article.status, "archived")

        WorkflowService.reopen(wf, self.user)
        self.assertEqual(wf.stage.code, "draft")

    def _approve_and_advance(self, wf, approval, target):
        from apps.editorial.services import ApprovalService

        ApprovalService.decide(approval, self.user, approved=True)
        return WorkflowService.transition(wf, target, self.user)

    def test_rejected_approval_blocks_transition(self):
        from apps.editorial.services import ApprovalService

        wf = WorkflowService.submit_for_review(WorkflowService.get_or_create(self.article), self.user)
        approval = wf.approvals.first()
        ApprovalService.decide(approval, self.user, approved=False)
        with self.assertRaises(WorkflowError):
            WorkflowService.transition(wf, "seo_review", self.user)
        wf.refresh_from_db()
        self.assertEqual(wf.stage.code, "in_review")

    def test_revisions_rollback_and_diff(self):
        wf = WorkflowService.get_or_create(self.article)
        RevisionService.create_revision(wf, self.user, summary="v1 snapshot")

        self.article.title_en = "Changed Title"
        self.article.save()
        RevisionService.create_revision(wf, self.user, summary="v2 snapshot")

        self.assertEqual(wf.revisions.count(), 2)
        diff = RevisionService.diff(wf, 1, 2)
        titles = [c for c in diff["changes"] if c["field"] == "title_en"]
        self.assertEqual(titles[0]["old"], "Editorial Article")
        self.assertEqual(titles[0]["new"], "Changed Title")

        # Rollback to v1 restores content and creates a new revision.
        v1 = wf.revisions.get(version=1)
        RevisionService.rollback(wf, v1, self.user)
        self.article.refresh_from_db()
        self.assertEqual(self.article.title_en, "Editorial Article")
        self.assertEqual(wf.version, 3)

    def test_invalid_transition_rejected(self):
        wf = WorkflowService.get_or_create(self.article)
        with self.assertRaises(WorkflowError):
            WorkflowService.transition(wf, "published", self.user)  # draft → published not allowed

    def test_publish_requires_approved_or_scheduled(self):
        wf = WorkflowService.get_or_create(self.article)
        with self.assertRaises(WorkflowError):
            WorkflowService.publish(wf, self.user)

    def test_soft_publish_keeps_content_draft(self):
        wf = WorkflowService.submit_for_review(WorkflowService.get_or_create(self.article), self.user)
        approval = wf.approvals.first()
        from apps.editorial.services import ApprovalService

        ApprovalService.decide(approval, self.user, approved=True)
        wf = WorkflowService.transition(wf, "seo_review", self.user)
        ApprovalService.decide(wf.approvals.filter(stage__code="seo_review").first(), self.user, approved=True)
        wf = WorkflowService.transition(wf, "approved", self.user)
        WorkflowService.publish(wf, self.user, soft=True)
        wf.refresh_from_db()
        self.assertTrue(wf.is_soft_published)
        self.article.refresh_from_db()
        self.assertEqual(self.article.status, "draft")


class LockServiceTests(EditorialBaseCase):
    def test_acquire_release_and_conflict(self):
        a = self.make_user("alice")
        b = self.make_user("bob")
        article = self.make_article()

        lock = LockService.acquire(article, a)
        self.assertTrue(lock.is_active)
        self.assertEqual(lock.locked_by, a)

        with self.assertRaises(WorkflowError):
            LockService.acquire(article, b)

        LockService.release(article, a)
        lock2 = LockService.acquire(article, b)
        self.assertEqual(lock2.locked_by, b)

    def test_expired_lock_auto_unlocks(self):
        a = self.make_user("alice")
        b = self.make_user("bob")
        article = self.make_article()

        lock = LockService.acquire(article, a, ttl_seconds=1)
        lock.expires_at = timezone.now() - timezone.timedelta(seconds=1)
        lock.save(update_fields=["expires_at"])

        lock2 = LockService.acquire(article, b)
        self.assertEqual(lock2.locked_by, b)
        self.assertGreaterEqual(LockService.release_expired(), 0)


class EditorialAPITests(EditorialBaseCase):
    def setUp(self):
        self.viewer = self.make_user("viewer1", "editorial.view")
        self.manager = self.make_user("manager1", "editorial.view", "editorial.manage", "editorial.schedule")
        self.approver = self.make_user("approver1", "editorial.view", "editorial.approve", "editorial.manage")
        self.article = self.make_article()

    def _auth(self, user):
        self.client.force_authenticate(user=user)

    def test_api_requires_auth(self):
        response = self.client.get("/api/v1/editorial/workflows/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_workflow_list_and_transition(self):
        self._auth(self.manager)
        wf = WorkflowService.get_or_create(self.article)
        response = self.client.get("/api/v1/editorial/workflows/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["data"]), 1)

        response = self.client.post(
            f"/api/v1/editorial/workflows/{wf.pk}/submit-review/",
            {"reviewer_id": self.approver.pk},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        wf.refresh_from_db()
        self.assertEqual(wf.stage.code, "in_review")

        response = self.client.get(f"/api/v1/editorial/workflows/{wf.pk}/approvals/")
        self.assertEqual(response.status_code, 200)
        approval = response.json()["data"][0]

        self._auth(self.approver)
        response = self.client.post(
            f"/api/v1/editorial/workflows/{wf.pk}/approvals/{approval['id']}/decide/",
            {"approved": True, "comment": "LGTM"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["data"]["status"], "approved")

    def test_permission_denied_for_transition(self):
        self._auth(self.viewer)
        wf = WorkflowService.get_or_create(self.article)
        response = self.client.post(f"/api/v1/editorial/workflows/{wf.pk}/submit-review/", {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_ensure_creates_workflow(self):
        self._auth(self.manager)
        self.assertFalse(ContentWorkflow.objects.filter(object_id=self.article.pk).exists())
        response = self.client.post(
            "/api/v1/editorial/workflows/ensure/",
            {"content_type": "articles.article", "object_id": self.article.pk},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertEqual(data["stage"]["code"], "draft")
        self.assertTrue(ContentWorkflow.objects.filter(object_id=self.article.pk).exists())

    def test_ensure_is_idempotent(self):
        self._auth(self.manager)
        payload = {"content_type": "articles.article", "object_id": self.article.pk}
        first = self.client.post("/api/v1/editorial/workflows/ensure/", payload, format="json")
        second = self.client.post("/api/v1/editorial/workflows/ensure/", payload, format="json")
        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 200)
        self.assertEqual(first.json()["data"]["id"], second.json()["data"]["id"])
        self.assertEqual(ContentWorkflow.objects.filter(object_id=self.article.pk).count(), 1)

    def test_ensure_requires_manage_permission(self):
        self._auth(self.viewer)
        response = self.client.post(
            "/api/v1/editorial/workflows/ensure/",
            {"content_type": "articles.article", "object_id": self.article.pk},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_ensure_unknown_object(self):
        self._auth(self.manager)
        response = self.client.post(
            "/api/v1/editorial/workflows/ensure/",
            {"content_type": "articles.article", "object_id": 999999},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_comments_and_resolution(self):
        self._auth(self.manager)
        wf = WorkflowService.get_or_create(self.article)
        response = self.client.post(
            f"/api/v1/editorial/workflows/{wf.pk}/comments/",
            {"body": "Please fix the intro.", "mentions": [self.approver.pk]},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        comment_id = response.json()["data"]["id"]

        response = self.client.get(f"/api/v1/editorial/workflows/{wf.pk}/comments/")
        self.assertEqual(len(response.json()["data"]), 1)
        self.assertEqual(response.json()["data"][0]["mentions"], [self.approver.pk])

        response = self.client.post(
            f"/api/v1/editorial/workflows/{wf.pk}/comments/{comment_id}/resolve/",
            {},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        comment = wf.comments.get(pk=comment_id)
        self.assertTrue(comment.resolved)

    def test_schedule_and_publish_api(self):
        self._auth(self.manager)
        wf = WorkflowService.get_or_create(self.article)
        # Push to approved via service for brevity.
        from apps.editorial.services import ApprovalService

        WorkflowService.submit_for_review(wf, self.manager)
        ApprovalService.decide(wf.approvals.first(), self.approver, approved=True)
        wf = WorkflowService.transition(wf, "seo_review", self.manager)
        ApprovalService.decide(wf.approvals.filter(stage__code="seo_review").first(), self.approver, approved=True)
        wf = WorkflowService.transition(wf, "approved", self.manager)

        response = self.client.post(
            f"/api/v1/editorial/workflows/{wf.pk}/schedule/",
            {"scheduled_for": "2099-01-01T10:00:00Z"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["data"]["status"], "scheduled")

        response = self.client.post(
            f"/api/v1/editorial/workflows/{wf.pk}/publish/",
            {"soft": True},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["data"]["is_soft_published"])

    def test_lock_api_and_audit(self):
        self._auth(self.manager)
        response = self.client.post(
            "/api/v1/editorial/locks/",
            {"content_type": "articles.article", "object_id": self.article.pk, "note": "editing"},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        lock_id = response.json()["data"]["id"]

        self._auth(self.approver)
        response = self.client.post(
            "/api/v1/editorial/locks/",
            {"content_type": "articles.article", "object_id": self.article.pk},
            format="json",
        )
        self.assertEqual(response.status_code, 400)  # conflict

        self._auth(self.manager)
        response = self.client.post(f"/api/v1/editorial/locks/{lock_id}/release/", {}, format="json")
        self.assertEqual(response.status_code, 200)

        response = self.client.get("/api/v1/editorial/audit/")
        self.assertEqual(response.status_code, 200)
        actions = {e["action"] for e in response.json()["data"]}
        self.assertIn("lock.acquired", actions)
        self.assertIn("lock.released", actions)


class ScheduledPublishTests(EditorialBaseCase):
    def test_publish_due(self):
        user = self.make_user("publisher")
        article = self.make_article()
        wf = WorkflowService.get_or_create(article)
        from apps.editorial.services import ApprovalService

        WorkflowService.submit_for_review(wf, user)
        ApprovalService.decide(wf.approvals.first(), user, approved=True)
        wf = WorkflowService.transition(wf, "seo_review", user)
        ApprovalService.decide(wf.approvals.filter(stage__code="seo_review").first(), user, approved=True)
        wf = WorkflowService.transition(wf, "approved", user)
        WorkflowService.schedule(wf, timezone.now() - timezone.timedelta(minutes=1), user)

        published = ScheduleService.publish_due()
        self.assertEqual(len(published), 1)
        wf.refresh_from_db()
        self.assertEqual(wf.stage.code, "published")
        article.refresh_from_db()
        self.assertEqual(article.status, "published")

    def test_audit_trail_records_actions(self):
        user = self.make_user("auditor")
        article = self.make_article()
        wf = WorkflowService.get_or_create(article)
        WorkflowService.submit_for_review(wf, user)
        actions = set(AuditEvent.objects.values_list("action", flat=True))
        self.assertIn("workflow.transition", actions)
        self.assertIn("revision.created", actions)
        self.assertGreaterEqual(AuditEvent.objects.count(), 2)
