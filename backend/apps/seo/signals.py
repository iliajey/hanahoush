"""Sitemap cache invalidation (Phase 8H).

Whenever published content changes (save or delete) the generated sitemap is
rebuilt on its next request. Kept deliberately simple: a single cache key with
a short TTL, busted on any post_save/post_delete of the sitemap's sources.

The module is imported from ``apps.seo.apps.SeoConfig.ready()`` so receivers
connect exactly once per process.
"""
from django.core.cache import cache
from django.db.models.signals import post_delete, post_save

SITEMAP_CACHE_KEY = "sitemap:xml"


def invalidate_sitemap(sender, instance, **kwargs):  # noqa: ARG001
    cache.delete(SITEMAP_CACHE_KEY)


# Imports stay inside ``ready()`` below; receivers are registered once when
# Django populates the app registry.
def connect() -> None:
    from apps.articles.models import Article
    from apps.page_builder.models import Page
    from apps.projects.models import Project
    from apps.services.models import Service

    for model in (Article, Project, Service, Page):
        post_save.connect(invalidate_sitemap, sender=model, weak=False)
        post_delete.connect(invalidate_sitemap, sender=model, weak=False)
