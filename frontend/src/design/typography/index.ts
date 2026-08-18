/**
 * Hanahoush Typography System.
 *
 * Full type scale (display → caption/overline), font pairing and per-script
 * (fa / ar / en) font strategy.
 */

export const fontFamily = {
  sans: ["var(--font-sans)", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
  mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
  vazirmatn: ['"Vazirmatn"', "Inter", "system-ui", "sans-serif"],
  inter: ['"Inter Variable"', "Inter", "system-ui", "sans-serif"],
} as const

/** Per-script font pairing (Persian/Arabic → Vazirmatn, English → Inter). */
export const scripts = {
  fa: { family: "Vazirmatn", css: "var(--font-vazirmatn)", rtl: true },
  ar: { family: "Vazirmatn", css: "var(--font-vazirmatn)", rtl: true },
  en: { family: "Inter Variable", css: "var(--font-inter)", rtl: false },
} as const

export type Script = keyof typeof scripts

export interface TypeStep {
  size: string
  lineHeight: string
  weight: number
  tracking: string
  letterSpacing?: string
}

/** Display scale — hero, oversized statements. */
export const display: Record<"xl" | "lg" | "md", TypeStep> = {
  xl: { size: "4.5rem", lineHeight: "1.05", weight: 700, tracking: "-0.03em" },
  lg: { size: "3.75rem", lineHeight: "1.08", weight: 700, tracking: "-0.025em" },
  md: { size: "3rem", lineHeight: "1.1", weight: 700, tracking: "-0.02em" },
}

/** Heading scale. */
export const heading: Record<"h1" | "h2" | "h3" | "h4", TypeStep> = {
  h1: { size: "2.5rem", lineHeight: "1.15", weight: 700, tracking: "-0.02em" },
  h2: { size: "2rem", lineHeight: "1.2", weight: 650, tracking: "-0.015em" },
  h3: { size: "1.5rem", lineHeight: "1.3", weight: 600, tracking: "-0.01em" },
  h4: { size: "1.125rem", lineHeight: "1.4", weight: 600, tracking: "-0.005em" },
}

/** Body scale. */
export const body: Record<"lg" | "md" | "sm" | "xs", TypeStep> = {
  lg: { size: "1.125rem", lineHeight: "1.7", weight: 400, tracking: "0" },
  md: { size: "1rem", lineHeight: "1.6", weight: 400, tracking: "0" },
  sm: { size: "0.875rem", lineHeight: "1.55", weight: 400, tracking: "0" },
  xs: { size: "0.8125rem", lineHeight: "1.5", weight: 400, tracking: "0" },
}

/** Caption + overline. */
export const caption = {
  size: "0.75rem",
  lineHeight: "1.45",
  weight: 500,
  tracking: "0.02em",
} as const

export const overline = {
  size: "0.6875rem",
  lineHeight: "1.4",
  weight: 700,
  tracking: "0.12em",
  textTransform: "uppercase" as const,
} as const

/** Alias scale for compatibility + Tailwind mapping. */
export const fontSize: Record<string, string> = {
  xs: caption.size,
  sm: body.sm.size,
  base: body.md.size,
  lg: body.lg.size,
  xl: heading.h4.size,
  "2xl": heading.h3.size,
  "3xl": heading.h2.size,
  "4xl": heading.h1.size,
  "5xl": display.md.size,
  "6xl": display.lg.size,
}

export const lineHeight: Record<string, string> = {
  xs: caption.lineHeight,
  sm: body.sm.lineHeight,
  base: body.md.lineHeight,
  lg: body.lg.lineHeight,
  xl: heading.h4.lineHeight,
  "2xl": heading.h3.lineHeight,
  "3xl": heading.h2.lineHeight,
  "4xl": heading.h1.lineHeight,
  "5xl": display.md.lineHeight,
  "6xl": display.lg.lineHeight,
}

export const fontWeight = { normal: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800 } as const

export const letterSpacing = {
  tight: "-0.025em",
  normal: "0",
  wide: "0.025em",
  wider: "0.05em",
  overline: overline.tracking,
} as const

export const typography = {
  fontFamily,
  scripts,
  display,
  heading,
  body,
  caption,
  overline,
  fontSize,
  lineHeight,
  fontWeight,
  letterSpacing,
} as const

export default typography
