"""Deterministic article reading-time calculation.

Algorithm (documented in docs/pages/articles.md):
1. Strip HTML tags from the article body.
2. Tokenize on whitespace (Unicode-aware).
3. Divide words by a per-locale words-per-minute assumption:
   en=200, fa=180, ar=170 (Persian/Arabic script is denser).
4. Reading time = max(1, ceil(words / wpm)) minutes.

The value is computed on demand (never stored) — one source of truth.
"""
import math
import re

HTML_TAG_RE = re.compile(r"<[^>]+>")
WPM = {"en": 200, "fa": 180, "ar": 170, "default": 200}


def strip_html(html: str) -> str:
    if not html:
        return ""
    text = HTML_TAG_RE.sub(" ", html)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def word_count(text: str) -> int:
    return len([w for w in re.split(r"\s+", text.strip()) if w]) if text.strip() else 0


def reading_minutes(html: str, locale: str = "en") -> int:
    words = word_count(strip_html(html))
    if words == 0:
        return 0
    wpm = WPM.get(locale, WPM["default"])
    return max(1, math.ceil(words / wpm))
