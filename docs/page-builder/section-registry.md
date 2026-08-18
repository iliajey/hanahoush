# Page Builder — Section Registry

The section registry is the single mapping between a backend `section_type`
and a React component. It lives in `src/features/page-builder/registry/` and
is mirrored in the database (`SectionConfiguration`) and served by
`GET /api/v1/page-builder/`.

## Registered sections

| type | Component | Data source |
|---|---|---|
| `hero` | `HeroSection` | section config + `/hero/` + site settings (tagline) |
| `statistics` | `StatisticsSection` | `useSiteStats()` (live API counts) |
| `services` | `ServicesSection` | `useServices()` |
| `erp` | `ERPSection` | section config (features + module status) |
| `projects` | `ProjectsSection` | `useFeaturedProjects()` |
| `articles` | `ArticlesSection` | `useFeaturedArticles()` |
| `about` | `AboutSection` | `useAbout()` |
| `team` | `TeamSection` | `useTeam()` |
| `timeline` | `TimelineSection` | `useTimeline()` |
| `partners` | `PartnersSection` | `usePartners()` |
| `testimonials` | `TestimonialsSection` | `useTestimonials({ is_featured })` |
| `faq` | `FAQSection` | `useFAQs()` |
| `cta` | `CTASection` | section config (copy + CTAs) |
| `footer` | `FooterSection` | `useFooter()` |

The landing page is composed from: hero → statistics → services → projects →
articles → about → team → timeline → testimonials → partners → faq → cta.

## How a section is resolved

```
section_type (from Page JSON)
        │
        ▼
isRegisteredSection(type)?
   ├─ yes → registry[type]  (React.lazy → Suspense → SectionBoundary)
   └─ no  → <UnknownSectionFallback type=… />
```

- **Lazy loading:** every section is `React.lazy(...)` — a section's code
  chunk is only fetched when the section actually renders.
- **Error boundary:** each section is wrapped in `SectionBoundary`; a crash in
  one section shows a local fallback and does not unmount the page.
- **Deduplication:** the DB enforces one `(page, section_type)` per page and
  the renderer additionally collapses duplicates.
- **Enable/disable:** disabled sections are filtered out server-side and
  skipped client-side.

## Adding a new section

1. Create `registry/sections/MySection.tsx` (default-export a component that
   accepts `{ config }: SectionProps`).
2. Add `"mysection"` to `SECTION_TYPES` in `config/index.ts`.
3. Add a lazy entry to `registry/index.ts` plus `NAME`/`DESCRIPTION` entries.
4. Add a `SectionConfiguration` row (admin or seed) with a default config and
   the available locales.

The API exposes the new section automatically via `/api/v1/page-builder/`.

## Configuration shape

Sections read a **language-resolved** object (the API flattens
`config` + `language_overrides` with the active locale). Common keys
recognised by most sections: `eyebrow`, `title`, `description`,
`page_size`/`limit`, `featured`. CTA/hero/erp consume nested `primary`,
`secondary`, `features`, `modules` objects.