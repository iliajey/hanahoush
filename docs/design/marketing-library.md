# Hanahoush — Marketing Component Library

> Phase 7C — complete set of premium marketing components built on Phase 7B design tokens and effects.

---

## 1. Organization

```
src/components/marketing/
├── common/         SectionHeader, RevealContainer, GlassPanel, SpotlightContainer, AnimatedDivider, GlowBorder, FloatingBadge
├── hero/           Hero (animated headline, subtitle, CTAs, background effects)
├── statistics/     StatCard, StatGrid (animated counters, glass cards, trend indicators)
├── services/       ServiceCard, ServiceGrid, ServiceIcon
├── projects/       ProjectCard, ProjectGrid, TechnologyChip, GalleryPreview
├── articles/       ArticleCard, ArticleGrid, CategoryBadge, ReadingTime
├── erp/            ERPFeatureCard, ERPModules, ERPTimeline, ERPArchitecturePlaceholder
├── timeline/       Milestone, VerticalTimeline, HorizontalTimeline
├── testimonials/   TestimonialCard, TestimonialGrid
├── partners/       LogoCloud, InfiniteLogoSlider
├── faq/            FAQAccordion, FAQSearch, FAQCategoryFilter
├── cta/            CTA, LargeCTA, SplitCTA, GradientCTA
├── contact/        ContactCard, OfficeCard, MapPlaceholder
├── footer/         EnterpriseFooter
└── index.ts        master barrel
```

## 2. Component Catalog

### Common (7)

| Component | Purpose |
|-----------|---------|
| `SectionHeader` | Eyebrow + headline + description; center/start alignment |
| `RevealContainer` | Scroll-triggered fade-up wrapper (IntersectionObserver via CSS) |
| `GlassPanel` | Glass surface card (subtle/standard/strong levels) |
| `SpotlightContainer` | Mouse-tracking radial highlight card |
| `AnimatedDivider` | Decorated divider with gradient lines and dots |
| `GlowBorder` | Gradient border glow card |
| `FloatingBadge` | Animated pill badge (CSS float animation) |

### Hero (1)
- `Hero` — Animated headline (Framer Motion stagger), subtitle, CTA buttons, background effects (grid + mesh). Supports center/start alignment.

### Statistics (2)
- `StatCard` — Glass card with value, label, trend indicator.
- `StatGrid` — Grid layout for stat cards.

### Services (3)
- `ServiceCard` — Icon + title + description + feature bullets + learn-more.
- `ServiceGrid` — 2/3-column grid layout.
- `ServiceIcon` — Icon wrapper.

### Projects (4)
- `ProjectCard` — Image + title + description + technology tags + client.
- `ProjectGrid` — Grid layout.
- `TechnologyChip` — Technology badge.
- `GalleryPreview` — 3-image row preview.

### Articles (4)
- `ArticleCard` — Image + category + date + reading time + title + description.
- `ArticleGrid` — Grid layout.
- `CategoryBadge` — Category label.
- `ReadingTime` — Reading time display.

### ERP (4)
- `ERPFeatureCard` — Icon + title + description card.
- `ERPModules` — Module status grid (live/soon).
- `ERPTimeline` — Vertical timeline with year markers.
- `ERPArchitecturePlaceholder` — Dashed-area placeholder.

### Timeline (3)
- `Milestone` — Vertical timeline node with date, title, description, icon.
- `VerticalTimeline` — Vertical stack of milestones.
- `HorizontalTimeline` — Horizontal scrollable milestone strip.

### Testimonials (2)
- `TestimonialCard` — Quote + star rating + name + role + company + avatar.
- `TestimonialGrid` — Grid layout.

### Partners (2)
- `LogoCloud` — Static logo grid (grayscale → color on hover).
- `InfiniteLogoSlider` — Auto-scrolling logo marquee (CSS animation).

### FAQ (3)
- `FAQAccordion` — Accordion question/answer list.
- `FAQSearch` — Text search input.
- `FAQCategoryFilter` — Category pills.

### CTA (4)
- `CTA` — Flexible CTA (default/split/gradient variants).
- `LargeCTA` — Large centered CTA.
- `SplitCTA` — Two-column CTA.
- `GradientCTA` — Brand-gradient CTA band.

### Contact (3)
- `ContactCard` — Icon + title + content card (mail/phone/map).
- `OfficeCard` — Office location card.
- `MapPlaceholder` — Map area placeholder.

### Footer (1)
- `EnterpriseFooter` — Multi-column footer with company/services/resources links, newsletter, socials, and copyright.

**Total: 43 components across 14 categories.**

## 3. Quality

- All components use Phase 7B design tokens (`@/design` or CSS variables).
- All are RTL-safe via logical properties (`start/end`, `ms/me`).
- Every component supports: scroll reveal (RevealContainer), reduced motion, hover feedback, focus states, and theme switching.
- Premium look: soft shadows, generous spacing, glass surfaces, gradient accents, animated micro-interactions. No Bootstrap/Material UI appearance.
- Dev preview at `/dev/marketing` (development only).
