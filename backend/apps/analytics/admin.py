from django.contrib import admin

from apps.core.admin import BaseAdminMixin

from .models import AnalyticsEvent, ContactRequest, PageView, Visitor

AUDIT_FIELDSET = (
    "Audit",
    {"classes": ("collapse",), "fields": ("created_by", "updated_by", "created_at", "updated_at")},
)

# NOTE: ``analytics.Newsletter`` is deprecated. Newsletter operations were
# consolidated on ``page_builder.NewsletterSubscription`` (Phase 8F/8G) — the
# single public subscription system. The legacy model is intentionally not
# registered so administrators use one inbox.


@admin.register(Visitor)
class VisitorAdmin(BaseAdminMixin):
    list_display = ("session_key", "user", "ip_address", "visit_count", "first_seen", "last_seen")
    list_filter = ("is_active", "is_deleted", "first_seen", "last_seen")
    search_fields = ("session_key", "ip_address", "user_agent", "user__username", "user__email")
    autocomplete_fields = ("user",)
    list_per_page = 25
    list_select_related = ("user", "created_by", "updated_by")
    readonly_fields = BaseAdminMixin.readonly_fields + ("session_key", "first_seen", "last_seen", "visit_count")
    fieldsets = (
        ("Visitor", {"fields": ("session_key", "user", "ip_address", "visit_count", "first_seen", "last_seen")}),
        ("Client info", {"fields": ("user_agent", "referrer")}),
        ("State", {"fields": ("is_active",)}),
        AUDIT_FIELDSET,
    )

    def has_import_permission(self, request):
        return False  # system-generated fact data


@admin.register(PageView)
class PageViewAdmin(BaseAdminMixin):
    """Append-only page view log — read-only in the admin."""

    list_display = ("path", "method", "status_code", "visitor", "user", "timestamp")
    list_filter = ("method", "status_code", "device_type", "browser", "timestamp")
    search_fields = ("path", "query_string", "referrer", "ip_address", "user_agent")
    autocomplete_fields = ("visitor", "user")
    list_per_page = 25
    list_select_related = ("visitor", "user", "created_by", "updated_by")
    date_hierarchy = "timestamp"  # the fact table is append-only; year→day drill-down keeps it fast
    readonly_fields = BaseAdminMixin.readonly_fields + ("timestamp",)
    fieldsets = (
        ("Request", {"fields": ("path", "query_string", "method", "status_code", "timestamp")}),
        ("Visitor", {"fields": ("visitor", "user", "ip_address", "language", "referrer")}),
        ("Client", {"fields": ("user_agent", "browser", "device_type", "os_name")}),
        AUDIT_FIELDSET,
    )

    def has_add_permission(self, request):
        return False  # rows are created by tracking code

    def has_import_permission(self, request):
        return False  # append-only fact table


@admin.register(AnalyticsEvent)
class AnalyticsEventAdmin(BaseAdminMixin):
    """Append-only analytics event log — read-only in the admin."""

    list_display = ("event_name", "timestamp", "user", "locale", "path", "request_id")
    list_filter = ("event_name", "locale", "timestamp")
    search_fields = ("event_name", "path", "client_id", "session_key", "request_id")
    autocomplete_fields = ("user", "visitor")
    list_per_page = 25
    list_select_related = ("user", "visitor", "created_by", "updated_by")
    date_hierarchy = "timestamp"
    readonly_fields = BaseAdminMixin.readonly_fields + ("timestamp",)
    fieldsets = (
        ("Event", {"fields": ("event_name", "timestamp", "locale", "path", "referrer")}),
        ("Identity", {"fields": ("visitor", "user", "session_key", "client_id", "ip_address")}),
        ("Payload", {"fields": ("metadata", "request_id", "user_agent")}),
        AUDIT_FIELDSET,
    )

    def has_add_permission(self, request):
        return False  # rows are created by the ingestion API

    def has_import_permission(self, request):
        return False  # append-only fact table


@admin.register(ContactRequest)
class ContactRequestAdmin(BaseAdminMixin):
    list_display = ("name", "email", "subject", "status", "source", "handled_by", "created_at")
    list_filter = ("status", "source", "created_at")
    search_fields = ("name", "email", "phone", "company", "subject", "message")
    autocomplete_fields = ("handled_by",)
    list_editable = ("status",)
    list_per_page = 25
    list_select_related = ("handled_by", "created_by", "updated_by")
    readonly_fields = BaseAdminMixin.readonly_fields + ("handled_at", "request_id")
    fieldsets = (
        ("Contact", {"fields": ("name", "email", "phone", "company", "subject", "message")}),
        ("Inquiry details", {
            "fields": (
                "service_category",
                "project_type",
                "budget_range",
                "preferred_contact",
                "consent",
                "locale",
            )
        }),
        ("Workflow", {"fields": ("status", "source", "handled_by", "handled_at", "request_id")}),
        ("State", {"fields": ("is_active",)}),
        AUDIT_FIELDSET,
    )

    @admin.action(description="Mark selected as spam")
    def mark_spam(self, request, queryset):
        updated = queryset.update(status="spam")
        self.message_user(request, f"{updated} request(s) marked as spam.")

    @admin.action(description="Mark selected as resolved")
    def mark_resolved(self, request, queryset):
        updated = queryset.update(status="resolved", handled_by=request.user)
        self.message_user(request, f"{updated} request(s) marked as resolved.")

    actions = ["mark_spam", "mark_resolved"]

