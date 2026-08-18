"""Company domain: about page, team, partners, testimonials, FAQ, timeline,
social links, offices and global site settings.

Normalization decisions:
- Long-form/translatable text (bio, mission, FAQ answers, ...) is stored as
  dedicated ``*_fa`` / ``*_en`` / ``*_ar`` columns, keeping the schema simple
  and indexable. A row-based translation table is deliberately NOT used yet
  (see report — future ERP/multilingual strategy).
- Media (avatars, logos, hero images) are references to ``MediaFile``, never
  duplicated file paths.
- ``SiteSettings`` is a singleton model (one row) read via ``get_settings()``.
"""
from django.db import models

from apps.core.models import BaseModel, PublishableModel


class AboutPage(PublishableModel):
    """Single about-us page (publishable, singleton in practice)."""

    hero_image = models.ForeignKey(
        "media_library.MediaFile",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="about_hero_images",
    )
    mission_fa = models.TextField(blank=True)
    mission_en = models.TextField(blank=True)
    mission_ar = models.TextField(blank=True)
    vision_fa = models.TextField(blank=True)
    vision_en = models.TextField(blank=True)
    vision_ar = models.TextField(blank=True)

    class Meta:
        verbose_name = "About page"
        verbose_name_plural = "About pages"
        ordering = ["-updated_at"]

    def __str__(self) -> str:
        return self.title_en or "About"


class TeamMember(BaseModel):
    """A member of the team shown on the about page."""

    name = models.CharField(max_length=255)
    position_fa = models.CharField(max_length=255, blank=True)
    position_en = models.CharField(max_length=255, blank=True)
    position_ar = models.CharField(max_length=255, blank=True)
    bio_fa = models.TextField(blank=True)
    bio_en = models.TextField(blank=True)
    bio_ar = models.TextField(blank=True)
    avatar = models.ForeignKey(
        "media_library.MediaFile",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="team_avatars",
    )
    email = models.EmailField(blank=True)
    linkedin_url = models.URLField(blank=True)
    sort_order = models.PositiveIntegerField(default=0, db_index=True)

    class Meta:
        verbose_name = "Team member"
        verbose_name_plural = "Team members"
        ordering = ["sort_order", "name"]

    def __str__(self) -> str:
        return self.name


class Partner(BaseModel):
    """A partner/affiliate company."""

    name = models.CharField(max_length=255)
    logo = models.ForeignKey(
        "media_library.MediaFile",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="partner_logos",
    )
    website = models.URLField(blank=True)
    description_fa = models.TextField(blank=True)
    description_en = models.TextField(blank=True)
    description_ar = models.TextField(blank=True)
    sort_order = models.PositiveIntegerField(default=0, db_index=True)

    class Meta:
        verbose_name = "Partner"
        verbose_name_plural = "Partners"
        ordering = ["sort_order", "name"]

    def __str__(self) -> str:
        return self.name


class Testimonial(BaseModel):
    """A client/partner testimonial."""

    author_name = models.CharField(max_length=255)
    author_role = models.CharField(max_length=255, blank=True)
    company = models.CharField(max_length=255, blank=True)
    content_fa = models.TextField()
    content_en = models.TextField()
    content_ar = models.TextField(blank=True)
    rating = models.PositiveSmallIntegerField(default=5)
    avatar = models.ForeignKey(
        "media_library.MediaFile",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="testimonial_avatars",
    )
    is_featured = models.BooleanField(default=False, db_index=True)
    sort_order = models.PositiveIntegerField(default=0, db_index=True)

    class Meta:
        verbose_name = "Testimonial"
        verbose_name_plural = "Testimonials"
        ordering = ["sort_order", "author_name"]

    def __str__(self) -> str:
        return self.author_name


class FAQ(BaseModel):
    """A single FAQ entry (multilingual Q & A)."""

    question_fa = models.CharField(max_length=500, blank=True)
    question_en = models.CharField(max_length=500)
    question_ar = models.CharField(max_length=500, blank=True)
    answer_fa = models.TextField(blank=True)
    answer_en = models.TextField()
    answer_ar = models.TextField(blank=True)
    category = models.CharField(max_length=255, blank=True)
    is_featured = models.BooleanField(default=False, db_index=True)
    sort_order = models.PositiveIntegerField(default=0, db_index=True)

    class Meta:
        verbose_name = "FAQ"
        verbose_name_plural = "FAQs"
        ordering = ["sort_order", "id"]

    def __str__(self) -> str:
        return self.question_en or self.question_fa or f"FAQ #{self.pk}"


