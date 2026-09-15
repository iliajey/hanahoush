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
    published_articles = Article.objects.filter(
        status=Status.PUBLISHED, is_public=True, is_deleted=False
    )
    published_projects = Project.objects.filter(
        status=Status.PUBLISHED, is_public=True, is_deleted=False
    )
    published_services = Service.objects.filter(
        status=Status.PUBLISHED, is_public=True, is_deleted=False
    )
    return {
        "articles_published": published_articles.count(),
        "articles_drafts": Article.objects.filter(status__in=review_states, is_deleted=False).count(),
        "articles_awaiting_review": Article.objects.filter(status=Status.REVIEW, is_deleted=False).count(),
        "articles_scheduled": PublicationSchedule.objects.filter(status="scheduled", scheduled_for__gte=now).count(),
        "articles_missing_fa": published_articles.filter(title_fa="").count(),
        "articles_missing_ar": published_articles.filter(title_ar="").count(),
        "projects_published": published_projects.count(),
        "projects_drafts": Project.objects.filter(status__in=review_states, is_deleted=False).count(),
        "projects_awaiting_review": Project.objects.filter(status=Status.REVIEW, is_deleted=False).count(),
        "projects_missing_fa": published_projects.filter(title_fa="").count(),
        "projects_missing_ar": published_projects.filter(title_ar="").count(),
        "services": published_services.count(),
        "services_drafts": Service.objects.filter(status__in=review_states, is_deleted=False).count(),
        "services_awaiting_review": Service.objects.filter(status=Status.REVIEW, is_deleted=False).count(),
        "services_missing_fa": published_services.filter(title_fa="").count(),
        "services_missing_ar": published_services.filter(title_ar="").count(),
    }


def _schedule_brief(qs):
    rows = list(
        qs.select_related("workflow", "workflow__stage", "workflow__content_type", "scheduled_by")
        .order_by("scheduled_for")[:8]
        .values(
            "id",
            "workflow_id",
            "workflow__object_id",
            "workflow__stage__code",
            "workflow__stage__name",
            "workflow__content_type__app_label",
            "workflow__content_type__model",
            "scheduled_for",
            "status",
            "scheduled_by__username",
        )
    )
    out = []
    for row in rows:
        out.append(
            {
                "id": row["id"],
                "workflow": row["workflow_id"],
                "object_id": row["workflow__object_id"],
                "content_type": f"{row['workflow__content_type__app_label']}.{row['workflow__content_type__model']}",
                "stage": {"code": row["workflow__stage__code"], "name": row["workflow__stage__name"]},
                "scheduled_for": row["scheduled_for"].isoformat() if row["scheduled_for"] else None,
                "status": row["status"],
                "scheduled_by": row["scheduled_by__username"],
            }
        )
    return out


def _editorial_section() -> dict:
    from apps.editorial.models import (
        Approval,
        AuditEvent,
        ContentLock,
        ContentRevision,
        PublicationSchedule,
    )

    now = timezone.now()
    upcoming = PublicationSchedule.objects.filter(status="scheduled", scheduled_for__gte=now, is_deleted=False)
    overdue = PublicationSchedule.objects.filter(status="scheduled", scheduled_for__lt=now, is_deleted=False)
    start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    end = start + timedelta(days=1)
    today = PublicationSchedule.objects.filter(
        status="scheduled", scheduled_for__gte=start, scheduled_for__lt=end, is_deleted=False
    )
    # Failed publications: latest publish.failed per workflow, resolved by a
    # later workflow.publish. Two grouped queries — no per-row cost.
    from django.db.models import Max

    failed_at = dict(
        AuditEvent.objects.filter(action="publish.failed", is_deleted=False)
        .values("workflow_id")
        .annotate(at=Max("created_at"))
        .values_list("workflow_id", "at")
    )
    published_at = dict(
        AuditEvent.objects.filter(action="workflow.publish", is_deleted=False)
        .values("workflow_id")
        .annotate(at=Max("created_at"))
        .values_list("workflow_id", "at")
    )
    unresolved_wf = [
        wid for wid, at in failed_at.items()
        if wid is not None and (wid not in published_at or at > published_at[wid])
    ]
    failed = PublicationSchedule.objects.filter(
        status="scheduled", workflow_id__in=unresolved_wf, is_deleted=False
    )
    return {
        "pending_approvals": Approval.objects.filter(status="pending").count(),
        "rejected_approvals": Approval.objects.filter(status="rejected").count(),
        "scheduled_publications": upcoming.count(),
        "active_locks": ContentLock.objects.filter(expires_at__gt=now).count(),
        "recent_revisions": ContentRevision.objects.filter(created_at__gte=now - timedelta(days=30)).count(),
        "upcoming_count": upcoming.count(),
        "overdue_count": overdue.count(),
        "today_count": today.count(),
        "failed_count": failed.count(),
        "upcoming": _schedule_brief(upcoming),
        "overdue": _schedule_brief(overdue),
        "today": _schedule_brief(today),
        "failed": _schedule_brief(failed),
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
    from apps.articles.models import Article
    from apps.editorial.models import AuditEvent
    from apps.media_library.models import MediaFile
    from apps.projects.models import Project
    from apps.services.models import Service

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
        "recent_articles": list(
            Article.objects.filter(is_deleted=False)
            .order_by("-updated_at")[:5]
            .values("id", "title_en", "slug", "status", "updated_at")
        ),
        "recent_projects": list(
            Project.objects.filter(is_deleted=False)
            .order_by("-updated_at")[:5]
            .values("id", "title_en", "slug", "status", "updated_at")
        ),
        "recent_services": list(
            Service.objects.filter(is_deleted=False)
            .order_by("-updated_at")[:5]
            .values("id", "title_en", "slug", "status", "updated_at")
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
