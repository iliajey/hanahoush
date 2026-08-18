"""Page Builder domain.

The page-builder powers the Enterprise Dynamic Page Composition Engine: every
public page is assembled from ordered, configurable sections instead of a
hardcoded frontend layout.

Normalization decisions:
- ``Page`` is the top-level entity (slug, localized title, publishing status,
  versioning, soft delete). Its section list is normalized into
  ``PageSection`` rows rather than a JSON blob, so ordering/enable state are
  real columns and admin drag-and-drop (adminsortable2) works.
- ``PageSection`` carries a ``config`` JSONField plus per-locale
  ``language_overrides`` — copy-heavy sections (hero, CTA, ERP) keep their
  fa/en/ar text as nested objects inside ``config`` and are resolved by the
  API at request time via ``Accept-Language``.
- ``SectionConfiguration`` is the DB-backed registry of available section
  types (name, description, default config). It drives the admin picker, the
  ``/api/v1/page-builder/`` endpoint and the frontend registry docs.
- Site chrome (navigation/footer/announcement/hero/seo/redirects) are first-class
  models so nothing about a page's surroundings is hardcoded on the client.
"""
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone

from apps.core.models import BaseModel, Status

# ---------------------------------------------------------------------------
# Section registry
# ---------------------------------------------------------------------------
SECTION_TYPES = [
    ("hero", "Hero"),
    ("statistics", "Statistics"),
    ("services", "Services"),
    ("erp", "ERP (hanRP)"),
    ("projects", "Projects"),
    ("articles", "Articles"),
    ("about", "About"),
    ("team", "Team"),
    ("timeline", "Timeline"),
    ("partners", "Partners"),
    ("testimonials", "Testimonials"),
    ("faq", "FAQ"),
    ("cta", "CTA"),
    ("footer", "Footer"),
    ("journey", "Service Journey"),
    ("comparison", "Comparison"),
    ("stack", "Technology Stack"),
    ("process", "Process"),
    ("featured_projects", "Featured Projects"),
    ("project_filters", "Project Discovery"),
    ("technology_explorer", "Technology Explorer"),
    ("projects_timeline", "Project Timeline"),
    ("case_hero", "Case Study Hero"),
    ("case_challenge", "Case Study Challenge"),
    ("case_objectives", "Case Study Objectives"),
    ("case_solution", "Case Study Solution"),
    ("case_architecture", "Case Study Architecture"),
    ("case_technology", "Case Study Technology"),
    ("case_journey", "Case Study Journey"),
    ("case_gallery", "Case Study Gallery"),
    ("case_results", "Case Study Results"),
    ("case_related_projects", "Case Study Related Projects"),
    ("case_related_articles", "Case Study Related Articles"),
    ("case_cta", "Case Study CTA"),
    ("articles_hero", "Articles Hero"),
    ("featured_article", "Featured Article"),
    ("latest_articles", "Latest Articles"),
    ("article_filters", "Article Discovery"),
    ("category_explorer", "Category Explorer"),
    ("tag_explorer", "Tag Explorer"),
    ("newsletter_cta", "Newsletter CTA"),
    ("article_cta", "Article CTA"),
    ("article_hero", "Article Hero"),
    ("article_content", "Article Content"),
    ("article_related", "Article Related Content"),
    ("company_story", "Company Story"),
    ("values", "Company Values"),
    ("offices", "Offices"),
    ("social_links", "Social Links"),
    ("contact_form", "Contact Form"),
]

SECTION_TYPE_CHOICES = [(code, label) for code, label in SECTION_TYPES]
SECTION_TYPE_LOOKUP = dict(SECTION_TYPES)


class Page(BaseModel):
    """A composed page (e.g. the landing page) with an ordered section list."""

    title_fa = models.CharField(max_length=255, blank=True)
    title_en = models.CharField(max_length=255)
    title_ar = models.CharField(max_length=255, blank=True)
    slug = models.SlugField(max_length=255, unique=True, allow_unicode=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
        db_index=True,
    )
    is_home = models.BooleanField(default=False, db_index=True)
    template = models.CharField(max_length=100, default="default")
    version = models.PositiveIntegerField(
        default=1,
        help_text="Increments on every published change.",
    )
    version_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp of the current version.",
    )
    sort_order = models.PositiveIntegerField(default=0, db_index=True)

    class Meta:
        verbose_name = "Page"
        verbose_name_plural = "Pages"
        ordering = ["-is_home", "sort_order", "title_en"]

    def __str__(self) -> str:
        return self.title_en

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        if not is_new:
            previous = Page.objects.filter(pk=self.pk).first()
            if previous and previous.status != self.status and self.status == Status.PUBLISHED:
                self.version = previous.version + 1
                self.version_at = timezone.now()
        if is_new:
            self.version_at = timezone.now()
        super().save(*args, **kwargs)


