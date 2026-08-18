"""Sitemap and robots.txt endpoints (Phase 8H).

Sitemap content comes from the database (published pages, articles, projects
and public services only) so crawlers see exactly what the CMS publishes —
never drafts, archived or scheduled content. The sitemap is cached for a short
TTL and invalidated by signals when published content changes.

Note on locale alternates: the frontend is a locale-less SPA (language is
stored client-side, not in the URL), so per-language URLs are not served and
hreflang alternates are intentionally omitted — every entry is a single
canonical URL. This matches the ``useSeoMeta`` behaviour on the client.
"""
import xml.etree.ElementTree as ET

from django.conf import settings
from django.core.cache import cache
from django.http import HttpResponse

from apps.core.models import Status
from apps.seo.signals import SITEMAP_CACHE_KEY

SITEMAP_TTL = 300  # seconds


def _loc(path: str) -> str:
    site_url = getattr(settings, "SITE_URL", "").rstrip("/")
    return f"{site_url}{path}"


def _url_entry(builder, loc: str, lastmod=None, changefreq=None, priority=None) -> None:
    url = ET.SubElement(builder, "url")
    ET.SubElement(url, "loc").text = loc
    if lastmod:
        ET.SubElement(url, "lastmod").text = lastmod.isoformat()
    if changefreq:
        ET.SubElement(url, "changefreq").text = changefreq
    if priority is not None:
        ET.SubElement(url, "priority").text = f"{priority:.1f}"


def _build_sitemap_xml() -> str:
    root = ET.Element("urlset")
    root.set("xmlns", "http://www.sitemaps.org/schemas/sitemap/0.9")

    from apps.articles.models import Article
    from apps.page_builder.models import Page
    from apps.projects.models import Project
    from apps.services.models import Service

    # Published pages (includes /, /about, /contact, /services, /projects, /articles).
    for page in (
        Page.objects.filter(status=Status.PUBLISHED, is_active=True, is_deleted=False)
        .order_by("-is_home", "sort_order")
        .only("slug", "updated_at")
    ):
        path = "/" if page.slug == "home" else f"/{page.slug}"
        _url_entry(root, _loc(path), page.updated_at, "weekly", 0.8)

    for article in (
        Article.objects.filter(status=Status.PUBLISHED, is_public=True, is_active=True, is_deleted=False)
        .order_by("-published_at")
        .only("slug", "updated_at", "published_at")
    ):
        _url_entry(root, _loc(f"/articles/{article.slug}/"), article.updated_at, "weekly", 0.7)

    for project in (
        Project.objects.filter(status=Status.PUBLISHED, is_public=True, is_active=True, is_deleted=False)
        .order_by("-published_at")
        .only("slug", "updated_at", "published_at")
    ):
        _url_entry(root, _loc(f"/projects/{project.slug}/"), project.updated_at, "monthly", 0.7)

    for service in (
        Service.objects.filter(status=Status.PUBLISHED, is_public=True, is_active=True, is_deleted=False)
        .order_by("sort_order")
        .only("slug", "updated_at")
    ):
        _url_entry(root, _loc(f"/services/{service.slug}/"), service.updated_at, "monthly", 0.6)

    return ET.tostring(root, encoding="utf-8", xml_declaration=True)


def sitemap_xml(request):
    """Return the cached sitemap.xml (published content only)."""
    cached = cache.get(SITEMAP_CACHE_KEY)
    if cached is None:
        cached = _build_sitemap_xml()
        cache.set(SITEMAP_CACHE_KEY, cached, SITEMAP_TTL)
    return HttpResponse(cached, content_type="application/xml")


def robots_txt(request):
    """Return robots.txt referencing the generated sitemap."""
    lines = [
        "User-agent: *",
        "Allow: /",
        "",
        "Disallow: /admin/",
        "Disallow: /api/",
        "Disallow: /dashboard",
        "Disallow: /search",
        "Disallow: /login",
        "Disallow: /forgot-password",
        "Disallow: /reset-password",
        "Disallow: /unauthorized",
        "Disallow: /session-expired",
        "Disallow: /design",
        "Disallow: /dev/",
        "",
        f"Sitemap: {_loc('/sitemap.xml')}",
    ]
    return HttpResponse("\n".join(lines), content_type="text/plain")
