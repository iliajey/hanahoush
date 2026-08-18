/**
 * Hanahoush Spacing System — 4px grid, containers, sections, cards, responsive.
 */

/** 4px grid scale. */
export const spacing = {
  0: "0",
  px: "1px",
  0.5: "0.125rem",
  1: "0.25rem",
  1.5: "0.375rem",
  2: "0.5rem",
  2.5: "0.625rem",
  3: "0.75rem",
  3.5: "0.875rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  7: "1.75rem",
  8: "2rem",
  9: "2.25rem",
  10: "2.5rem",
  11: "2.75rem",
  12: "3rem",
  14: "3.5rem",
  16: "4rem",
  20: "5rem",
  24: "6rem",
  28: "7rem",
  32: "8rem",
  36: "9rem",
  40: "10rem",
  44: "11rem",
  48: "12rem",
  52: "13rem",
  56: "14rem",
  60: "15rem",
  64: "16rem",
  72: "18rem",
  80: "20rem",
  96: "24rem",
} as const

export type SpacingToken = keyof typeof spacing

/** Container widths. */
export const containers = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1440px",
  full: "100%",
} as const

export const containerPadding = {
  sm: "1rem",
  md: "1.5rem",
  lg: "2rem",
} as const

/** Section vertical rhythm (mobile-first). */
export const sections = {
  sm: { y: "py-10 sm:py-12" },
  md: { y: "py-14 sm:py-16 lg:py-20" },
  lg: { y: "py-16 sm:py-20 lg:py-24" },
  xl: { y: "py-20 sm:py-24 lg:py-32" },
} as const

/** Card padding scale. */
export const cards = {
  sm: "p-4",
  md: "p-5 sm:p-6",
  lg: "p-6 sm:p-8",
  xl: "p-8 sm:p-10",
} as const

/** Responsive gutter + column helper tokens. */
export const responsive = {
  gutter: "px-4 sm:px-6 lg:px-8",
  container: "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8",
  gap: { sm: "gap-3", md: "gap-6", lg: "gap-8" },
} as const

export const spacingSystem = { spacing, containers, containerPadding, sections, cards, responsive } as const

export default spacingSystem
