"""Custom AdminSite for the Hanahoush platform.

Provides branded header, ordered apps/models in the index, model-level
descriptions, and a real statistics dashboard.
"""
from django.contrib.admin import AdminSite
from django.db.models import Count

# Ordered list of app labels for the admin index sidebar.
APP_ORDER = [
    "accounts",
    "media_library",
    "articles",
    "projects",
    "services",
    "company",
    "analytics",
]

# Ordered list of model names (object_name) within each app.
MODEL_ORDER = {
    "accounts": ["User", "Role", "Permission"],
    "media_library": ["MediaFile"],
    "articles": ["Category", "Tag", "Article"],
    "projects": ["ProjectCategory", "Technology", "Project", "ProjectImage"],
    "services": ["ServiceSection", "Service"],
    "company": [
        "AboutPage",
        "TeamMember",
        "Partner",
        "Testimonial",
        "FAQ",
        "Timeline",
        "SocialLink",
        "Office",
        "SiteSettings",
    ],
    "analytics": ["Visitor", "PageView", "AnalyticsEvent", "ContactRequest", "Newsletter"],
}


class HanahoushAdminSite(AdminSite):
    """Enterprise admin site with branding, ordering, and navigation aids."""

    site_header = "Hanahoush Administration"
    site_title = "Hanahoush"
    index_title = "Platform Management"

    def get_app_list(self, request, app_label=None):
        """Return ordered app list with custom model ordering and descriptions."""
        app_list = super().get_app_list(request, app_label)
        # Sort apps by APP_ORDER
        app_order = {label: i for i, label in enumerate(APP_ORDER)}
        app_list.sort(key=lambda a: app_order.get(a["app_label"], 999))

        # Sort models within each app and add descriptions
        for app in app_list:
            order = MODEL_ORDER.get(app["app_label"], {})
            app["models"].sort(key=lambda m: order.get(m["object_name"], 999))

        return app_list

    def dashboard_stats(self, request) -> dict:
        """Real operational statistics from the database (never hardcoded)."""
        from django.contrib.auth import get_user_model

        from apps.analytics.models import ContactRequest, PageView
        from apps.articles.models import Article
        from apps.core.models import Status
        from apps.editorial.models import AuditEvent
        from apps.media_library.models import MediaFile
        from apps.page_builder.models import NewsletterSubscription, Page
        from apps.projects.models import Project
        from apps.services.models import Service

        User = get_user_model()
        contact_statuses = dict(
            ContactRequest.objects.values_list("status").annotate(c=Count("id")).values_list("status", "c")
        )
        return {
            "pages": Page.objects.count(),
            "articles_published": Article.objects.filter(status=Status.PUBLISHED).count(),
            "articles_drafts": Article.objects.filter(status__in=[Status.DRAFT, Status.REVIEW]).count(),
            "projects_total": Project.objects.count(),
            "projects_published": Project.objects.filter(status=Status.PUBLISHED).count(),
            "services": Service.objects.filter(status=Status.PUBLISHED).count(),
            "media": MediaFile.objects.filter(is_deleted=False).count(),
            "subscribers": NewsletterSubscription.objects.filter(is_active=True).count(),
            "users": User.objects.count(),
            "page_views": PageView.objects.count(),
            "contact_statuses": {
                "new": contact_statuses.get("new", 0),
                "in_progress": contact_statuses.get("in_progress", 0),
                "resolved": contact_statuses.get("resolved", 0),
                "closed": contact_statuses.get("closed", 0),
                "spam": contact_statuses.get("spam", 0),
            },
            "recent_activity": list(
                AuditEvent.objects.select_related("actor").order_by("-created_at")[:8].values_list("action", "details", "created_at")
            ),
        }

    def index(self, request, extra_context=None):
        context = {**(extra_context or {}), "dashboard": self.dashboard_stats(request)}
        return super().index(request, extra_context=context)


# The instance is registered via `default_site` setting.