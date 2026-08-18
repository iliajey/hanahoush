# Articles — UX Story

The Articles area establishes Hanahoush as a **technology company** — a
magazine that demonstrates engineering depth across software, ERP, AI,
architecture, DevOps and digital transformation. Not a marketing blog.

## Magazine, not a grid

```
/articles
 ├─ HERO          editorial masthead + live search
 ├─ FEATURED      one dominant story (editorial composition)
 ├─ LATEST        editorial grid (3 → 2 → 1 columns)
 ├─ DISCOVER      search / category / topic / sort / featured
 ├─ CATEGORIES    real CMS categories
 ├─ TOPICS        real CMS tags (Django, React, ERP, AI, ...)
 └─ NEWSLETTER    a reason to come back
```

## Reading flow (article detail)

```
hero → content (TOC + reading progress + code blocks)
     → related (articles / projects / services)
     → newsletter → contextual CTA
```

## Principles

- **Engineering, not marketing**: code blocks, architecture and real topics
  take centre stage; the reading layout keeps line lengths comfortable.
- **CMS-only**: every article, category, tag, body and related item comes from
  the API. No hardcoded taxonomy.
- **Safe by default**: bodies are sanitized with DOMPurify before render;
  code blocks are isolated components with language + copy.
- **Deep but focused**: no anonymous reactions; the experience stays
  professional.
- **Localized**: fa/en/ar copy, RTL for fa/ar, LTR for en, per-language
  reading-time assumptions documented.

## Accessibility

- Semantic `<article>` markup, correct heading hierarchy, keyboard-accessible
  TOC/code blocks/share buttons, visible focus rings, screen-reader labels,
  reduced-motion-friendly animations.

## Reading time strategy

Deterministic and documented: HTML stripped, words counted, divided by a
per-locale words-per-minute rate (`en`=200, `fa`=180, `ar`=170) —
Persian/Arabic script is denser, so fewer words per minute. The value is
computed on demand by the API and never stored.