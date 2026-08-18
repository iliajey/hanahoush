"""Localization helpers for page-builder JSON configuration.

Section ``config`` JSON may hold localized values in two shapes:

1. Value is a dict keyed by locale: ``{"fa": "...", "en": "...", "ar": "..."}``
2. Per-locale overrides on the section itself: ``language_overrides``.

``resolve_localized`` flattens both into a plain, language-resolved dict.
"""
from typing import Any

LOCALES = ("fa", "en", "ar")


def _looks_localized(value: Any) -> bool:
    return isinstance(value, dict) and any(k in value for k in LOCALES)


def resolve_localized(value: Any, lang: str) -> Any:
    """Recursively resolve localized dicts for ``lang`` (fallback ``en``)."""
    if isinstance(value, dict):
        if _looks_localized(value):
            return value.get(lang) or value.get("en") or next(iter(value.values()), "")
        return {key: resolve_localized(item, lang) for key, item in value.items()}
    if isinstance(value, list):
        return [resolve_localized(item, lang) for item in value]
    return value


def resolve_section_config(config: dict, overrides: dict, lang: str) -> dict:
    """Merge ``language_overrides`` over a language-resolved ``config``."""
    merged = {**config, **(overrides.get(lang) or {})}
    return resolve_localized(merged, lang)


def normalize_lang(raw: str) -> str:
    return raw if raw in LOCALES else "en"
