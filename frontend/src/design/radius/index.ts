/**
 * Hanahoush Radius System — scale + per-context radii.
 */

/** Radius scale (derived from `--radius`). */
export const radius = {
  none: "0",
  sm: "calc(var(--radius) - 4px)",
  md: "calc(var(--radius) - 2px)",
  lg: "var(--radius)",
  xl: "calc(var(--radius) + 4px)",
  "2xl": "calc(var(--radius) + 8px)",
  "3xl": "calc(var(--radius) + 12px)",
  full: "9999px",
} as const

export type RadiusToken = keyof typeof radius

/** Radius by UI context. */
export const contexts = {
  card: "lg",
  cardHover: "xl",
  button: "md",
  input: "md",
  dialog: "xl",
  floatingPanel: "2xl",
  chip: "full",
  avatar: "full",
  hero: "2xl",
} as const

export const radiusSystem = { radius, contexts } as const

export default radiusSystem
