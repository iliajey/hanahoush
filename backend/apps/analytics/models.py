"""Analytics domain: visitor tracking, page views, contact requests and
newsletter subscriptions.

Normalization decisions:
- ``Visitor`` (one row per browser session) is normalized out of
  ``PageView``; every page view references the same visitor instead of
  repeating IP/user-agent data per row.
- ``PageView`` is an append-only fact table (one row per request).
- ``ContactRequest`` and ``Newsletter`` are intake records with their own
  lifecycle fields, kept in the analytics app because they are operational
  data feeding reports/CRM (hanRP) rather than marketing content.
"""
import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.core.models import BaseModel


class Visitor(BaseModel):
    """A unique browser session."""

    session_key = models.CharField(max_length=255, unique=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="visits",
        help_text="Authenticated visitor, if known.",
    )
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    referrer = models.URLField(blank=True)
    first_seen = models.DateTimeField(auto_now_add=True, editable=False)
    last_seen = models.DateTimeField(auto_now=True, editable=False)
    visit_count = models.PositiveIntegerField(default=1)

    class Meta:
        verbose_name = "Visitor"
        verbose_name_plural = "Visitors"
        ordering = ["-last_seen"]

    def __str__(self) -> str:
        return self.session_key


class PageView(BaseModel):
    """One page-view event (append-only)."""

    visitor = models.ForeignKey(
        Visitor,
        on_delete=models.CASCADE,
        related_name="page_views",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="page_views",
    )
    path = models.CharField(max_length=500, db_index=True)
    query_string = models.CharField(max_length=500, blank=True)
    method = models.CharField(max_length=10, blank=True)
    status_code = models.PositiveSmallIntegerField(null=True, blank=True)
    referrer = models.URLField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    browser = models.CharField(max_length=50, blank=True)
    device_type = models.CharField(max_length=50, blank=True)
    os_name = models.CharField(max_length=50, blank=True)
    language = models.CharField(max_length=10, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True, editable=False, db_index=True)

    class Meta:
        verbose_name = "Page view"
        verbose_name_plural = "Page views"
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["visitor", "timestamp"], name="pv_visitor_ts_idx"),
            models.Index(fields=["path", "timestamp"], name="pv_path_ts_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.method} {self.path}"


class ContactRequest(BaseModel):
    """A contact-form submission."""

    STATUS_CHOICES = [
        ("new", "New"),
        ("in_progress", "In progress"),
        ("resolved", "Resolved"),
        ("closed", "Closed"),
        ("spam", "Spam"),
    ]
    PREFERRED_CONTACT_CHOICES = [
        ("email", "Email"),
        ("phone", "Phone"),
        ("any", "Email or phone"),
    ]

    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    company = models.CharField(max_length=255, blank=True)
    subject = models.CharField(max_length=255, blank=True)
    service_category = models.CharField(max_length=100, blank=True)
    project_type = models.CharField(max_length=100, blank=True)
    budget_range = models.CharField(max_length=100, blank=True)
    preferred_contact = models.CharField(
        max_length=20,
        choices=PREFERRED_CONTACT_CHOICES,
        default="any",
    )
    message = models.TextField()
    consent = models.BooleanField(default=False, help_text="Consent to be contacted.")
    locale = models.CharField(
        max_length=5,
        choices=[("fa", "Persian"), ("en", "English"), ("ar", "Arabic")],
        default="en",
    )
    request_id = models.UUIDField(default=uuid.uuid4, editable=False, db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="new", db_index=True)
    source = models.CharField(
        max_length=50,
        blank=True,
        help_text="Where the request came from (page/form id).",
    )
    website = models.CharField(
        max_length=255,
        blank=True,
        help_text="Honeypot field — never shown to users.",
    )
    handled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="handled_contact_requests",
    )
    handled_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Contact request"
        verbose_name_plural = "Contact requests"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "created_at"], name="cr_status_created_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.name} — {self.subject or self.email}"

    def is_spam(self) -> bool:
        """Honeypot heuristic: a filled hidden 'website' field signals spam."""
        return bool(self.website)

    def mark_handled(self, user) -> None:
        from django.utils import timezone

        self.status = "in_progress"
        self.handled_by = user
        self.handled_at = timezone.now()
        self.save(update_fields=["status", "handled_by", "handled_at", "updated_at"])


class Newsletter(BaseModel):
    """An email newsletter subscription."""

    email = models.EmailField(unique=True)
    source = models.CharField(max_length=50, blank=True)
    language = models.CharField(max_length=10, blank=True)
    unsubscribe_token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    unsubscribed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Newsletter subscriber"
        verbose_name_plural = "Newsletter subscribers"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.email


class AnalyticsEvent(BaseModel):
    """A persistent analytics event (Phase 8H) — the single event sink.

    Append-only. Ingestion is throttled, synchronous and lightweight; the
    frontend batches events so page requests are never blocked. Privacy rules:
    credentials are never stored, ``metadata`` only holds non-sensitive values,
    ``user`` is linked when authenticated and ``client_id`` carries the
    anonymous visitor identifier otherwise.
    """

    event_name = models.CharField(max_length=100, db_index=True)
    timestamp = models.DateTimeField(default=timezone.now, db_index=True)
    session_key = models.CharField(max_length=255, blank=True)
    client_id = models.CharField(max_length=255, blank=True)
    visitor = models.ForeignKey(
        Visitor,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="analytics_events",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="analytics_events",
    )
    locale = models.CharField(max_length=5, blank=True)
    path = models.CharField(max_length=500, blank=True)
    referrer = models.URLField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    request_id = models.CharField(max_length=64, blank=True)
    user_agent = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        verbose_name = "Analytics event"
        verbose_name_plural = "Analytics events"
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["event_name", "timestamp"], name="ae_event_ts_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.event_name} @ {self.timestamp:%Y-%m-%d %H:%M}"
