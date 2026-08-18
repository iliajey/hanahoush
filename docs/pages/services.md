# Services Page — `/services`

The Enterprise Services Experience is **fully composed by the Page Builder** —
there is no hardcoded layout on the route. The route loads the published
`services` `Page` record and renders it with `<PageRenderer />`.

## Route

`/services` → `ServicesPage` (in `src/app/routes/pages/ServicesPage.tsx`):

```tsx
const page = usePage("services")
useScrollDepth("services")
useSeoMeta(seoInput(page.data?.seo), language, …)
return <PageRenderer page={page.data} />
```

## Composed sections (in order)

| # | Section type | Source | Content |
|---|---|---|---|
| 1 | `hero` | Page config | Cinematic heading, animated background, dynamic subtitle, dual CTAs (living cursor is global). |
| 2 | `journey` | Page config | Problem → Solution → Technology → Result animated storytelling. |
| 3 | `services` | Page config (curated `items`) | Core Services — 7 disciplines, each with icon, animation, technology tags, CTA. |
| 4 | `comparison` | Page config | Traditional vs Hanahoush approach table. |
| 5 | `stack` | Page config | Animated technology stack. |
| 6 | `process` | Page config | Discovery → Planning → Architecture → Development → Testing → Deployment → Support. |
| 7 | `faq` | CMS API (`useFAQs`) | FAQ accordion (usage tracked). |
| 8 | `projects` | CMS API (`useFeaturedProjects`) | Related projects (CMS). |
| 9 | `articles` | CMS API (`useFeaturedArticles`) | Related articles (CMS). |
| 10 | `cta` | Page config | Final CTA (clicks tracked). |

The page data (including every section's config and localized copy) is authored
in the Django admin under **Page Builder → Pages → services** and served by
`GET /api/v1/pages/services/` — nothing about the layout is hardcoded.

## Core services (curated)

The `services` section renders a curated list from its config (`items`), each
with `icon`, `title`, `description`, `tags` (technology) and `cta`. When no
`items` are present the same component falls back to the published services
from the CMS API — one component, two modes.

## Analytics

- **Section visibility** — the renderer records `section_visible` via an
  IntersectionObserver (`useSectionVisibility`).
- **CTA clicks** — `cta_click` (primary/secondary).
- **Accordion usage** — `accordion_open`.
- **Scroll depth** — `scroll_depth` at 25/50/75/100% (`useScrollDepth`).

All events land in the in-memory analytics store and are visible in
`/dev/services`.

## Development

`/dev/services` shows the CMS payload, the rendered page and the live
analytics/render stream.

See `docs/ux/services-story.md` for the product narrative and
`docs/diagrams/services-flow.svg` / `services-page.svg` for the architecture.
