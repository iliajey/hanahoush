# Hanahoush — Design Language

> The visual identity system: color, spacing, radius, elevation, typography,
> glassmorphism, shadows, icons, illustrations and photography. These build on
> the existing `src/design/tokens` and `src/styles/globals.css` foundations.

---

## Color philosophy

- **Calm, premium, bold.** A violet-magenta primary (`#932990`, measured from
  the brand mark) on a near-white surface (light) and a deep indigo-violet
  surface (dark), paired with deep-indigo ink (`#272161`) text.
- **Semantic tokens drive everything** (`primary`, `surface`, `text`,
  `muted`, `border`, `ring`, `success`, `warning`, `error`, `info`).
- Color is used for meaning (CTA, status, selection), not decoration.
- Dark theme is first-class, not an afterthought.
- The mark's magenta → indigo gradient is reserved for identity moments
  (logo, CTA panels, footer signature), never for body content.

## Spacing system

- 4 px base scale (tokens: `spacing.1 … spacing.96`).
- Section rhythm: `py-24` on desktop, `py-16` on mobile.
- Component padding uses a consistent 4/8/16/24 scale.
- Tight headlines (`tracking-tight`) + generous card padding = premium feel.

## Radius system

- Base `--radius: 0.5rem` (8 px).
- Buttons/inputs: `md` (6–8 px). Cards: `lg`/`xl` (8–12 px). Modals: `xl`.
- Large hero containers: `2xl` (16 px). Pills/avatars: `full`.
- Radii shrink slightly on mobile to keep density.

## Elevation

| Level | Token | Use |
|-------|-------|-----|
| 0 | none | flat surfaces, cards on colored bands |
| 1 | `shadow-sm` | inputs, subtle cards |
| 2 | `shadow` / `md` | standard cards |
| 3 | `lg`/`xl` | floating panels, dropdowns |
| 4 | `2xl` | modals, sticky header on scroll |

## Typography

- **Persian:** Vazirmatn Variable (headings + body).
- **Latin:** Inter Variable.
- Hierarchy:
  - Display: `text-5xl/6xl font-bold tracking-tight` (hero).
  - Heading 1/2/3: `text-3xl/2xl/xl font-semibold`.
  - Body: `text-base text-foreground/80`.
  - Caption/meta: `text-sm text-muted-foreground`.
- Line length capped (~65–75ch) for reading pages; larger type in RTL to
  compensate for glyph density.

## Glassmorphism rules

- Used **sparingly** for the sticky header and floating feature cards:
  `bg-background/70 backdrop-blur-md border-white/10`.
- Never on body text over imagery (contrast risk); always pair with a solid
  fallback for reduced support.
- Hero "glass" cards sit over gradients, not over photos.

## Shadow rules

- Shadows are **soft, low-opacity, indigo-tinted** in dark mode.
- Default: `0 1px 3px rgb(0 0 0 / 0.08)`; elevated: `0 12px 24px -8px`.
- Hover elevation transitions at 150–200 ms.
- Avoid hard drop shadows on cards with borders (use one or the other).

## Icons

- **Lucide** (stroke style) for UI consistency (already used).
- 16/20/24 px sizes; `stroke-width 1.75–2`.
- RTL-aware: directional icons mirror (`ChevronRight` → `ChevronLeft`),
  handled by the icon layer, not per-call-site.
- Brand/stack icons (Django, React, Odoo, PostgreSQL) use their official
  glyphs in muted single color for the technology marquee.

## Illustrations

- Minimal geometric/abstract system: gradient orbs, grid lines, isometric
  shapes — **not** stock clip-art.
- Product visuals: stylized UI mocks rendered as components/figma exports.
- Illustration supports the story (hero, ERP section, empty states).

## Photography

- Real-team / real-office photography only where available; otherwise
  abstract product visuals.
- Consistent treatment: desaturated warm-cool grade, soft shadows, consistent
  aspect ratios (4:3 cards, 16:9 heroes).
- Portraits for team/testimonials: same crop + overlay style.

## Gradient rules

- Brand gradient: `brand-600 → brand-950` (violet-magenta → deep indigo,
  mirroring the brand mark) — used on the logo, CTA panels, hero orbs, section
  dividers and the footer signature hairline.
- Gradients are subtle; never clash with semantic text colors.
- Dark mode gradients lower luminance (deeper indigo, higher contrast text).
