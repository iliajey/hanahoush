"""Unified site-wide search (Phase 8H).

Searches published, public Articles / Projects / Services / Pages with a
portable ORM query that works on both PostgreSQL and the SQLite CI fallback.
Results are relevance-ranked in Python across the multilingual
title/slug/excerpt/body fields, then paginated by the view using the standard
envelope.

Why not PostgreSQL full-text / trigram?
- The CI test suite runs on ``config.settings.ci`` (SQLite), so a Postgres-only
  backend would be untestable in this environment.
- Trigram/full-text indexing adds migrations and extension dependencies for
  modest gain at current content volumes.
The ORM approach is token/prefix tolerant (``icontains`` per token), locale
aware (any language field can match), and safe (parameterized queries).
"""
from django.db.models import Q

from apps.articles.models import Article
from apps.core.models import Status
from apps.page_builder.models import Page
from apps.projects.models import Project
from apps.services.models import Service

SEARCHABLE_TYPES = ("article", "project", "service", "page")

# Fields searched per content type. ``category_lookup`` is the relation used
# for the optional ``category`` filter (slug-based).
TYPE_SPECS = {
    "article": {
        "model": Article,
        "url": "/articles/{slug}/",
        "title_fields": ("title_fa", "title_en", "title_ar"),
        "excerpt_fields": ("short_description_fa", "short_description_en", "short_description_ar"),
        "body_fields": ("description_fa", "description_en", "description_ar"),
        "slug_field": "slug",
        "category_lookup": "category__slug",
        "category_title_fields": ("category__title_fa", "category__title_en", "category__title_ar"),
        "select_related": ("cover_image", "category"),
    },
    "project": {
        "model": Project,
        "url": "/projects/{slug}/",
        "title_fields": ("title_fa", "title_en", "title_ar"),
        "excerpt_fields": ("short_description_fa", "short_description_en", "short_description_ar"),
        "body_fields": ("description_fa", "description_en", "description_ar"),
        "slug_field": "slug",
        "category_lookup": "category__slug",
        "category_title_fields": ("category__title_fa", "category__title_en", "category__title_ar"),
        "select_related": ("cover_image", "category"),
    },
    "service": {
        "model": Service,
        "url": "/services/{slug}/",
        "title_fields": ("title_fa", "title_en", "title_ar"),
        "excerpt_fields": ("short_description_fa", "short_description_en", "short_description_ar"),
        "body_fields": ("description_fa", "description_en", "description_ar"),
        "slug_field": "slug",
        "category_lookup": "section__slug",
        "category_title_fields": ("section__title_fa", "section__title_en", "section__title_ar"),
        "select_related": ("cover_image", "section"),
    },
    "page": {
        "model": Page,
        "url": "/{slug}/",
        "title_fields": ("title_fa", "title_en", "title_ar"),
        "excerpt_fields": (),
        "body_fields": (),
        "slug_field": "slug",
        "category_lookup": None,
        "category_title_fields": (),
        "select_related": (),
    },
}


def build_match_q(terms, fields):
    """OR of ``icontains`` across every field for every token."""
    query = Q()
    for field in fields:
        for term in terms:
            query |= Q(**{f"{field}__icontains": term})
    return query


def _published_queryset(spec, category=None):
    model = spec["model"]
    filters = {"status": Status.PUBLISHED, "is_active": True, "is_deleted": False}
    if hasattr(model, "is_public"):
        filters["is_public"] = True
    if category and spec["category_lookup"]:
        filters[spec["category_lookup"]] = category
    qs = model.objects.filter(**filters)
    if spec["select_related"]:
        qs = qs.select_related(*spec["select_related"])
    return qs


