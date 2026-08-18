# Hanahoush — Implementation Roadmap

> How the UX specification becomes a shipped website, split into build phases.
> Every phase lists deliverables, dependencies, estimated files and complexity.

---

## Phase 7B — Wireframes

- **Deliverables:** Lo-fi wireframes for all 17 pages and the 13 landing
  sections; navigation flows (desktop/mobile); content-block inventory.
- **Dependencies:** Product vision, UX specification, information architecture.
- **Estimated files:** wireframe set (Figma/Excalidraw) + `docs/design/wireframes/`
  index (optional markdown map).
- **Expected complexity:** Low–Medium (design artifacts, no code).

## Phase 7C — Design System

- **Deliverables:** Token refinement, brand gradients, marketing components
  (Hero, ServiceCard, ProjectCard, ArticleCard, StatCounter, Timeline,
  TechnologyMarquee, TestimonialCarousel, FAQList, CTABand, MegaMenu,
  MobileDrawer, StickyHeader), Storybook stories, dark/light + RTL snapshots.
- **Dependencies:** `component-map.md`, `design-language.md`,
  `brand-guidelines.md`, `motion-system.md`.
- **Estimated files:** ~28 new components + ~30 stories + token/theme updates.
- **Expected complexity:** High (the core visual build).

## Phase 7D — Landing Page

- **Deliverables:** The full Home page with all 13 sections, wired to the API
  (services, projects, articles, technologies, testimonials, partners, FAQ),
  hero motion, statistics counters, SEO meta, loading/empty/error states.
- **Dependencies:** Phase 7C components; backend content APIs.
- **Estimated files:** `src/app/routes/pages/HomePage.tsx` + section components
  + i18n keys + SEO config.
- **Expected complexity:** High (integration + motion).

## Phase 8 — Business Pages

- **Deliverables:** Services (+ detail), Projects (+ detail + gallery), Articles
  (+ detail + category/tag), About, Contact (form → `contact-requests`),
  Search results, Privacy, Terms, 404.
- **Dependencies:** Phase 7C components; landing patterns; backend APIs.
- **Estimated files:** ~10 route pages + ~12 section/feature components + forms.
- **Expected complexity:** High (breadth).

## Phase 9 — Dashboard UX

- **Deliverables:** Role-aware dashboard (welcome, current user, role, stat
  cards), navigation, empty states, session handling, optional admin/analytics
  widgets.
- **Dependencies:** Auth (Phase 6), React Query, design system.
- **Estimated files:** `src/features/dashboard/*` + role utility + route wiring.
- **Expected complexity:** Medium–High.

---

## Sequencing rules

- Each phase must pass: `tsc`, ESLint, `vitest`, `vite build`, Storybook build.
- New components ship with stories; no page ships without loading/empty/error
  states and RTL check.
- The roadmap assumes the Phase 6.6 environment (PostgreSQL local setup) is
  resolved so content APIs are testable end-to-end.
