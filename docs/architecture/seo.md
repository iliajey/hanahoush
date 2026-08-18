# SEO Architecture (Phase 8H)

## Overview

SEO has two layers that work together:

1. **Client** — `useSeoMeta()` (title/description/keywords/robots/canonical/OG/Twitter/
   hreflang alternates) + `JsonLd` structured data, extended in 8H with alternates.
2. **Server** — authoritative `/sitemap.xml` and `/robots.txt` generated from published content.

No Next.js, no prerender/SSR (deferred to Phase 9), no duplicate SEO system.

## Server endpoints (backend `apps/seo`)

### `/sitemap.xml`

- Generated from **published** content only:
  - `Page` (status=published) → `/<slug>` (home → `/`)
  - `Article` (published + public) → `/articles/<slug>/`
  - `Project` (published + public) → `/projects/<slug>/`
  - `Service` (published + public) → `/services/<slug>/`
- Excludes drafts, archived, scheduled, admin, dashboard, dev routes, search and auth pages.
- Emits `lastmod` (`updated_at`), `changefreq`, `priority`.
- Absolute URLs use `SITE_URL` (setting; default `http://localhost:5173`).
- Cached for 5 minutes (`sitemap:xml`) and invalidated by signals on any save/delete of the four
  source models (`apps/seo/signals.py`).

### `/robots.txt`

```
User-agent: *
Allow: /
Disallow: /admin/  /api/  /dashboard  /search  /login  /forgot-password
         /reset-password  /unauthorized  /session-expired  /design  /dev/
Sitemap: {SITE_URL}/sitemap.xml
```

## Locale alternates

The frontend is a **locale-less SPA**: the active language is stored client-side
(localStorage) and never appears in the URL. There are no per-language URLs to link, so:

- The sitemap intentionally does **not** emit hreflang alternates (they would point several
  hreflang values at one identical URL, which is incorrect).
- `useSeoMeta` was **extended** with an optional `alternates` map. When a caller provides real
  alternate URLs (e.g. `?lang=fa`-style paths or future locale-prefixed routes), it emits the
  `<link rel="alternate" hreflang="...">` set plus an `x-default` self link, and removes stale
  alternates on later renders.

## Client (`useSeoMeta`)

Handles: `document.title`, meta description/keywords, `robots` (+ `googlebot` sync),
canonical `<link>`, OpenGraph (`og:site_name/title/description/type/url/locale/image`), Twitter
cards (`summary_large_image`), and now hreflang alternates.

Structured data (`JsonLd`): `Organization` + `FAQPage` on `/about`, `CreativeWork` +
`BreadcrumbList` on case studies, `BlogPosting` + `BreadcrumbList` on articles.

Search results pages are `noindex,follow` by design (no standalone value for crawlers).

## Notes

- `public/robots.txt` in the SPA still references a placeholder sitemap URL; the authoritative
  files are served by the backend at `/sitemap.xml` and `/robots.txt` (route them to the Django
  host in production).
