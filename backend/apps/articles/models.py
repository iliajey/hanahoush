"""Articles domain: blog / knowledge-base content.

Normalization decisions:
- ``Category`` may nest via ``parent`` (self FK), which is preferable to a
  denormalized path/level column for small-to-medium trees.
- ``Tag`` is a standalone taxonomy shared by many articles (M2M).
- ``Article`` keeps the URL slug and byline ``author`` separate from the
  system audit fields (``created_by``/``updated_by``) — the author is the
  published byline, the audit fields record who operated on the row.
- Content translations (title/short_description/description) and SEO live on
  the publishable base model in ``apps.core``.
"""
from django.conf import settings
from django.db import models

from apps.core.models import PublishableModel, SluggedNamedModel


class Category(SluggedNamedModel):
    """Hierarchical article taxonomy."""

    parent = models.ForeignKey(
        "self",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="children",
        help_text="Parent category for nesting.",
    )
    description_fa = models.TextField(blank=True)
    description_en = models.TextField(blank=True)
    description_ar = models.TextField(blank=True)

    class Meta:
        verbose_name = "Category"
        verbose_name_plural = "Categories"
        ordering = ["sort_order", "title_en"]

    def __str__(self) -> str:
        return self.title_en


class Tag(SluggedNamedModel):
    """Free-form article tag."""

    class Meta:
        verbose_name = "Tag"
        verbose_name_plural = "Tags"
        ordering = ["title_en"]

    def __str__(self) -> str:
        return self.title_en


class Article(PublishableModel):
    """A publishable article."""

    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="articles",
    )
    tags = models.ManyToManyField(Tag, blank=True, related_name="articles")
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="articles",
        help_text="Published byline (may differ from created_by).",
    )
    cover_image = models.ForeignKey(
        "media_library.MediaFile",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="article_covers",
    )
    is_pinned = models.BooleanField(default=False, db_index=True)

    class Meta:
        verbose_name = "Article"
        verbose_name_plural = "Articles"
        ordering = ["-published_at", "-created_at"]
        indexes = [
            models.Index(fields=["status", "is_public", "published_at"], name="article_pub_idx"),
            models.Index(fields=["category", "status"], name="article_cat_status_idx"),
        ]

    def __str__(self) -> str:
        return self.title_en
