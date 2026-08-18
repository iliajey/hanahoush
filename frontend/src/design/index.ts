/**
 * Hanahoush Design System — master barrel.
 *
 * Exposes every token category and the design-system components (cursor,
 * background, effects). Import from `@/design` for convenience.
 */

export * from "./colors"
export * from "./typography"
export * from "./spacing"
export * from "./radius"
export * from "./shadows"
export * from "./elevation"
export * from "./gradients"
export * from "./motion"
export * from "./glass"
export * from "./icons"
export * from "./illustrations"
export * from "./cursor"

// Components (cursor / background / effects)
export { HanahoushCursor, useCursorEnabled } from "./cursor/HanahoushCursor"
export {
  SiteBackground,
  AnimatedGrid,
  NoiseLayer,
  GradientMesh,
  Particles,
} from "./background"
export {
  Glow,
  GlassCard,
  BorderGlow,
  MagneticHover,
  FloatingCard,
  SoftTilt,
  Spotlight,
  Reveal,
} from "./effects"

// Legacy token barrel kept for backward compatibility (tailwind config, old
// stories). The category exports above are the source of truth.
