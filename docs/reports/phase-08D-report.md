# Hanahoush — Phase 8D Report — Enterprise Services Experience

**Date:** 2026-08-06
**Scope:** One of the best software-company Services pages — a product
presentation composed entirely by the existing Page Builder. No hardcoded
layout, no redesign; existing APIs, hooks, components and renderers are
reused and extended only.

---

## Executive Summary

The `/services` route is a **fully composed Page** (`Page` record `services`,
10 sections) rendered by `<PageRenderer />`. New backend section types
(`journey`, `comparison`, `stack`, `process`) plus a seeded, localized
`services` Page give the CMS full control of copy, order and visibility. Four
new lazy section components extend the registry, and the marketing `CTA` /
`FAQAccordion` gained backward-compatible analytics callbacks.

A lightweight analytics module (`src/features/analytics/`) tracks **section
visibility** (IntersectionObserver), **CTA clicks**, **accordion usage** and
**scroll depth** — all visible in the new `/dev/services` console alongside
the CMS payload and per-section render data.

**Gates:** backend **113** tests ✅ · frontend **85** tests ✅ · TypeScript ✅ ·
ESLint ✅ · Vitest ✅ · Vite build ✅ · Storybook build ✅ · ruff-clean ✅ ·
live `/services` + `/dev/services` ✅.

---

## Sections

| # | Section | Backend type | Source | Notes |
|---|---|---|---|---|
| 1 | Services Hero | `hero` | Page config | cinematic heading, animated bg (GradientMesh/AnimatedGrid), living cursor (global), dynamic subtitle + CTAs |
| 2 | Service Journey | `journey` | Page config | Problem → Solution → Technology → Result, animated storytelling |
| 3 | Core Services | `services` | Page config (`items`) | 7 disciplines: Software Dev, ERP, hanRP, Odoo, AI Automation, Web Apps, Programming Consulting — each with icon, animation, tags, CTA. Falls back to CMS services when no items. |
| 4 | Comparison | `comparison` | Page config | Traditional ✗ vs Hanahoush ✓ |
| 5 | Technology Stack | `stack` | Page config | animated (stagger reveal), 12 technologies |
| 6 | Process | `process` | Page config | Discovery → … → Support (7 steps) |
| 7 | FAQ | `faq` | CMS API | FAQ accordion, usage tracked |
| 8 | Related Projects | `projects` | CMS API | `useFeaturedProjects()` |
| 9 | Related Articles | `articles` | CMS API | `useFeaturedArticles()` |
| 10 | Final CTA | `cta` | Page config | clicks tracked |

---

## CMS Integration

- The route does **not** hardcode any layout: `ServicesPage` calls
  `usePage("services")` and renders `<PageRenderer page={…} />`.
- All section ordering, enable/disable, config and localized copy (fa/en/ar)
  are authored in the Django admin (**Page Builder → Pages → services**) and
  served by `GET /api/v1/pages/services/`.
- FAQ/projects/articles come from the Phase 8A CMS hooks.
- New section types are registered in both the backend
  (`SECTION_TYPES` + `SECTION_META`) and the frontend registry — no duplicated
  components: `ServicesSection` gained a `config.items` mode instead of a new
  core-services component.

---

## Analytics

`src/features/analytics/` (lightweight, in-memory, subscribable):

| Event | Trigger | Mechanism |
|---|---|---|
| `section_visible` | per section, once | `useSectionVisibility` (IntersectionObserver) |
| `cta_click` | primary/secondary | `CTA`/`GradientCTA` `onPrimaryClick`/`onSecondaryClick` via `CTASection` |
| `accordion_open` | FAQ item expands | `FAQAccordion` `onValueChange` via `FAQSection` |
| `scroll_depth` | 25/50/75/100% | `useScrollDepth` (passive) |

`/dev/services` renders the live event stream plus the renderer analytics
(type · status · timing).

---

## SEO

