from django.apps import AppConfig


class SeoConfig(AppConfig):
    name = "apps.seo"
    verbose_name = "SEO"

    def ready(self):
        # Wire sitemap-cache invalidation on published-content changes.
        from . import signals  # noqa: F401

        signals.connect()
