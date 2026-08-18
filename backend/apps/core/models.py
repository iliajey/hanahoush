"""Core domain foundations.

This app intentionally contains only ABSTRACT models (no database tables).
It is the single source of truth for:

- the audit trail / lifecycle fields shared by every domain model,
- the multilingual title + slug pattern,
- the "publishable entity" pattern (status, SEO, featured, ordering) used by
  every content type (articles, projects, services, company pages).

Concrete tables live in the feature apps, which inherit from these bases.
This keeps field definitions normalized and future multilingual support
centralized in one place.
"""
from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.common.infrastructure.models.base_model import TimeStampedModel


class Status(models.TextChoices):
    """Publishing lifecycle shared by every publishable entity."""

    DRAFT = "draft", "Draft"
    REVIEW = "review", "Review"
    PUBLISHED = "published", "Published"
    ARCHIVED = "archived", "Archived"


class BaseModel(TimeStampedModel):
    """Common lifecycle + audit fields for every domain model.

    - ``created_by`` / ``updated_by`` keep an audit trail of who touched a
      record (history is preserved on user deletion via SET_NULL).
    - ``is_active`` is the soft "enabled" flag used by managers/querysets.
    - ``is_deleted`` is the soft-delete flag; records are never hard-deleted.
    """

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        editable=False,
        related_name="%(app_label)s_%(class)s_created",
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        editable=False,
        related_name="%(app_label)s_%(class)s_updated",
    )
    is_active = models.BooleanField(default=True, db_index=True)
    is_deleted = models.BooleanField(default=False, db_index=True, editable=False)
    deleted_at = models.DateTimeField(null=True, blank=True, editable=False)

    class Meta:
        abstract = True
        ordering = ["-created_at"]

    def soft_delete(self) -> None:
        """Mark as deleted without removing the row (reversible)."""
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=["is_deleted", "deleted_at"])

    def restore(self) -> None:
        """Re-activate a soft-deleted record."""
        self.is_deleted = False
        self.deleted_at = None
        self.save(update_fields=["is_deleted", "deleted_at"])


class SluggedNamedModel(BaseModel):
    """Multilingual name + unique slug for taxonomy entities
    (categories, tags, technologies).

    ``title_en`` is the canonical/required name; ``title_fa`` and
    ``title_ar`` are optional translations already present in the schema,
    which makes future automatic multilingual content ready with no schema
    migration.
    """

    title_fa = models.CharField(max_length=255, blank=True)
    title_en = models.CharField(max_length=255)
    title_ar = models.CharField(max_length=255, blank=True)
    slug = models.SlugField(
        max_length=255,
        unique=True,
        allow_unicode=True,
        help_text="URL identifier; Unicode (Arabic/Persian) characters are allowed.",
    )
    sort_order = models.PositiveIntegerField(default=0, db_index=True)

    class Meta:
        abstract = True
        ordering = ["sort_order", "title_en"]


class PublishableModel(SluggedNamedModel):
    """Base for every publishable content entity.

    Provides the complete multilingual publishing surface required by the
    platform:

    - three-language ``title`` / ``short_description`` / ``description``,
    - publishing ``status`` (Draft/Review/Published/Archived),
    - discovery flags (``is_featured``, ``is_public``),
    - ordering (``sort_order``),
    - search/SEO fields (meta tags, canonical URL, OpenGraph image).
    """

    # Multilingual content ---------------------------------------------------
    short_description_fa = models.TextField(blank=True)
    short_description_en = models.TextField(blank=True)
    short_description_ar = models.TextField(blank=True)
    description_fa = models.TextField(blank=True)
    description_en = models.TextField(blank=True)
    description_ar = models.TextField(blank=True)

    # Publishing -------------------------------------------------------------
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
        db_index=True,
    )
    is_featured = models.BooleanField(default=False, db_index=True)
    is_public = models.BooleanField(default=True, db_index=True)
    published_at = models.DateTimeField(null=True, blank=True, db_index=True)

    # SEO --------------------------------------------------------------------
    meta_title = models.CharField(
        max_length=70, blank=True, help_text="Recommended length: 60 characters."
    )
    meta_description = models.CharField(
        max_length=160, blank=True, help_text="Recommended length: 155 characters."
    )
    meta_keywords = models.CharField(max_length=255, blank=True)
    canonical_url = models.URLField(max_length=500, blank=True)
    og_image = models.ForeignKey(
        "media_library.MediaFile",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="%(class)s_og_images",
        help_text="OpenGraph sharing image.",
    )

    class Meta:
        abstract = True
        ordering = ["sort_order", "title_en"]
