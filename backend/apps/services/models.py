"""Services domain.

Normalization:
- ``ServiceSection`` is the top-level grouping of the services page
  (e.g. "Software development", "Digital marketing"). It carries a
  multilingual name, slug and description.
- ``Service`` is the publishable entity (full multilingual publishing +
  SEO surface from the core base) and belongs to exactly one section via FK.
"""
from django.db import models

from apps.core.models import PublishableModel, SluggedNamedModel


class ServiceSection(SluggedNamedModel):
    """A top-level grouping of services on the services page."""

    description_fa = models.TextField(blank=True)
    description_en = models.TextField(blank=True)
    description_ar = models.TextField(blank=True)
    icon = models.CharField(max_length=255, blank=True)
    cover_image = models.ForeignKey(
        "media_library.MediaFile",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="service_section_covers",
    )

    class Meta:
        verbose_name = "Service section"
        verbose_name_plural = "Service sections"
        ordering = ["sort_order", "title_en"]

    def __str__(self) -> str:
        return self.title_en


class Service(PublishableModel):
    """A publishable service offer."""

    section = models.ForeignKey(
        ServiceSection,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="services",
    )
    icon = models.CharField(max_length=255, blank=True)
    cover_image = models.ForeignKey(
        "media_library.MediaFile",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="service_covers",
    )

    class Meta:
        verbose_name = "Service"
        verbose_name_plural = "Services"
        ordering = ["sort_order", "title_en"]
        indexes = [
            models.Index(fields=["status", "is_public", "published_at"], name="service_pub_idx"),
            models.Index(fields=["section", "status"], name="service_section_status_idx"),
        ]

    def __str__(self) -> str:
        return self.title_en