class Timeline(BaseModel):
    """A company milestone / history entry."""

    title_fa = models.CharField(max_length=255, blank=True)
    title_en = models.CharField(max_length=255)
    title_ar = models.CharField(max_length=255, blank=True)
    content_fa = models.TextField(blank=True)
    content_en = models.TextField(blank=True)
    content_ar = models.TextField(blank=True)
    date = models.DateField(null=True, blank=True)
    icon = models.CharField(max_length=255, blank=True)
    sort_order = models.PositiveIntegerField(default=0, db_index=True)

    class Meta:
        verbose_name = "Timeline entry"
        verbose_name_plural = "Timeline entries"
        ordering = ["date", "sort_order"]

    def __str__(self) -> str:
        return self.title_en or f"Timeline #{self.pk}"


class SocialLink(BaseModel):
    """A social-media / external profile link."""

    PLATFORM_CHOICES = [
        ("instagram", "Instagram"),
        ("telegram", "Telegram"),
        ("linkedin", "LinkedIn"),
        ("x", "X (Twitter)"),
        ("youtube", "YouTube"),
        ("github", "GitHub"),
        ("website", "Website"),
        ("whatsapp", "WhatsApp"),
        ("other", "Other"),
    ]

    platform = models.CharField(max_length=50, choices=PLATFORM_CHOICES)
    label = models.CharField(max_length=255, blank=True)
    url = models.URLField(max_length=500)
    icon = models.CharField(max_length=255, blank=True)
    sort_order = models.PositiveIntegerField(default=0, db_index=True)

    class Meta:
        verbose_name = "Social link"
        verbose_name_plural = "Social links"
        ordering = ["sort_order", "id"]

    def __str__(self) -> str:
        return f"{self.get_platform_display()} — {self.url}"


class Office(BaseModel):
    """A physical office location."""

    name = models.CharField(max_length=255)
    address_fa = models.TextField(blank=True)
    address_en = models.TextField(blank=True)
    address_ar = models.TextField(blank=True)
    city = models.CharField(max_length=255, blank=True)
    country = models.CharField(max_length=255, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    map_embed_url = models.URLField(max_length=1000, blank=True)
    is_headquarters = models.BooleanField(default=False)
    sort_order = models.PositiveIntegerField(default=0, db_index=True)

    class Meta:
        verbose_name = "Office"
        verbose_name_plural = "Offices"
        ordering = ["sort_order", "name"]

    def __str__(self) -> str:
        return self.name


class SiteSettings(BaseModel):
    """Global site-wide settings. Designed as a singleton (one row)."""

    site_name = models.CharField(max_length=255)
    tagline_fa = models.CharField(max_length=255, blank=True)
    tagline_en = models.CharField(max_length=255, blank=True)
    tagline_ar = models.CharField(max_length=255, blank=True)
    logo = models.ForeignKey(
        "media_library.MediaFile",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="site_logo",
    )
    favicon = models.ForeignKey(
        "media_library.MediaFile",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="site_favicon",
    )
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=20, blank=True)
    address_fa = models.TextField(blank=True)
    address_en = models.TextField(blank=True)
    address_ar = models.TextField(blank=True)
    default_locale = models.CharField(
        max_length=5,
        choices=[("fa", "Persian"), ("en", "English"), ("ar", "Arabic")],
        default="fa",
    )
    supported_locales = models.JSONField(default=list, blank=True, help_text='e.g. ["fa", "en", "ar"]')
    maintenance_mode = models.BooleanField(default=False)
    meta_title = models.CharField(max_length=70, blank=True)
    meta_description = models.CharField(max_length=160, blank=True)
    analytics_code = models.TextField(blank=True, help_text="Analytics snippet (e.g. GA4).")

    class Meta:
        verbose_name = "Site settings"
        verbose_name_plural = "Site settings"
        ordering = ["-updated_at"]

    def __str__(self) -> str:
        return self.site_name

    @classmethod
    def get_settings(cls) -> "SiteSettings":
        """Return the singleton settings instance (creates it lazily)."""
        obj, _created = cls.objects.get_or_create(
            pk=1,
            defaults={"site_name": "Hanahoush"},
        )
        return obj
