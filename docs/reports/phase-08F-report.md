# Hanahoush — Phase 8F Report — Knowledge Hub / Engineering Magazine

**Date:** 2026-08-08
**Scope:** Turn the Articles area into a professional Knowledge Hub / Engineering
Magazine — reusing the entire existing architecture (no parallel CMS, workflow,
SEO, analytics, i18n or renderer).

---

## 1. Executive Summary

Phase 8F delivers a magazine-grade Articles experience:

- **`/articles`** — a premium Knowledge Hub composed by the Page Builder:
  editorial hero + live search, one dominant featured article, a responsive
  latest grid (3/2/1 columns), server-side discovery (search, category, topic,
  sorting, featured, pagination), a category explorer, a topic/tag explorer,
  a newsletter CTA and a final CTA.
- **`/articles/:slug`** — a magazine reading experience assembled via
  `<PageRenderer />`: safe content rendering (DOMPurify), reading progress,
  table of contents, accessible code blocks, sharing, related
  articles/projects/services, newsletter and a contextual CTA.
- Backend: deterministic reading time, draft-protected `by-slug` detail with
  related content, published-only taxonomy explorers, and a **single**
  newsletter subscription system.

**Numbers:** backend **131 tests pass**, frontend **102 tests pass**,
TypeScript/ESLint/Vite/Storybook green, ruff-clean, live routes verified, no
regressions (landing/services/projects/case studies intact).

## 2. Architecture Reused

Page Builder + `PageRenderer` · section registry · CMS hooks/React Query ·
Article/Category/Tag model + API · MultiFieldSearchFilter/Filterset ·
Editorial Workflow (8C) · analytics `features/analytics` · `useSeoMeta` ·
localization/LanguageProvider · marketing components (ArticleCard/ArticleGrid) ·
`ResponsiveImage`, `CmsAsync`. No duplicate of any of these.

## 3. Backend Changes

- Deterministic `reading_time` (list + detail; `apps/articles/reading.py`).
- `ArticleViewSet.by_slug` action (draft-protected) returning
  `ArticleDetailSerializer` with `related_articles` (category/tag),
  `related_projects` (technology/title overlap), `related_services` (topic
  overlap); `categories/` and `tags/` explorer actions.
- `NewsletterSubscription` model + admin; `POST
  /api/v1/newsletter/subscribe/` (201 / 409 duplicate / 400 invalid).
- 11 new section types + seeded `articles` Page (8 sections) with localized
  copy + SEO. Migration (section-type choices + NewsletterSubscription) applied.

## 4. Frontend Changes

`src/features/articles/` (types, api, hooks, queries, services, utils,
mappers, components, pages, dev). Key components: `ArticleContent`,
`CodeBlock`, `ArticleTableOfContents`, `ReadingProgress`, `FeaturedArticle`,
`ArticleFilterBar`, `CategoryExplorer`, `TagExplorer`, `ArticleShare`,
`NewsletterCTA`, `RelatedArticles/Projects/Services`, `ArticleMeta`,
`ArticleCTA`. 11 new page-builder section wrappers. Dependency added:
`dompurify`.

## 5. Article Listing

Seeded Page: `articles_hero` → `featured_article` → `latest_articles` →
`article_filters` → `category_explorer` → `tag_explorer` →
`newsletter_cta` → `article_cta`.

## 6. Article Detail

`/articles/:slug` assembles `article_hero` → `article_content` →
`article_related` → `article_newsletter` → `article_cta` and renders via
`<PageRenderer />`. 404 for unknown/unpublished slugs.

## 7. Search

Server-side via the existing `MultiFieldSearchFilter` (`q` covers title,
excerpt, description, slug, fa/en/ar). The hero search writes a shared store;
the discovery section reads it. Verified live (`/api/v1/articles/?q=ERP` → 1).

## 8. Filters

`ArticleFilterBar` → API `category_slug`, `tags`, `is_featured`, `ordering`,
`page`, `page_size` (verified live). No whole-DB client-side filtering.

## 9. Taxonomy

Categories (`/articles/categories/`) and tags (`/articles/tags/`) come from
the API (published-only, counts). Verified live (3 categories, 6 tags).

## 10. Content Rendering

`ArticleContent` sanitizes CKEditor HTML with DOMPurify, assigns heading ids,
tags code languages, and injects `<CodeBlock />`. Renders headings, lists,
links, images, quotes, tables, emphasis safely. Sanitization verified by tests
(script/event-handler/javascript: stripped).

## 11. Reading Experience

Reading equipment: fixed scroll progress, TOC (sticky desktop / collapsible
mobile), meta + share sidebar, comfortable measure, anchor navigation.

## 12. Code Blocks

`CodeBlock`: language label, copy button, accessible layout, horizontal scroll
on mobile, lightweight dependency-free highlighter (python/js/bash/sql/json).

## 13. Newsletter

Single `NewsletterSubscription` system. `NewsletterCTA` handles loading,
success, duplicate (409), validation errors and API errors with localized
labels. Verified live (201/409/400).

## 14. Related Content

Server-computed: related articles (category/tag), related projects
(technology/title overlap), related services (topic overlap). No invented
relationships.

## 15. CMS Integration

All articles, taxonomy, body HTML, cover images and related content come from
the API. No duplicate CMS.

## 16. Page Builder Integration

Two new page families (hub listing + article detail) use the existing
`<PageRenderer />` and 11 new registered sections (lazy, with the existing
unknown-section fallback).

## 17. Editorial Workflow

Articles use the 8C workflow; public list + `by-slug` querysets only expose
`published`,`is_public=True`. Scheduled articles keep `status=draft` (8C) so
they never appear publicly. Tests confirm draft/archived protection.

