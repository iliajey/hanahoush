"""Operational dashboard data (Phase 8H).

Aggregates real backend data for the staff dashboard API. Aggregation queries
are used throughout and the full payload is cached for a short TTL so heavy
count queries never run on every request. Never exposes secrets.
"""
from datetime import timedelta

from django.conf import settings
from django.core.cache import cache
from django.db import connection
from django.utils import timezone

from apps.core.models import Status

DASHBOARD_CACHE_KEY = "admin:dashboard:v1"
DASHBOARD_CACHE_TTL = 60


def _check_database() -> dict:
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        return {"status": "healthy"}
    except Exception as exc:  # noqa: BLE001
        return {"status": "unhealthy", "details": str(exc)}


def _check_cache() -> dict:
    try:
        cache.set("dashboard:cache-check", "ok", 10)
        return {"status": "healthy" if cache.get("dashboard:cache-check") == "ok" else "degraded"}
    except Exception as exc:  # noqa: BLE001
        return {"status": "unhealthy", "details": str(exc)}


def _pending_migrations() -> dict:
    """Return unapplied migrations count (DB-aware, safe on any backend)."""
    try:
        from django.db.migrations.executor import MigrationExecutor

        executor = MigrationExecutor(connection)
        leaf_nodes = set(executor.loader.graph.leaf_nodes())
        applied = set(executor.loader.applied_migrations())
        pending = sorted(leaf_nodes - applied)
        return {"status": "ok" if not pending else "pending", "pending": len(pending)}
    except Exception:  # noqa: BLE001
        return {"status": "unknown", "pending": None}


def _content_section() -> dict:
    from apps.articles.models import Article
    from apps.editorial.models import PublicationSchedule
    from apps.projects.models import Project
    from apps.services.models import Service

    review_states = [Status.DRAFT, Status.REVIEW]
    now = timezone.now()
    return {
        "articles_published": Article.objects.filter(status=Status.PUBLISHED, is_public=True, is_deleted=False).count(),
        "articles_drafts": Article.objects.filter(status__in=review_states, is_deleted=False).count(),
        "articles_awaiting_review": Article.objects.filter(status=Status.REVIEW, is_deleted=False).count(),
        "articles_scheduled": PublicationSchedule.objects.filter(status="scheduled", scheduled_for__gte=now).count(),
        "projects_published": Project.objects.filter(status=Status.PUBLISHED, is_public=True, is_deleted=False).count(),
        "projects_drafts": Project.objects.filter(status__in=review_states, is_deleted=False).count(),
        "services": Service.objects.filter(status=Status.PUBLISHED, is_public=True, is_deleted=False).count(),
    }


def _editorial_section() -> dict:
    from apps.editorial.models import Approval, ContentLock, ContentRevision, PublicationSchedule

    now = timezone.now()
    return {
        "pending_approvals": Approval.objects.filter(status="pending").count(),
        "rejected_approvals": Approval.objects.filter(status="rejected").count(),
        "scheduled_publications": PublicationSchedule.objects.filter(status="scheduled", scheduled_for__gte=now).count(),
        "active_locks": ContentLock.objects.filter(expires_at__gt=now).count(),
        "recent_revisions": ContentRevision.objects.filter(created_at__gte=now - timedelta(days=30)).count(),
    }


def _engagement_section() -> dict:
    from apps.analytics.models import AnalyticsEvent, ContactRequest, PageView
    from apps.page_builder.models import NewsletterSubscription

    now = timezone.now()
    since = now - timedelta(days=30)
    return {
        "page_views": PageView.objects.count(),
        "page_views_30d": PageView.objects.filter(timestamp__gte=since).count(),
        "article_views": PageView.objects.filter(path__startswith="/articles/").count(),
        "project_views": PageView.objects.filter(path__startswith="/projects/").count(),
        "contact_requests": ContactRequest.objects.filter(status="new", is_deleted=False).count(),
        "newsletter_subscriptions": NewsletterSubscription.objects.filter(
            is_active=True, unsubscribed_at__isnull=True
        ).count(),
        "search_activity": AnalyticsEvent.objects.filter(event_name__startswith="search_").count(),
    }


def _operations_section() -> dict:
    from django.contrib.admin.models import LogEntry

    from apps.analytics.models import ContactRequest
    from apps.editorial.models import AuditEvent
    from apps.media_library.models import MediaFile

    return {
        "recent_contact_requests": list(
            ContactRequest.objects.filter(is_deleted=False)
            .order_by("-created_at")[:5]
            .values("id", "name", "email", "subject", "status", "created_at")
        ),
        "recent_editorial_activity": list(
            AuditEvent.objects.select_related("actor")
            .order_by("-created_at")[:5]
            .values("id", "action", "details", "created_at")
        ),
        "recent_media_uploads": list(
            MediaFile.objects.filter(is_deleted=False)
            .order_by("-created_at")[:5]
            .values("id", "original_name", "mime_type", "size", "created_at")
        ),
        "recent_admin_actions": list(
            LogEntry.objects.select_related("user", "content_type")
            .order_by("-action_time")[:5]
            .values("id", "action_flag", "change_message", "action_time")
        ),
    }


def _system_section(staff: bool) -> dict:
    return {
        "database": _check_database(),
        "cache": _check_cache(),
        "migrations": _pending_migrations() if staff else {"status": "restricted"},
        "environment": getattr(settings, "ENVIRONMENT", "unknown"),
        "version": getattr(settings, "APP_VERSION", "1.0.0"),
        "debug": settings.DEBUG,
    }


def get_operational_dashboard(user) -> dict:
    """Return the (cached) operational dashboard payload for a staff user."""
    cached = cache.get(DASHBOARD_CACHE_KEY)
    if cached is not None:
        cached["_cached"] = True
        return cached

    staff = bool(user and (user.is_staff or user.is_superuser))
    data = {
        "content": _content_section(),
        "editorial": _editorial_section(),
        "engagement": _engagement_section(),
        "operations": _operations_section(),
        "system": _system_section(staff),
        "generated_at": timezone.now().isoformat(),
    }
    cache.set(DASHBOARD_CACHE_KEY, data, DASHBOARD_CACHE_TTL)
    return data


def clear_dashboard_cache() -> None:
    cache.delete(DASHBOARD_CACHE_KEY)
