# Article Detail — `/articles/:slug`

The article reading experience is the primary SEO/content surface. It is
assembled as a page and rendered by `<PageRenderer />` from registered
sections: `article_hero`, `article_content`, `article_related`,
`article_newsletter`, `article_cta`.

## Hero

Title, subtitle/excerpt, category, author (from the existing
`Article.author` FK — no new user models), published/modified dates, reading
time, tags and cover image. Supports RTL (fa/ar) / LTR (en).

## Content (safe rendering)

`ArticleContent`:
1. Sanitizes the CKEditor HTML with **DOMPurify** (removes `<script>`, event
   handlers, `javascript:` URLs).
2. Post-processes: assigns stable heading ids (for the table of contents) and
   language labels to code blocks.
3. Renders code blocks through the accessible `<CodeBlock />` component.
See `docs/architecture/article-content.md` for the security pipeline.

## Reading experience

- **Reading progress** — fixed top bar driven by scroll (`ReadingProgress`).
- **Table of contents** — generated from h2/h3 headings; sticky in the desktop
  sidebar; collapsible on mobile.
- **Sticky metadata + share** in the desktop sidebar; smooth anchor jumps.

## Code blocks

`<CodeBlock />` gives a language label, a copy button, accessible layout and
horizontal scrolling on mobile. Highlighting is a lightweight, dependency-free
regex tokenizer (python/javascript/bash/sql/json) — no heavy framework loaded
globally.

## Related content

Server-computed in the Article detail serializer:
- `related_articles` — same category or shared tag (limit 3).
- `related_projects` — published projects whose technologies/title match the
  article's tags (limit 3).
- `related_services` — services whose title/description match the article's
  topics (limit 2).

No invented relationships; empty lists fade gracefully.

## Article CTA

Contextual: if a related project exists the CTA references a case study,
otherwise it routes to contact. All CTAs/related clicks are tracked.

## SEO

`useArticleSeo` sets title, description, canonical, OpenGraph and Twitter
metadata, and injects a `BlogPosting` + `BreadcrumbList` JSON-LD block (validated
before injection). Canonical URLs are deterministic (`origin/articles/{slug}`);
only published articles are indexable.