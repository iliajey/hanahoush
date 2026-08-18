# Articles — Knowledge Hub / Engineering Magazine

The Articles area is a professional **Knowledge Hub** — "Hanahoush Engineering
& Technology Magazine" — composed by the Page Builder from a seeded `articles`
`Page` record (no hardcoded layout).

## Routes

- `/articles` → `ArticlesPage` = `usePage("articles")` + `<PageRenderer />`
  (+ `useScrollDepth("articles")` + `useSeoMeta`).
- `/articles/:slug` → `ArticleDetailPage` = `useArticleBySlug(slug)` +
  an assembled page (`article_hero → article_content → article_related →
  article_newsletter → article_cta`) rendered by `<PageRenderer />`.
- `/articles?category=…&tag=…&q=…` — filters apply via query-driven discovery
  (no separate category/tag routes; the existing routing + API already provide
  the equivalent).

## Listing sections (in order)

| # | Section type | Source |
|---|---|---|
| 1 | `articles_hero` | Page config — editorial heading + live search |
| 2 | `featured_article` | CMS — one dominant editorial article |
| 3 | `latest_articles` | CMS — responsive editorial grid (3/2/1 columns) |
| 4 | `article_filters` | CMS — search/category/tag/sort/featured + paginated grid |
| 5 | `category_explorer` | CMS (`/articles/categories/`) |
| 6 | `tag_explorer` | CMS (`/articles/tags/`) |
| 7 | `newsletter_cta` | Newsletter (single system) |
| 8 | `article_cta` | Contextual final CTA |

## Search & filters (server-side)

`useArticlesFiltered(filters)` maps the domain filter object (`q`,
`categorySlug`, `tagSlug`, `featuredOnly`, `ordering`, `page`, `pageSize`)
onto the existing Article API (`q` via MultiFieldSearchFilter, `category_slug`,
`tags`, `is_featured`, `ordering`, `page`, `page_size`). Search covers title,
excerpt, description and slug across fa/en/ar. The hero search writes to a
tiny shared store; the discovery section reads it — no browser-side filtering
of the whole database.

## Taxonomy

Categories and tags come from `GET /api/v1/articles/categories/` and
`/articles/tags/` (published-only, with counts) — never hardcoded.

## Editorial collections

Curated sections are assembled at the Page level (the `articles` Page +
registry sections) — reusing the existing taxonomy/Page Builder rather than
adding new models.

## Reading time

Deterministic: strip HTML → count words → divide by per-locale words per
minute (`en`=200, `fa`=180, `ar`=170) → `max(1, ceil)`. Computed on the API
(never stored). See `docs/architecture/article-content.md`.

## Newsletter

A single `NewsletterSubscription` model + `POST /api/v1/newsletter/subscribe/`
(current: 201, duplicate: 409, invalid: 400). The `NewsletterCTA` component
handles loading/success/duplicate/error with localized copy.

## Editorial workflow

Articles use the Phase 8C workflow; public list + `by-slug` querysets only
expose `status=published, is_public=True`, so drafts/archived/scheduled
(workflow-scheduled keeps `status=draft`) never appear publicly.