def _pick(values, lang, fields):
    """Return the localized value for ``lang`` falling back to canonical.

    ``fields`` and ``values`` are parallel tuples; the first field whose suffix
    matches the requested language wins (falling back to ``_en`` when empty).
    """
    chosen = ""
    for field, value in zip(fields, values, strict=False):
        if field.endswith(f"_{lang}"):
            chosen = value or ""
            break
    if not chosen:
        for field, value in zip(fields, values, strict=False):
            if field.endswith("_en"):
                chosen = value or ""
                break
    return chosen


def score_result(full_q, terms, title_values, slug_value, excerpt_values, body_values):
    """Simple deterministic relevance score in [0, 120+].

    Exact title match > title prefix > title substring > per-token title match
    > slug/prefix match > excerpt token match > body token match.
    """
    score = 0.0
    full = full_q.strip().lower()

    for value in title_values:
        v = (value or "").lower()
        if v == full:
            score += 100
            break
        if v.startswith(full):
            score += 80
            break
        if full in v:
            score += 60
            break
    else:
        for term in terms:
            if any(term in (value or "").lower() for value in title_values):
                score += 30
                break

    slug = (slug_value or "").lower()
    if full and (slug == full or slug.startswith(full) or full in slug):
        score += 20

    for term in terms:
        if any(term in (value or "").lower() for value in excerpt_values):
            score += 10
        if any(term in (value or "").lower() for value in body_values):
            score += 5
    return score


def search_content(q, type_filter=None, category=None, locale="en"):
    """Return relevance-ranked search hits across the requested types.

    Each hit is a fully-resolved dict ready for serialization: localized title
    and excerpt, image URL, frontend URL, relevance and publish date.
    """
    types = [type_filter] if type_filter in SEARCHABLE_TYPES else list(SEARCHABLE_TYPES)

    full_q = (q or "").strip()
    terms = [term for term in full_q.lower().split() if term]
    if not terms:
        return []

    results = []
    for type_name in types:
        spec = TYPE_SPECS[type_name]
        queryset = _published_queryset(spec, category=category)
        search_fields = spec["title_fields"] + spec["excerpt_fields"] + spec["body_fields"]
        if spec["category_title_fields"]:
            search_fields = search_fields + spec["category_title_fields"]
        queryset = queryset.filter(build_match_q(terms, search_fields))

        for obj in queryset.iterator():
            title_values = [getattr(obj, f, "") or "" for f in spec["title_fields"]]
            excerpt_values = [getattr(obj, f, "") or "" for f in spec["excerpt_fields"]]
            body_values = [getattr(obj, f, "") or "" for f in spec["body_fields"]]
            slug_value = getattr(obj, spec["slug_field"], "") or ""
            relevance = score_result(full_q, terms, title_values, slug_value, excerpt_values, body_values)

            cover = getattr(obj, "cover_image", None)
            image = cover.file.url if cover else None

            category_title = None
            category_slug = None
            if spec["category_title_fields"]:
                category_obj = getattr(obj, "category", None)
                if category_obj is None and type_name == "service":
                    category_obj = getattr(obj, "section", None)
                if category_obj is not None:
                    category_slug = getattr(category_obj, "slug", None)
                    category_title = _pick(
                        [getattr(category_obj, f.split("__", 1)[1], "") or "" for f in spec["category_title_fields"]],
                        locale,
                        spec["category_title_fields"],
                    )

            url = spec["url"].format(slug=slug_value)
            if type_name == "page" and slug_value == "home":
                url = "/"

            results.append(
                {
                    "type": type_name,
                    "id": obj.pk,
                    "title": _pick(title_values, locale, spec["title_fields"]),
                    "excerpt": _pick(excerpt_values, locale, spec["excerpt_fields"]),
                    "slug": slug_value,
                    "image": image,
                    "url": url,
                    "relevance": relevance,
                    "published_at": getattr(obj, "published_at", None),
                    "category_slug": category_slug,
                    "category_title": category_title,
                    "locale": locale,
                }
            )

    # Relevance first, then recency.
    results.sort(key=lambda r: (-r["relevance"], -(r["published_at"].timestamp() if r["published_at"] else 0)))
    return results
