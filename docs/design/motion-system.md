# Hanahoush — Motion System

> The animation language: philosophy, effects, timings and easing. These are
> **design specifications** for later implementation (Framer Motion + GSAP).

---

## Animation philosophy

- **Motion explains, never decorates.** Every animation supports a transition,
  focus or feedback purpose.
- **Fast and calm.** Duration ≤300 ms for UI feedback; reveals ≤600 ms;
  hero intro ≤900 ms.
- **Directional consistency.** Elements move in the direction of reading
  (RTL-aware: "in" comes from the reading edge).
- **Reduced by default.** Respect `prefers-reduced-motion`: collapse to opacity
  fades or disable entirely.

## Mouse Glow

- A soft radial gradient that follows the cursor inside hero and featured
  sections (desktop only).
- Implemented via `background: radial-gradient(...)` updated from pointer
  position; throttled with `requestAnimationFrame`; hidden on touch devices.

## Cursor Orb

- A small trailing orb (blurred dot) on premium sections; optional globally.
- Only on devices with a fine pointer and reduced-motion disabled.
- Never replaces the native cursor; purely ambient.

## Parallax

- Subtle scroll parallax (max 10–15% translate) on hero graphic, section
  background layers and project imagery.
- GSAP `ScrollTrigger` or a lightweight IntersectionObserver-based translate.
- Disabled under reduced motion and on mobile (perf).

## Hero motion

- Staggered entrance: eyebrow → headline → subcopy → CTAs → visual, each
  rising 16–24 px with fade, 120 ms apart.
- The hero visual (product mock / gradient orb) scales 0.96→1 and fades in.
- Mouse-move tilts the hero card subtly (1–2°, transform-perspective).

## Cards motion

- Hover: lift 4–8 px + shadow elevation + border/ring emphasis; 150–200 ms.
- Image: slow scale 1→1.05 with overflow hidden.
- Grid reveals: staggered fade-up per card as it enters the viewport.
- Reduced motion: static hover (no lift), no image zoom.

## Page transition

- Route change: old page fades/scales out (~160 ms) → new page fades in
  (~220 ms) via Framer Motion `AnimatePresence`.
- Content below the fold reveals on scroll rather than on navigation.
- Never blocks: navigation feels instant; transitions are cosmetic overlays.

## Loading animation

- Global (axios) activity → subtle top progress bar or spinner.
- Section skeletons shimmer at 1.5 s loop.
- Initial app load → branded loader (logo glyph pulse, ~500 ms, fades out).
- Buttons show inline spinner + keep width (no layout shift).

## Scroll reveal

- IntersectionObserver-driven fade-up (16 px) + optional blur-in for large
  headings; once-per-view, threshold 0.15.
- Stagger children with 60–120 ms intervals; groups capped to avoid long tails.

## Reduced motion mode

- Global switch driven by `prefers-reduced-motion` + a user override.
- Disables: parallax, cursor orb, mouse glow, tilt, marquee scroll,
  scroll reveals (content becomes visible), long hero sequences.
- Keeps: opacity cross-fades, essential focus/feedback transitions.

## Animation durations

| Token | Duration | Use |
|-------|----------|-----|
| `fast` | 120 ms | micro-feedback (hover tint, focus ring) |
| `normal` | 200 ms | button press, card hover, menu open |
| `slow` | 300 ms | panel/drawer, modal, tooltip |
| `reveal` | 400–600 ms | scroll reveals, hero blocks |
| `hero` | 600–900 ms | hero entrance sequence |

## Animation easing

| Token | Curve |
|-------|-------|
| `standard` | `cubic-bezier(0.2, 0, 0, 1)` (Linear-style) |
| `emphasized` | `cubic-bezier(0.16, 1, 0.3, 1)` (overshoot-free) |
| `gentle` | `cubic-bezier(0.4, 0, 0.2, 1)` |
| `spring` | used sparingly for entrances (`type: "spring", damping: 20`) |

## Tooling intent

- **Framer Motion** — React declarative animations, layout, page transitions,
  `AnimatePresence`.
- **GSAP** — ScrollTrigger parallax and timeline hero where precision is needed.
- Both respect the duration/easing tokens from `design/tokens/animation.ts`.
