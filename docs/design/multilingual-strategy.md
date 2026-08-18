# Hanahoush — Multilingual Strategy

> Persian, Arabic and English with first-class RTL/LTR support.

---

## Languages

| Locale | Code | Direction | Status |
|--------|------|-----------|--------|
| Persian | `fa` | RTL | Primary (default) |
| English | `en` | LTR | Full |
| Arabic | `ar` | RTL | Structure ready (content fill later) |

## RTL/LTR switching

- **Single source of truth:** `document.documentElement.dir` + `lang` set by
  the `LanguageProvider` (already implemented in Phase 5).
- All layout uses **logical properties** (`ms-*`, `me-*`, `start-*`, `end-*`,
  `inset-inline-*`) so components flip automatically.
- Directional icons mirror via the icon layer (e.g., chevrons), driven by
  `document.dir`, not per-call-site hacks.
- Animations use logical directions (reveal from reading edge).

## Typography

- **Persian/Arabic:** Vazirmatn Variable (already imported).
- **English:** Inter Variable (already imported).
- `html[dir="rtl"]` and `[dir="ltr"]` swap the base font family.
- RTL line-height/letter-spacing tuned (slightly larger line-height; avoid
  tight negative tracking on Arabic script).
- Numerals: Persian digits for `fa`, Western digits for `en/ar` where
  appropriate (configurable per-locale formatter).

## Content expansion

- Translated text is up to **~30–40% longer** in Persian/Arabic vs English.
  Layouts must not break:
  - Flexible card heights (no fixed heights on text blocks).
  - Buttons: generous padding; short verb CTAs.
  - Truncation with title tooltips where required.
- Every text container must accommodate expansion without overflow.

## Icons mirroring

- Mirror list (RTL): chevrons, arrows, breadcrumb separators, pagination
  previous/next, "back" icons, timeline direction, marquee direction.
- **Do not** mirror: clocks, checkmarks, search, user, chat, flags, brand
  logos (orientation is content, not direction).

## Localization pipeline

- `i18next` resources per locale (`src/i18n/locales/{en,fa,ar}`).
- Keys grouped by feature (`auth.*`, `nav.*`, `landing.*`).
- Numbers/dates formatted with the Intl API per locale (`fa-IR`, `en-US`,
  `ar-SA`).
- Locale persisted (`hanahoush-language`); `hreflang`/canonical planned with
  SEO (multi-URL or `Accept-Language` strategy per `information-architecture`).

## Quality checklist

- [ ] No English-only strings in components (all via `t()`).
- [ ] No physical `left/right` or `ml/mr` in new components.
- [ ] Icon mirror rules enforced in the icon layer.
- [ ] Screenshot + lint check for RTL overflow on every new page.
- [ ] Locale-aware pluralization and date formatting.
