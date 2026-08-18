/**
 * Hanahoush Elevation System — shadow levels, glass levels, blur levels.
 */

/** Elevation scale (shadow + semantic name). */
export const elevation = {
  0: { name: "flat", shadow: "var(--shadow-flat)" },
  1: { name: "raised", shadow: "var(--shadow-sm)" },
  2: { name: "card", shadow: "var(--shadow-md)" },
  3: { name: "floating", shadow: "var(--shadow-lg)" },
  4: { name: "overlay", shadow: "var(--shadow-xl)" },
  5: { name: "modal", shadow: "var(--shadow-2xl)" },
} as const

export type ElevationLevel = keyof typeof elevation

/** Glass surface levels: bg opacity + blur + border. */
export const glassLevels = {
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

export type GlassLevelToken = keyof typeof glassLevels

/** Blur scale. */
export const blurLevels = {
  none: "0",
  xs: "2px",
  sm: "4px",
  md: "8px",
  lg: "12px",
  xl: "20px",
  "2xl": "32px",
} as const

export type BlurLevel = keyof typeof blurLevels

export const elevationSystem = { elevation, glassLevels, blurLevels } as const

export default elevationSystem
