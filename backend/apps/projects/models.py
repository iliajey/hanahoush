"""Projects domain: portfolio / delivered work.

Normalization decisions:
- ``ProjectCategory`` may nest (self FK) — same pattern as articles.
- ``Technology`` is a shared taxonomy (M2M to ``Project``) so a stack is
  described once and reused across projects.
- A project has one ``cover_image`` (FK → MediaFile) plus a normalized
  gallery via ``ProjectImage`` (1-N), instead of a denormalized list of
  paths — each image row carries its own sort order and alt text.
"""
from django.db import models

from apps.core.models import BaseModel, PublishableModel, SluggedNamedModel


class ProjectCategory(SluggedNamedModel):
    """Hierarchical project taxonomy."""

    parent = models.ForeignKey(
        "self",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="children",
    )

    class Meta:
        verbose_name = "Project category"
        verbose_name_plural = "Project categories"
        ordering = ["sort_order", "title_en"]

    def __str__(self) -> str:
        return self.title_en


class Technology(SluggedNamedModel):
    """A technology / stack used by one or many projects."""

    icon = models.CharField(
        max_length=255,
        blank=True,
        help_text="Icon identifier (e.g. SVG sprite key) — UI-level only.",
    )
    website = models.URLField(blank=True)

    class Meta:
        verbose_name = "Technology"
        verbose_name_plural = "Technologies"
        ordering = ["sort_order", "title_en"]

    def __str__(self) -> str:
        return self.title_en


class Project(PublishableModel):
    """A deliverable showcased in the portfolio."""

    category = models.ForeignKey(
        ProjectCategory,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="projects",
    )
    technologies = models.ManyToManyField(
        Technology,
        blank=True,
        related_name="projects",
    )
    client = models.CharField(max_length=255, blank=True)
    location = models.CharField(max_length=255, blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    live_url = models.URLField(blank=True)
    cover_image = models.ForeignKey(
        "media_library.MediaFile",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="project_covers",
    )
    case_study = models.JSONField(
        default=dict,
        blank=True,
        help_text=(
            "Structured case-study content (may hold localized values): "
            "challenge, objectives, solution_approach, architecture, "
            "implementation_stages, results. Each value may be a localized "
            "object {'fa': ..., 'en': ..., 'ar': ...}."
        ),
    )

    class Meta:
        verbose_name = "Project"
        verbose_name_plural = "Projects"
        ordering = ["-end_date", "-created_at"]
        indexes = [
            models.Index(fields=["status", "is_public", "published_at"], name="project_pub_idx"),
            models.Index(fields=["category", "status"], name="project_cat_status_idx"),
        ]

    def __str__(self) -> str:
        return self.title_en


class ProjectImage(BaseModel):
    """Normalized project gallery entry."""

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="images",
    )
    image = models.ForeignKey(
        "media_library.MediaFile",
        on_delete=models.PROTECT,
        related_name="project_images",
    )
    alt_text_fa = models.CharField(max_length=255, blank=True)
    alt_text_en = models.CharField(max_length=255, blank=True)
    alt_text_ar = models.CharField(max_length=255, blank=True)
    sort_order = models.PositiveIntegerField(default=0, db_index=True)
    is_cover = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Project image"
        verbose_name_plural = "Project images"
        ordering = ["sort_order", "id"]

    def __str__(self) -> str:
        return f"{self.project} — image #{self.pk}"