class PageSection(BaseModel):
    """A single section within a page (ordered, enable/disable, JSON config)."""

    page = models.ForeignKey(Page, on_delete=models.CASCADE, related_name="sections")
    section_type = models.CharField(max_length=50, choices=SECTION_TYPE_CHOICES, db_index=True)
    title_fa = models.CharField(max_length=255, blank=True)
    title_en = models.CharField(max_length=255, blank=True)
    title_ar = models.CharField(max_length=255, blank=True)
    sort_order = models.PositiveIntegerField(default=0, db_index=True)
    is_enabled = models.BooleanField(default=True, db_index=True)
    config = models.JSONField(
        default=dict,
        blank=True,
        help_text="Section configuration (may hold localized values).",
    )
    language_overrides = models.JSONField(
        default=dict,
        blank=True,
        help_text='Per-locale overrides, e.g. {"fa": {"headline": "..."}, "en": {...}}.',
    )

    class Meta:
        verbose_name = "Page section"
        verbose_name_plural = "Page sections"
        ordering = ["sort_order", "id"]
        constraints = [
            models.UniqueConstraint(
                fields=["page", "section_type"],
                name="pb_page_section_type_unique",
            )
        ]

    def clean(self):
        if self.section_type not in SECTION_TYPE_LOOKUP:
            raise ValidationError({"section_type": f"Unknown section type: {self.section_type}"})

    def __str__(self) -> str:
        return f"{self.page} — {self.get_section_type_display()}"


class SectionConfiguration(BaseModel):
    """DB registry of available section types + default configuration."""

    section_type = models.CharField(max_length=50, unique=True, choices=SECTION_TYPE_CHOICES)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=100, blank=True)
    default_config = models.JSONField(default=dict, blank=True)
    available_locales = models.JSONField(
        default=list,
        blank=True,
        help_text='e.g. ["fa", "en", "ar"]',
    )

    class Meta:
        verbose_name = "Section configuration"
        verbose_name_plural = "Section configurations"
        ordering = ["section_type"]

    def __str__(self) -> str:
        return self.name


class NavigationMenu(BaseModel):
    """A named, ordered set of navigation items (e.g. the main menu)."""

    name = models.CharField(max_length=100)
    code = models.SlugField(max_length=100, unique=True)
    is_default = models.BooleanField(default=False, db_index=True)
    settings = models.JSONField(
        default=dict,
        blank=True,
        help_text="e.g. sticky, transparent, background.",
    )
    description = models.TextField(blank=True)

    class Meta:
        verbose_name = "Navigation menu"
        verbose_name_plural = "Navigation menus"
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class NavigationItem(BaseModel):
    """A single navigation entry (supports dropdowns via parent)."""

    menu = models.ForeignKey(NavigationMenu, on_delete=models.CASCADE, related_name="items")
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="children",
    )
    label_fa = models.CharField(max_length=255, blank=True)
    label_en = models.CharField(max_length=255)
    label_ar = models.CharField(max_length=255, blank=True)
    url = models.CharField(
        max_length=500,
        blank=True,
        help_text="Absolute path or full URL.",
    )
    page = models.ForeignKey(
        Page,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="nav_items",
    )
    sort_order = models.PositiveIntegerField(default=0, db_index=True)
    is_enabled = models.BooleanField(default=True, db_index=True)
    is_highlight = models.BooleanField(default=False, help_text="Render as a primary CTA button.")

    class Meta:
        verbose_name = "Navigation item"
        verbose_name_plural = "Navigation items"
        ordering = ["sort_order", "id"]

    def __str__(self) -> str:
        return self.label_en or self.url


