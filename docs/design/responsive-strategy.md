# Hanahoush — Responsive Strategy

> How the interface adapts across viewports: ultra-wide, desktop, laptop,
> tablet and mobile. Follows a mobile-first, breakpoint-up build.

---

## Breakpoints

| Tier | Range | Build approach |
|------|-------|----------------|
| Mobile | <640px | default (base) styles |
| Tablet (sm) | ≥640px | `sm:` adjustments |
| Laptop (md) | ≥768px | two-column layouts |
| Desktop (lg) | ≥1024px | full nav, grids 3–4 col |
| Wide (xl) | ≥1280px | container max-width, extra columns |
| Ultra-wide (2xl) | ≥1536px | centered container, larger type |

## Desktop (≥1024px)

- Full horizontal nav + mega menu; 3–4 column grids; side-by-side split
  sections (hero, ERP).
- Mouse interactions (glow, orb, tilt, parallax) enabled.

## Laptop (768–1023px)

- Same layouts as desktop with narrower container; grids collapse to 2–3
  columns; mega menu still available but preferred as click-open.
- Cursor/mouse effects remain, parallax slightly reduced.

## Tablet (≥640px, <1024px)

- Nav switches to drawer; grids 2 columns; hero stacks (text above visual).
- Touch-first targets (≥44px); hover effects become tap/active states.

## Mobile (<640px)

- Single column everywhere; stack hero, stats (2×2), services (1 col),
  timeline collapses to one side.
- Drawer navigation; sticky bottom contact bar optional for lead capture.
- Disable: mega menu, parallax, cursor effects, marquee (static scroll).
- Font scale: display 32–40px; body ≥16px to prevent iOS zoom.

## Ultra-wide (≥1536px)

- Content stays in the container (`max-w-7xl`/1440px) — never full-bleed
  prose.
- Ambience (orbs, grids) extends to the viewport edges.
- Larger type on displays `text-6xl/7xl`; grids may add a 4th/5th column for
  cards, but hero and key messages remain centered/constrained.

## Layout rules

- `container-hanahoush` provides consistent gutters: `px-4 sm:px-6 lg:px-8`.
- Grids use explicit column maps (`component-map.md` → Grid) — no unmanaged
  auto-fit columns that break at odd widths.
- Images: `object-cover` with fixed aspect ratios (`aspect-video`,
  `aspect-[4/3]`) to prevent layout shift.
- Touch: interactive targets ≥44×44px on touch tiers; focus rings always.

## Performance guardrails

- Above-the-fold CSS critical-path; images `loading="lazy"` below the fold
  and `fetchpriority="high"` for the hero.
- Fonts: `font-display: swap`; subset preload for the active locale.
- No pointer effects on touch; IntersectionObserver-based reveals gated by
  `matchMedia("(pointer: fine)")`.
