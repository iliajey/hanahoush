"""Media library.

Centralized, normalized asset storage used by every content app
(articles, projects, services, company pages) via ForeignKey references,
instead of each app storing its own copy of the file path.
"""
from django.db import models

from apps.core.models import BaseModel


class MediaFile(BaseModel):
    """A single uploaded binary asset with multilingual metadata.

    Normalization:
    - The binary lives in ``file``; apps reference ``MediaFile`` by FK,
      so the same asset is never duplicated on disk.
    - ``sha256`` enables content-based deduplication at upload time.
    - ``alt_text_*`` / ``caption_*`` provide multilingual metadata for
      accessibility and SEO.
    - ``width``/``height`` are stored for image variants without re-reading
      the file (ERP/thumbnail generation readiness).
    """

    file = models.FileField(upload_to="media/%Y/%m/")
    original_name = models.CharField(max_length=500, blank=True)
    title_fa = models.CharField(max_length=255, blank=True)
    title_en = models.CharField(max_length=255, blank=True)
    title_ar = models.CharField(max_length=255, blank=True)
    alt_text_fa = models.CharField(max_length=255, blank=True)
    alt_text_en = models.CharField(max_length=255, blank=True)
    alt_text_ar = models.CharField(max_length=255, blank=True)
    caption_fa = models.TextField(blank=True)
    caption_en = models.TextField(blank=True)
    caption_ar = models.TextField(blank=True)
    mime_type = models.CharField(max_length=100, blank=True)
    size = models.PositiveBigIntegerField(default=0, help_text="File size in bytes.")
    width = models.PositiveIntegerField(null=True, blank=True, editable=False)
    height = models.PositiveIntegerField(null=True, blank=True, editable=False)
    sha256 = models.CharField(max_length=64, blank=True, db_index=True)
    is_public = models.BooleanField(default=True, db_index=True)

    class Meta:
        verbose_name = "Media file"
        verbose_name_plural = "Media files"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.original_name or self.file.name

    @property
    def reference_count(self) -> int:
        """Count of known content references (usage awareness for safe deletion)."""
        from apps.articles.models import Article
        from apps.company.models import AboutPage, Partner, TeamMember, Testimonial
        from apps.page_builder.models import SEOConfiguration
        from apps.projects.models import Project, ProjectImage
        from apps.services.models import Service, ServiceSection

        count = 0
        for qs, _field in (
            (Article.objects.filter(cover_image_id=self.pk), "cover_image"),
            (Article.objects.filter(og_image_id=self.pk), "og_image"),
            (Project.objects.filter(cover_image_id=self.pk), "cover_image"),
            (Project.objects.filter(og_image_id=self.pk), "og_image"),
            (ProjectImage.objects.filter(image_id=self.pk), "image"),
            (Service.objects.filter(cover_image_id=self.pk), "cover_image"),
            (ServiceSection.objects.filter(cover_image_id=self.pk), "cover_image"),
            (AboutPage.objects.filter(hero_image_id=self.pk), "hero_image"),
            (TeamMember.objects.filter(avatar_id=self.pk), "avatar"),
            (Partner.objects.filter(logo_id=self.pk), "logo"),
            (Testimonial.objects.filter(avatar_id=self.pk), "avatar"),
            (SEOConfiguration.objects.filter(og_image_id=self.pk), "og_image"),
        ):
            count += qs.count()
        return count