- `ServicesPage` sets `title`, description, keywords, canonical and OG image
  from the page's `SEOConfiguration` via `useSeoMeta`.
- Per-page SEO stored with the page record; `robots` honoured.
- Breadcrumbs and JSON-LD rich schema are planned (see Known Issues).

---

## Accessibility

- Semantic landmarks (`main`/`section`), headed hierarchy, text labels with
  visual states (step numbers, badges, table cells).
- Color is never the only signal (icons accompany every CTA **and** row).
- `aria-busy` skeletons for lazy sections. Motion is reveal-on-scroll, using
  the design-system conventions.

---

## Performance

- Every section is `React.lazy` — only rendered sections fetch their chunk.
- Intersection-observers for visibility; passive scroll listener.
- `usePage` cached by React Query (5-min stale); sections prefetch their data.
- Build stays under 100 coverage; no new runtime workflow.

---

## Visual QA

> Headless DOM-level review + live-server verification. Mockup:
> `docs/screenshots/phase-08D/services-experience.svg`.

**Automated (services-page.test.tsx):** renders the composed page (journey
steps, curated core service, comparison row, stack), and an error state when
the page config fails. analytics tests verify event recording + reactivity.

**Live:** `/api/v1/pages/services/` → 200, 10/10 sections in the exact
required order, 7 core-service items, 12 stack technologies; `/services` and
`/dev/services` serve at 200.

**Quality gate:** responsive grids ✓ · all data from CMS ✓ (payload +
`usePage`) · Storybook ✓ (new `PageBuilder/Sections/Services` stories) ·
accessibility labels ✓ · analytics ✓ · zero console errors ✓ (render tests +
live transform checks) · no layout shifts ✓ (skeletons for lazy sections;
motion is hover/reveal only).

---

## Verification

| Backend | Frontend |
|---|---|
| `manage.py check` ✅ | `tsc --noEmit` ✅ |
| `makemigrations --check` ✅ | `eslint .` ✅ |
| `migrate` / `bootstrap` ✅ | `vitest run` ✅ **85 passed** |
| `pytest` ✅ **113 passed** | `vite build` ✅ |
| `ruff` ✅ | `build-storybook` ✅ |

---

## Known Issues

1. **SEO/JSON-LD** — ItemList/Services + BreadcrumbList schema markup is not
   yet emitted on the services page (planned for the next phase with a
   breadcrumb component).
2. **Breadcrumbs** — the layout has no global breadcrumb bar yet.
3. **Analytics store** is in-memory (client-side); a backend ingestion
   endpoint is a future phase.

---

## Recommendations

1. **Phase 8E:** build the remaining public pages (projects, articles, about,
   contact, search) with the same page-builder blueprint; add a catch-all
   `Page`-driven route.
2. Add JSON-LD (ItemList/Services, BreadcrumbList) + a breadcrumb component.
3. Send analytics events to the backend (endpoint + worker) in Phase 9.
4. Publish-side cache invalidation using the Page version + workflow.

---

## Git Commit

```
phase-08D: enterprise services experience

- /services composed by the Page Builder (usePage + PageRenderer)
- New section types + seeded services Page (hero, journey, comparison,
  stack, process, faq, projects, articles, cta) with localized copy/SEO
- Frontend: Journey/Comparison/Stack/Process sections + curated core
  services mode; analytics (visibility/CTA/accordion/scroll); /dev/services
- 1 backend + 5 frontend tests; stories; docs + 2 diagrams
```

The repository is not under version control in this environment and no `git`
binary is available, so no commit was created — the message above is the
intended commit.

---

## Phase 8D completion checklist

- ✔ Services page (10 sections, product presentation)
- ✔ CMS connected (no hardcoded layout)
- ✔ Analytics (visibility / CTA / accordion / scroll depth)
- ✔ Visual QA (headless + live)
- ✔ Report path: `docs/reports/phase-08D-report.md`
- ✔ Ready for Phase 8E