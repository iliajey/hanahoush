# Hanahoush — Design System

> The enterprise visual foundation (Phase 7B). Implements the token engine,
> theme engine, living cursor, background system, effects library, motion and
> accessibility foundations. Quality target: Stripe / Linear / Framer / Vercel /
> Raycast / Apple — not Bootstrap, MUI or admin templates.

---

## 1. Overview

The design system lives in `src/design/` and is consumed by Tailwind
(`tailwind.config.ts`) and CSS (`src/styles/globals.css`). Structure:

```
src/design/
├── colors/        brand, semantic, states (hover/focus/selection/scrollbar), themes
├── typography/    display/heading/body/caption/overline + fa/ar/en scripts
├── spacing/       4px grid, containers, sections, cards, responsive
├── radius/        scale + per-context radii
├── shadows/       elevation shadows (+ dark variants)
├── gradients/     brand/hero/cta/hover/mesh gradients
├── motion/        fast/medium/slow/elastic/smooth/premium presets
├── glass/         glass levels + allowed/forbidden rules
├── icons/         lucide strategy + RTL mirror list
├── illustrations/ illustration style guide
├── elevation/     shadow levels, glass levels, blur levels
├── cursor/        living-cursor tokens + HanahoushCursor
├── background/    animated grid, noise, gradient mesh, particles, SiteBackground
├── effects/       glow, glass, border-glow, magnetic, float, tilt, spotlight, reveal
└── stories/       Storybook pages for every token/effect
```

## 2. Theme Engine

- `ThemeProvider` supports `light | dark | system`, persists to
  `localStorage["hanahoush-theme"]`, and follows the OS via
  `matchMedia("(prefers-color-scheme: dark)")`.
- Switching is **animated**: a `.theme-transition` class enables a 300 ms
  color/background transition window, then is removed.
- `data-theme` + `.dark` + `color-scheme` are set on `<html>`.

## 3. Living Cursor

`HanahoushCursor` renders a **glowing orb, ambient glow and trailing ring** that
follow the pointer with soft lerp interpolation (rAF). Theme-aware via
`hsl(var(--ring) …)`. Gates:

- `pointer: fine` required (disabled on touch).
- Disabled under `prefers-reduced-motion`.
- Reduced on low-performance devices (`hardwareConcurrency < 4`,
  `deviceMemory`).
- `transform: translate3d` for GPU; `pointer-events: none`; `aria-hidden`.

## 4. Motion Engine

- Presets: `fast` (120ms), `medium` (200ms), `slow` (300ms), `elastic`,
  `smooth`, `premium` (400–600ms).
- Easings: standard `cubic-bezier(0.2,0,0,1)`, emphasized `(0.16,1,0.3,1)`.
- Triggers: hover, scroll reveal (IntersectionObserver), route transitions
  (AnimatePresence), pointer effects, loading.
- Gates: reduced motion → fades only; touch → no hover/parallax; GPU-friendly
  transform/opacity only.

## 5. Background System

- `AnimatedGrid` — masked CSS grid, slow pan (24s), subtle.
- `NoiseLayer` — film-grain SVG overlay at ~3.5% opacity (mounted globally).
- `GradientMesh` — layered radial gradients (CSS).
- `Particles` — tiny canvas particles, ≤24, DPR capped, rAF throttled, gated by
  reduced-motion/touch/low-perf.
- `SiteBackground` — composition; `NoiseLayer` is always global.

## 6. Effects Library

`Glow`, `GlassCard`, `BorderGlow`, `MagneticHover`, `FloatingCard`, `SoftTilt`,
`Spotlight`, `Reveal` — all RTL-safe, reduced-motion aware and pointer-gated.

## 7. Performance

- CSS variables first (no re-render for theme/state).
- Motion uses `transform`/`opacity` only (compositor-friendly).
- rAF loops are cancelled on unmount; `pointermove` listeners are passive.
- DPR capped at 2 for canvas; particle counts capped.
- No layout thrashing (writes batched in the cursor/particles rAF).

## 8. Accessibility

- `prefers-reduced-motion` collapses all effects to opacity fades.
- `forced-colors` mode overrides glass/borders; high-contrast ring.
- Global `:focus-visible` ring with `--focus-ring-width`.
- Custom cursor is `aria-hidden` and never replaces keyboard focus.

## 9. Usage

```ts
import { brand, gradients, motion } from "@/design"
import { GlassCard, Reveal, MagneticHover } from "@/design/effects"
import { SiteBackground } from "@/design/background"
```

Global surfaces (`HanahoushCursor`, `NoiseLayer`) are mounted in `App`.
The dev-only **Design Playground** lives at `/design` (production build omits it).

## 10. Storybook

- `Design System/Tokens` — colors, gradients, radius, shadows, glass, motion.
- `Design System/Effects` — every effect live.
- `Design System/Cursor` — living cursor preview.
- `Design System/Background` — grid/mesh/particles/composition.
