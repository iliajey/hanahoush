/**
 * Hanahoush Shadow System — elevation scale, glass surfaces and blur levels.
 */

/** Elevation shadows (soft, indigo-tinted). */
export const shadow = {
  none: "none",
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  DEFAULT: "0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)",
  md: "0 4px 8px -2px rgb(15 23 42 / 0.08), 0 2px 4px -2px rgb(15 23 42 / 0.05)",
  lg: "0 12px 24px -6px rgb(15 23 42 / 0.12), 0 4px 8px -4px rgb(15 23 42 / 0.06)",
  xl: "0 20px 40px -8px rgb(15 23 42 / 0.16), 0 8px 16px -8px rgb(15 23 42 / 0.08)",
  "2xl": "0 32px 64px -12px rgb(15 23 42 / 0.22)",
  inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
} as const

export type ShadowToken = keyof typeof shadow

/** Dark-theme shadows are softer and indigo-tinted. */
export const shadowDark = {
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.4)",
  DEFAULT: "0 1px 3px 0 rgb(0 0 0 / 0.5), 0 1px 2px -1px rgb(0 0 0 / 0.4)",
  md: "0 4px 8px -2px rgb(0 0 0 / 0.5), 0 2px 4px -2px rgb(0 0 0 / 0.4)",
  lg: "0 12px 24px -6px rgb(0 0 0 / 0.55), 0 4px 8px -4px rgb(0 0 0 / 0.35)",
  xl: "0 20px 40px -8px rgb(0 0 0 / 0.6), 0 8px 16px -8px rgb(0 0 0 / 0.4)",
  "2xl": "0 32px 64px -12px rgb(0 0 0 / 0.7)",
  inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.4)",
} as const

export default shadow