class FooterConfiguration(BaseModel):
    """Singleton footer configuration (columns + chrome toggles)."""

    copyright_fa = models.CharField(max_length=500, blank=True)
    copyright_en = models.CharField(max_length=500, blank=True)
    copyright_ar = models.CharField(max_length=500, blank=True)
    show_socials = models.BooleanField(default=True)
    show_newsletter = models.BooleanField(default=False)
    newsletter_label = models.CharField(max_length=255, blank=True)
    columns = models.JSONField(
        default=list,
        blank=True,
        help_text='[{ "title": {...|string}, "links": [{"label": "...", "href": "/..."}] }]',
    )

    class Meta:
        verbose_name = "Footer configuration"
        verbose_name_plural = "Footer configuration"

    def __str__(self) -> str:
        return "Footer configuration"

    @classmethod
    def get_config(cls) -> "FooterConfiguration":
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class AnnouncementBar(BaseModel):
    """Singleton announcement bar (top of every page)."""

    text_fa = models.CharField(max_length=500, blank=True)
    text_en = models.CharField(max_length=500, blank=True)
    text_ar = models.CharField(max_length=500, blank=True)
    link = models.URLField(max_length=500, blank=True)
    link_label_fa = models.CharField(max_length=255, blank=True)
    link_label_en = models.CharField(max_length=255, blank=True)
    link_label_ar = models.CharField(max_length=255, blank=True)
    is_enabled = models.BooleanField(default=False, db_index=True)
    dismissible = models.BooleanField(default=True)
    start_at = models.DateTimeField(null=True, blank=True)
    end_at = models.DateTimeField(null=True, blank=True)
    background_color = models.CharField(max_length=50, default="brand")
    text_color = models.CharField(max_length=50, default="white")

    class Meta:
        verbose_name = "Announcement bar"
        verbose_name_plural = "Announcement bar"

    def __str__(self) -> str:
        return self.text_en or "Announcement bar"

    @classmethod
    def get_bar(cls) -> "AnnouncementBar":
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class HeroConfiguration(BaseModel):
    """Singleton default hero copy used by the Hero section."""

    headline_fa = models.CharField(max_length=255, blank=True)
    headline_en = models.CharField(max_length=255, blank=True)
    headline_ar = models.CharField(max_length=255, blank=True)
    subtitle_fa = models.TextField(blank=True)
    subtitle_en = models.TextField(blank=True)
    subtitle_ar = models.TextField(blank=True)
    primary_cta_label_fa = models.CharField(max_length=100, blank=True)
    primary_cta_label_en = models.CharField(max_length=100, blank=True)
    primary_cta_label_ar = models.CharField(max_length=100, blank=True)
    primary_cta_url = models.CharField(max_length=500, default="/contact")
    secondary_cta_label_fa = models.CharField(max_length=100, blank=True)
    secondary_cta_label_en = models.CharField(max_length=100, blank=True)
    secondary_cta_label_ar = models.CharField(max_length=100, blank=True)
    secondary_cta_url = models.CharField(max_length=500, default="/services")
    align = models.CharField(
        max_length=20,
        choices=[("center", "Center"), ("start", "Start")],
        default="center",
    )
    show_grid = models.BooleanField(default=True)
    show_mesh = models.BooleanField(default=True)
    show_particles = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Hero configuration"
        verbose_name_plural = "Hero configuration"

    def __str__(self) -> str:
        return "Hero configuration"

    @classmethod
    def get_config(cls) -> "HeroConfiguration":
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class SEOConfiguration(BaseModel):
    """Site-wide default SEO (page=None) or per-page SEO (OneToOne to Page)."""

    page = models.OneToOneField(
        Page,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="seo",
        help_text="Leave empty for the site-wide default.",
    )
    meta_title_fa = models.CharField(max_length=70, blank=True)
    meta_title_en = models.CharField(max_length=70, blank=True)
    meta_title_ar = models.CharField(max_length=70, blank=True)
    meta_description_fa = models.CharField(max_length=200, blank=True)
    meta_description_en = models.CharField(max_length=200, blank=True)
    meta_description_ar = models.CharField(max_length=200, blank=True)
    meta_keywords = models.CharField(max_length=255, blank=True)
    canonical_url = models.URLField(max_length=500, blank=True)
    robots = models.CharField(max_length=100, default="index,follow")
    og_image = models.ForeignKey(
        "media_library.MediaFile",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="page_builder_seo",
    )

    class Meta:
        verbose_name = "SEO configuration"
        verbose_name_plural = "SEO configurations"

    def __str__(self) -> str:
        return f"SEO — {self.page.title_en if self.page else 'site default'}"

    @classmethod
    def get_default(cls) -> "SEOConfiguration":
        obj, _ = cls.objects.get_or_create(
            page__isnull=True,
            defaults={},
        )
        return obj


class RedirectRule(BaseModel):
    """URL redirect rule (used by middleware / edge)."""

    source = models.CharField(
        max_length=500,
        unique=True,
        help_text="Path to match, e.g. /old-page/",
    )
    target = models.CharField(max_length=500, help_text="Destination path or URL.")
    status_code = models.PositiveSmallIntegerField(
        choices=[(301, "301 Permanent"), (302, "302 Temporary")],
        default=301,
    )
    is_enabled = models.BooleanField(default=True, db_index=True)
    sort_order = models.PositiveIntegerField(default=0, db_index=True)

    class Meta:
        verbose_name = "Redirect rule"
        verbose_name_plural = "Redirect rules"
        ordering = ["sort_order", "source"]

    def __str__(self) -> str:
        return f"{self.source} → {self.target}"


class NewsletterSubscription(BaseModel):
    """A newsletter subscriber (single source of truth — no parallel system)."""

    email = models.EmailField(unique=True, db_index=True)
    locale = models.CharField(
        max_length=5,
        choices=[("fa", "Persian"), ("en", "English"), ("ar", "Arabic")],
        default="en",
    )
    source = models.CharField(max_length=100, blank=True, help_text="Where the signup happened (e.g. articles-newsletter).")
    unsubscribe_token = models.CharField(max_length=64, blank=True, db_index=True, default="", help_text="One-click unsubscribe token.")
    unsubscribed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Newsletter subscription"
        verbose_name_plural = "Newsletter subscriptions"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.email

    @property
    def is_subscribed(self) -> bool:
        return self.unsubscribed_at is None and self.is_active

    def unsubscribe(self) -> None:
        from django.utils import timezone

        self.unsubscribed_at = timezone.now()
        self.is_active = False
        self.save(update_fields=["unsubscribed_at", "is_active", "updated_at"])
