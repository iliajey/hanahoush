# Article Content — Rendering & Security (ADR-style)

## Status

Accepted for Phase 8F.

## Context

Article bodies are authored in the Django admin via **django-ckeditor-5** and
stored as HTML in `Article.description_{fa,en,ar}`. The frontend must render
this rich content (headings, paragraphs, lists, links, images, quotes, code
blocks, tables, inline emphasis) safely and with a magazine-grade reading
experience.

## Decisions

### 1. Sanitize on the client with DOMPurify

The frontend sanitizes every article body with DOMPurify before rendering:
- Removes `<script>`, event-handler attributes (`on*`).
- Rejects unsafe URL schemes (`javascript:`) via `ALLOWED_URI_REGEXP`.
- Keeps the standard rich-text element set produced by CKEditor.

Sanitized HTML is rendered via `dangerouslySetInnerHTML` only after this
sanitization step — the accepted safe pattern (never raw server HTML).

### 2. Post-process for structure, not inline injection

After sanitization, the content is parsed (DOMParser), headings get stable ids
(for the table of contents), and `pre>code` blocks are tagged with their
language. Code blocks are then rendered as real components (`<CodeBlock />`)
— language label, copy button, horizontal scrolling — rather than injected
markup.

### 3. Lightweight, dependency-free highlighting

A tiny regex tokenizer covers python/javascript/bash/sql/json — enough for an
engineering magazine without loading a heavy syntax-highlighting framework
globally.

### 4. Reading time is computed, never stored

Deterministic algorithm (documented): strip HTML → word count → per-locale
wpm (`en`=200, `fa`=180, `ar`=170) → `max(1, ceil(words/wpm))`. Computed on
the API for consistency and to avoid redundant storage.

### 5. Backend keeps source-of-truth; no double sanitization reliance

The backend stores the CKEditor HTML as authored. The frontend sanitizes at
render. (A server-side sanitizer can be added later without changing the
contract — the client already never trusts the HTML.)

## Security posture

- Scripts and event handlers cannot execute (DOMPurify default).
- `javascript:` links are stripped.
- No `base64` image storage; media stays in `MediaFile`.
- Draft/archived/scheduled articles are never served publicly (published-only
  querysets), so unsafe or unreviewed content cannot reach the public site.

## Consequences

- Article bodies render safely with a consistent magazine style.
- Code blocks and TOC come from the same sanitized pipeline (single pass).
- Reading time is consistent across backend/frontend and documented.