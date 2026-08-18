# ADR-0004 — RTL/LTR via document direction

- **Status:** Accepted
- **Date:** 2025-08-04
- **Applies to:** frontend internationalization

## Context

The platform targets Persian (RTL), English (LTR) and Arabic (RTL, structure
only). Direction must switch dynamically without touching business code.

## Decision

- **`document.documentElement.dir` + `lang`** are set by the
  `LanguageProvider` whenever the language changes (`fa`/`ar` → `rtl`,
  `en` → `ltr`).
- **Logical CSS properties** (`ms-*`, `me-*`, `start-*`, `end-*`) are used
  instead of physical `ml`/`mr` so layouts flip automatically.
- The language preference persists in `localStorage`
  (`hanahoush-language`) and drives i18next (`changeLanguage`).
- Fonts swap via CSS: Vazirmatn for Persian/Arabic, Inter for Latin.

## Consequences

- Direction is a single source of truth derived from the active language.
- New components must use logical utilities to stay RTL-safe.
- Arabic is "structure only" for now: the locale file exists but content
  falls back to English where untranslated.