## 18. SEO

`useArticleSeo`: title, description, canonical (deterministic
`origin/articles/{slug}`), OpenGraph + Twitter (card/title/description/image).
Only published content is indexable.

## 19. Structured Data

Validated `BlogPosting` + `BreadcrumbList` JSON-LD injected per article
(validated via `isValidJsonLd` before injection).

## 20. Localization

fa/en/ar body + metadata; RTL for fa/ar, LTR for en (LanguageProvider).
Reading-time wpm differs per locale (documented).

## 21. Analytics

Single `features/analytics` system with: `article_view`, `article_search`,
`article_filter`, `category_click`, `tag_click`, `featured_article_click`,
`article_share`, `copy_link`, `newsletter_submit`, `related_article_click`,
`related_project_click`, `related_service_click`, `article_cta_click`,
`article_section_visible`, `scroll_depth`.

## 22. Security

Client-side DOMPurify (blocks script/`on*`/`javascript:`), published-only
querysets, no base64 media; no audit data leaked. Security-focused blog + test
coverage.

## 23. Accessibility

Semantic `<article>`, heading hierarchy, keyboard-accessible TOC/code/share,
focus states, ARIA labels, reduced-motion-compatible.

## 24. Performance

Lazy sections and images, DOMPurify runs during render (memoized), no global
heavy syntax-highlighting framework, React Query caching, minimal reading JS.

## 25. Responsive Design

3/2/1 editorial grid; reading width constrained; code scrolls horizontally on
mobile; RTL/LTR verified; no layout shift (aspect-ratio media, skeletons).

## 26. Admin

Article admin reused (CKEditor body, SEO fieldsets, featured/pinned, status);
workflow/revision/approval/audit available via the 8C editorial admin; gallery
reuses `Article.cover_image` (MediaFile).

## 27. API Changes

- `GET /articles/` (now includes `reading_time`; existing filters).
- `GET /articles/by-slug/{slug}/` → detail + `related_*`.
- `GET /articles/categories/`, `GET /articles/tags/`.
- `POST /api/v1/newsletter/subscribe/` (new, single system).
- OpenAPI regenerates via drf-spectacular at `/api/schema/` (viewsets + actions
  autodiscovered).

## 28. Tests

Backend: `apps/articles/tests/test_knowledge_hub.py` (11) + full suite (131).
Frontend: `features/articles/tests/articles.test.tsx` (9) + full suite (102).
Executed passes around: listing/detail, search, filters, pagination,
localization (fa), reading time, TOC, related, newsletter, JSON-LD
validation, sanitization, 404/loading/empty/error, security (draft/archived/
scheduled).

## 29. Visual QA

Headless DOM-level review (render tests) + live-server verification. SVG
mockups under `docs/screenshots/phase-08F/`: articles-home, article-detail,
article-mobile, article-reading, article-filters. Live routes + all pages
return 200; no console errors surfaced in tests.

## 30–34. Files / Migrations / Seeds / Endpoints

- **Created:** `features/articles/*`, registry section files, `reading.py`,
  `test_knowledge_hub.py`, newsletter model/admin/serializer/view/url, docs.
- **Modified:** `apps/articles/api/*`, `apps/page_builder/{models,admin,api
  serializers/views/urls,seed}.py`, routes, registry/config, package.json,
  CHANGELOG/NEXT_PHASE.
- **Migrations:** `page_builder.0002` (section_type choices, NewsletterSubscription) — applied.
- **Seeds:** `articles` Page (8 sections) + 11 SectionConfigurations + newsletter empty table.
- **Endpoints added:** `by-slug`, `categories`, `tags`, `newsletter/subscribe`.

## 35–37. Known / Deferred / Recommendations

- **Known:** demo media text-only (placeholders); backend sanitizer is
  client-only (defense-in-depth could add bleach server-side); analytics
  in-memory.
- **Deferred:** server-side HTML sanitizer; media uploads in demo seed;
  analytics ingestion (Phase 9); full article author page.
- **Recommendations:** 8G about/contact/search; add UVic/sanitizer; add media
  uploads; consider an author bio surface.

## 38. Verification Matrix

| Check | Result |
|---|---|
| backend pytest · check · makemigrations --check · migrate · bootstrap | ✅ 131 ✅ |
| frontend Vitest · tsc · eslint · build · storybook | ✅ 102 · ✅ |
| ruff (new code) | ✅ |
| `/articles`, `/articles/:slug`, `/dev/articles` | ✅ 200 |
| search/filters/categories/tags/newsletter | ✅ verified live |
| draft/archived/scheduled protection | ✅ tests |
| landing/services/projects/case-studies regressions | ✅ none |

## 39. Suggested Git Commit

```
phase-08F: knowledge hub / engineering magazine

- /articles + /articles/:slug composed by PageRenderer (11 new section types)
- Backend: reading-time, by-slug detail + related, categories/tags, newsletter
- features/articles: safe content, code blocks, TOC, progress, share, SEO,
  analytics, /dev/articles
- 11 backend + 9 frontend tests; docs + diagrams + visual QA
```

(The repo is not under version control here and no git binary exists — the
message above is the intended commit.)

## 40. Final Readiness

✔ Knowledge Hub · ✔ Article listing · ✔ Article detail · ✔ Search · ✔
Taxonomy · ✔ Reading experience · ✔ CMS integration · ✔ Page Builder
integration · ✔ Editorial workflow · ✔ SEO · ✔ Structured data · ✔ Newsletter ·
✔ Analytics · ✔ Security · ✔ Localization · ✔ Verification · Report path:
`docs/reports/phase-08F-report.md` · Known issues listed · Ready for Phase 8G.