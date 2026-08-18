# Page Builder — Architecture

The Enterprise Dynamic Page Composition Engine lets every public page be
assembled at runtime from configurable sections instead of hardcoded layouts.

## Overview

```
┌──────────────┐   compose    ┌──────────────────────┐   serve     ┌──────────────┐
│  Django Admin │ ───────────▶ │  apps/page_builder/  │ ───────────▶ │   Frontend   │
│  (sortable,  │   pages      │  Page · PageSection   │  /api/v1/   │  features/   │
│  inline, live│   sections   │  SectionConfiguration  │  pages/…    │  page-builder│
│  preview)    │   nav/footer │  NavigationMenu/Item   │  page-builder│  PageRenderer│
└──────────────┘             │  Footer/Announcement/  │  navigation/│  registry/   │
                             │  Hero/SEO/RedirectRule  │  footer/…   │  renderer/   │
                             └──────────────────────┘             └──────────────┘
```

## Backend (`apps/page_builder`)

### Models

| Model | Role |
|---|---|
| `Page` | Top-level page: slug, fa/en/ar titles, draft/published/archived status, `version` + `version_at`, `is_home`, soft delete, ordering. |
| `PageSection` | A row within a page: `section_type`, `sort_order`, `is_enabled`, JSON `config` + `language_overrides`. Unique per `(page, section_type)` — duplicated sections are impossible. |
| `SectionConfiguration` | DB-backed registry of section types (name, description, icon, default config, available locales). Drives the admin picker and `/api/v1/page-builder/`. |
| `NavigationMenu` / `NavigationItem` | Ordered, sortable navigation (dropdown support via `parent`, per-item enable + CTA highlight). |
| `FooterConfiguration` | Singleton footer: localized copyright, show-socials/newsletter toggles, JSON columns. |
| `AnnouncementBar` | Singleton, time-boxed, dismissible announcement bar. |
| `HeroConfiguration` | Singleton default hero copy + visuals (the Hero section resolves config → this singleton). |
| `SEOConfiguration` | Per-page (OneToOne) or site-wide default (page=None): localized title/description, keywords, canonical, robots, OG image. |
| `RedirectRule` | Ordered redirect rules (301/302) for middleware/edge. |

### Versioning

`Page.version` increments automatically whenever a published page transitions
out of and back into `published` (see `Page.save`). `version_at` records the
timestamp of the current version — a lightweight content-version stamp for
cache-busting and audit.

### Localization

- Multilingual text lives in `*_fa/_en/_ar` columns.
- Section `config` may hold **localized values as nested objects**:
  `{"headline": {"fa": "…", "en": "…", "ar": "…"}}`.
- `PageSection.language_overrides` holds per-locale overrides applied on top.
- `apps/page_builder/localization.resolve_section_config(config, overrides, lang)`
  flattens both into a language-resolved dict at request time using
  `Accept-Language`.

## Admin

- `PageSection` and `NavigationItem` are **sortable inlines**
  (`adminsortable2.SortableInlineAdminMixin`) — drag-and-drop ordering.
- Sections are **inline-editable** on the Page change form (type, title,
  enable/disable, JSON config, overrides).
- Live preview URL is generated per page (`/pages/{slug}/`) for published pages.
- Validation: `PageForm` requires the English title; `SectionInlineForm`
  rejects unknown `section_type` values.
- Singleton protection (`SingletonAdminMixin`): FooterConfiguration,
  AnnouncementBar and HeroConfiguration cannot be added/deleted once one row
  exists; the changelist redirects to the change form.
- `is_home` and `is_default` (navigation) are kept singleton via
  `save_model`.

## API

| Endpoint | Description |
|---|---|
| `GET /api/v1/pages/` | Published page index (pagination, filtering by `is_home`/`template`, search, ordering). |
| `GET /api/v1/pages/{slug}/` | Composed page: SEO + ordered, **enabled** sections with language-resolved config. |
| `GET /api/v1/page-builder/` | Section registry + page index (dev console). |
| `GET /api/v1/navigation/` | Default navigation menu (items + CTA + contact). |
| `GET /api/v1/footer/` | Footer columns + socials + company info. |
| `GET /api/v1/announcement/` | Announcement bar. |
| `GET /api/v1/seo/?slug=…` | Per-page SEO (or site default). |
| `GET /api/v1/hero/` | Default hero configuration. |
| `GET /api/v1/redirects/` | Redirect rules. |

All reuse the standard Hanahoush envelope
(`{success, message, data, errors, pagination}`) and honor `Accept-Language`.
**Draft protection:** only `status=published` pages are ever returned.

## Frontend (`src/features/page-builder`)

| Module | Purpose |
|---|---|
| `types/` | Page / PageSection / SectionConfig / registry / SEO / announcement types. |
| `api/` | Typed fetchers for every page-builder endpoint. |
| `hooks/` | `usePage`, `usePageList`, `usePageBuilderRegistry`, `useAnnouncement`, `useSEO`, `useHeroConfig` + `pbKeys` + `invalidatePageBuilderCache`. |
| `config/` | Canonical section-type catalog + fallback defaults + analytics flags. |
| `registry/` | Maps section type → lazy component + metadata; `getSectionComponent`, `registeredSections`. |
| `renderer/` | `<PageRenderer />`, per-section `SectionBoundary`, lazy `SectionSkeleton`, unknown-section fallback, render analytics. |
| `components/` | `AnnouncementBar`, `PageNavigation`. |
| `dev/` | `/dev/page-builder` console (page selector, section order, timing, lazy/analytics). |

## Data flow

1. A route loads a `Page` via `usePage(slug)` (React Query, locale-scoped key).
2. `<PageRenderer page={page} />` iterates the ordered sections, skipping
   disabled ones and deduplicating types.
3. Each section is wrapped in `SectionBoundary` + `Suspense` and loaded
   **lazily** from the registry.
4. The section component resolves its language-ready `config` and renders the
   existing marketing component (Hero, ServiceGrid, ProjectGrid, …) fed by the
   Phase 8A CMS hooks.
5. Render analytics (type, status, timing) are recorded and visible in
   `/dev/page-builder`.

See `docs/page-builder/usage.md` for the walkthrough and
`docs/page-builder/section-registry.md` for the section catalogue.
