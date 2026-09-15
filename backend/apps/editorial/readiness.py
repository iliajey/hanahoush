"""Publication readiness gate (Phase 17).

Single source of truth for "is this content safe to schedule / publish?".

BLOCKING (schedule + publish-now rejected):
- missing slug / invalid slug
- missing required title (EN is the canonical locale)
- missing required body (EN description)
- invalid canonical URL (when set)

WARNINGS (never block — SEO length, missing FA/AR, missing cover, etc.)
stay in the frontend ``seoHealthItems`` / studio health panels.

``locale_readiness(obj)`` returns the lightweight per-locale summary used by
the timeline payload — presence checks only, no heavy queries.
"""
from django.core.exceptions import ValidationError
from django.core.validators import URLValidator, validate_unicode_slug

_LOCALES = ("fa", "en", "ar")


class PublicationBlocked(Exception):
    """Raised when blocking readiness issues forbid schedule/publish."""

    def __init__(self, blocking):
        self.blocking = list(blocking)
        super().__init__("Publication blocked: " + "; ".join(
            f"[{b.get('locale', '-')}] {b.get('field')}: {b.get('message')}"
            for b in self.blocking
        ))


def _text(obj, field: str) -> str:
    return str(getattr(obj, field, "") or "").strip()


def blocking_issues(obj) -> list:
    """Blocking publication-health issues for a publishable content object."""
    if obj is None or not hasattr(obj, "slug"):
        return [{"field": "content", "locale": None, "message": "Content object is missing."}]
    issues = []
    slug = _text(obj, "slug")
    if not slug:
        issues.append({"field": "slug", "locale": None, "message": "Slug is required."})
    else:
        try:
            validate_unicode_slug(slug)
        except ValidationError:
            issues.append({"field": "slug", "locale": None, "message": "Slug is invalid."})
    if not _text(obj, "title_en"):
        issues.append({"field": "title_en", "locale": "en", "message": "English title is required."})
    if not _text(obj, "description_en"):
        issues.append(
            {"field": "description_en", "locale": "en", "message": "English body content is required."}
        )
    canonical = _text(obj, "canonical_url")
    if canonical:
        try:
            URLValidator()(canonical)
        except ValidationError:
            issues.append(
                {"field": "canonical_url", "locale": None, "message": "Canonical URL is invalid."}
            )
    return issues


def locale_readiness(obj) -> dict:
    """Compact per-locale readiness: ``{fa: {ready, critical, warnings, issues}}``.

    A locale is ``ready`` when title + body are present. ``critical`` counts
    blocking issues for that locale; EN also carries the slug/canonical
    blockers (canonical locale). ``issues`` holds short human-readable strings
    for tooltips (max 3 per locale) — never full content.
    """
    blocking = blocking_issues(obj)
    out = {}
    for locale in _LOCALES:
        has_title = bool(_text(obj, f"title_{locale}"))
        has_body = bool(_text(obj, f"description_{locale}"))
        local = [b for b in blocking if b.get("locale") in (locale, None)]
        if locale != "en":
            # Slug/canonical are EN-canonical concerns, not per-locale blockers.
            local = [b for b in local if b.get("locale") == locale]
        messages = []
        if not has_title:
            messages.append("Missing title")
        if not has_body:
            messages.append("Missing body")
        for b in local:
            if b["message"] not in messages:
                messages.append(b["message"])
        out[locale] = {
            "ready": has_title and has_body and not local,
            "critical": len(local),
            "warnings": (0 if has_title else 1) + (0 if has_body else 1),
            "issues": messages[:3],
        }
    return out


def assert_ready(obj) -> None:
    """Raise ``PublicationBlocked`` when blocking issues exist."""
    issues = blocking_issues(obj)
    if issues:
        raise PublicationBlocked(issues)
