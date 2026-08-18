"""SEO infrastructure app (Phase 8H).

Serves ``/sitemap.xml`` and ``/robots.txt`` directly from published content so
crawlers see exactly what the CMS publishes. The sitemap is cached for a short
TTL and invalidated by signals whenever a publishable entity (Article, Project,
Service, Page) changes.
"""
