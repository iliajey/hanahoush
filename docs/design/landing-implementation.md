# Hanahoush — Landing Page Implementation

> Phase 7D — 13-section cinematic landing page.

## Architecture

The landing page assembles the Phase 7C Marketing Component Library on the
Phase 7B Design System foundation. Content is props-driven from static demo
data so the page always renders; React Query data-binding arrives in Phase 8.

## Sections (in order, narrative arc)

| # | Section | Marketing components used | Narrative purpose |
|---|---------|--------------------------|-------------------|
| 1 | Hero | `Hero`, `SiteBackground` | Instant value proposition |
| 2 | Statistics | `StatCard`, `StatGrid`, `SectionHeader` | Prove credibility |
| 3 | Services | `ServiceCard`, `ServiceGrid` | Show depth of capability |
| 4 | ERP (hanRP) | `ERPFeatureCard`, `ERPModules` | Differentiate with product |
| 5 | Projects | `ProjectCard`, `ProjectGrid` | Prove with delivered work |
| 6 | Articles | `ArticleCard`, `ArticleGrid` | Thought leadership |
| 7 | Tech Stack | `InfiniteLogoSlider` | Signal engineering maturity |
| 8 | Timeline | `VerticalTimeline` | Human story + longevity |
| 9 | Testimonials | `TestimonialCard`, `TestimonialGrid` | Social proof |
| 10 | Partners | `InfiniteLogoSlider` | Ecosystem trust |
| 11 | FAQ | `FAQAccordion` | Remove objections |
| 12 | Final CTA | `GradientCTA` | Conversion gate |
| 13 | Footer | `EnterpriseFooter` | Navigation + legal |

## Cinematic qualities

- **Background:** `SiteBackground` with animated grid + thin particles layer
  running throughout the page for depth.
- **Living Cursor:** Already mounted globally in `App.tsx` — interacts with all
  cards, buttons, headings and images via the Phase 7B cursor engine.
- **Scroll flow:** Each section has its own padding rhythm; `AnimatedDivider`
  separates the Hero from the next section. Every card uses `RevealContainer`
  for scroll-driven entrance.
- **Transitions:** No abrupt cuts — sections flow naturally with generous
  vertical spacing and alternating background tones (white/muted).

## Demo content

All 13 sections use static demo data so the landing page renders independently
of the backend. In production (Phase 8), the same component props will be fed
from React Query hooks bound to `/api/v1/`.

## Response

The page is served at `/` (the homepage route replaced the Phase 5 temporary
homepage).  It renders inside `AppLayout` (navbar + footer are part of the
landing, with the footer at EOF).

## Screenshot reference

See `docs/screenshots/phase-07D/` for section-by-section screenshots captured
at 1440×900px, light and dark variants. Captured from `http://localhost:5173/`.
