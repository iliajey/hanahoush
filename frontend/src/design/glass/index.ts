/**
 * Hanahoush Glassmorphism Rules.
 *
 * Where glass is allowed, where it is forbidden, and the opacity levels.
 */

export interface GlassSurface {
  background: string
  blur: string
  border: string
  saturation?: string
}

/** Opacity levels (translucent fills). */
export const opacity = {
  subtle: 0.6,
  standard: 0.7,
  strong: 0.85,
} as const

/** Glass surface presets mapped to CSS variables defined in globals.css. */
export const levels = {
  subtle: {
    background: "hsl(var(--glass-bg-subtle))",
    blur: "var(--glass-blur-subtle)",
    border: "1px solid hsl(var(--glass-border-subtle))",
  },
  standard: {
    background: "hsl(var(--glass-bg))",
    blur: "var(--glass-blur)",
    border: "1px solid hsl(var(--glass-border))",
  },
  strong: {
    background: "hsl(var(--glass-bg-strong))",
    blur: "var(--glass-blur-strong)",
    border: "1px solid hsl(var(--glass-border-strong))",
  },
} as const

export type GlassLevel = keyof typeof levels

/** Where glass is ALLOWED. */
export const allowed = [
  "sticky header / navigation surface",
  "floating feature cards over gradients",
  "dialog / modal surfaces",
  "floating action bars",
  "hero glass panels",
] as const

/** Where glass is FORBIDDEN. */
export const forbidden = [
  "long-form reading text backgrounds (contrast)",
  "forms over photographic imagery",
  "anywhere text would fall below WCAG AA contrast",
  "tiny labels / captions (blur makes edges soft)",
] as const

export const glass = { opacity, levels, allowed, forbidden } as const

export default glass
