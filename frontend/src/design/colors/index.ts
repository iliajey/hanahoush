/**
 * Hanahoush Color Engine.
 *
 * Brand scale, semantic tokens, interaction states (hover/focus/selection),
 * scrollbar colors and full light/dark theme variable maps.
 *
 * The palette is derived from the organization's brand mark
 * (docs/reports/phase-09C-report.md §3): a violet-magenta primary (#932990,
 * measured from the brand image) paired with a deep indigo ink (#272161) on a
 * near-white surface. The scale rotates hue 302° → 246° from light tint to the
 * dark indigo partner, mirroring the mark's intrinsic magenta→indigo gradient.
 */
import type { CSSProperties } from "react"

/**
 * Brand scale (violet-magenta → deep indigo) + brand role tokens.
 * 50..950 are Tailwind-style steps; the role keys are the semantic brand
 * tokens that components should prefer (brand.primary, brand.onPrimary, ...).
 */
export const brand = {
  50: "#FDF6FB",
  100: "#F7E8F7",
  200: "#EDD1EC",
  300: "#DDABDB",
  400: "#C57EC2",
  500: "#A652A3",
  600: "#932990",
  700: "#7A2477",
  800: "#5D2061",
  900: "#3F1C58",
  950: "#272161",
  // Brand role tokens (measured / derived from the brand mark).
  primary: "#932990",
  primaryHover: "#7A2477",
  primaryActive: "#691E68",
  secondary: "#272161",
  secondaryHover: "#1F1853",
  accent: "#C75BC3",
  accentSoft: "#F6E8F4",
  onPrimary: "#FFFFFF",
  onSecondary: "#FDF6FB",
} as const

export type BrandStep = keyof typeof brand

/** Semantic tokens resolve to CSS variables (theme-aware). */
export const semantic = {
  background: "hsl(var(--background))",
  foreground: "hsl(var(--foreground))",
  card: "hsl(var(--card))",
  cardForeground: "hsl(var(--card-foreground))",
  popover: "hsl(var(--popover))",
  popoverForeground: "hsl(var(--popover-foreground))",
  primary: "hsl(var(--primary))",
  primaryForeground: "hsl(var(--primary-foreground))",
  secondary: "hsl(var(--secondary))",
  secondaryForeground: "hsl(var(--secondary-foreground))",
  muted: "hsl(var(--muted))",
  mutedForeground: "hsl(var(--muted-foreground))",
  accent: "hsl(var(--accent))",
  accentForeground: "hsl(var(--accent-foreground))",
  destructive: "hsl(var(--destructive))",
  destructiveForeground: "hsl(var(--destructive-foreground))",
  border: "hsl(var(--border))",
  input: "hsl(var(--input))",
  ring: "hsl(var(--ring))",
  // Phase 9C brand-semantic roles (aliases into the same CSS variables so all
  // consumers share one token pipeline).
  surface: "hsl(var(--card))",
  surfaceElevated: "hsl(var(--popover))",
  surfaceMuted: "hsl(var(--secondary))",
  text: "hsl(var(--foreground))",
  textMuted: "hsl(var(--muted-foreground))",
  textSubtle: "hsl(var(--muted-foreground))",
  focus: "hsl(var(--ring))",
  success: "hsl(var(--success))",
  warning: "hsl(var(--warning))",
  error: "hsl(var(--error))",
  info: "hsl(var(--info))",
} as const

export type SemanticToken = keyof typeof semantic

/** Interaction states — derived from the active theme via CSS variables. */
export const hover = {
  primary: "hsl(var(--primary-hover))",
  secondary: "hsl(var(--secondary-hover))",
  destructive: "hsl(var(--destructive-hover))",
  muted: "hsl(var(--muted-hover))",
  accent: "hsl(var(--accent-hover))",
} as const

export const focus = {
  ring: "hsl(var(--ring))",
  ringOffset: "hsl(var(--ring-offset))",
  ringWidth: "var(--focus-ring-width)",
} as const

export const selection = {
  background: "hsl(var(--selection-bg))",
  foreground: "hsl(var(--selection-fg))",
} as const

export const scrollbar = {
  thumb: "hsl(var(--scrollbar-thumb))",
  track: "hsl(var(--scrollbar-track))",
  hover: "hsl(var(--scrollbar-thumb-hover))",
} as const

/**
 * Full theme variable maps. Each value is a raw CSS value assigned to the
 * CSS custom property of the same name in the `:root` / `.dark` blocks.
 * (globals.css is the runtime source; this map is kept in lockstep and powers
 * applyThemeVariables + tests.)
 */
export const themes = {
  light: {
    "--background": "330 33% 99%",
    "--foreground": "247 55% 21%",
    "--card": "0 0% 100%",
    "--card-foreground": "247 55% 21%",
    "--popover": "0 0% 100%",
    "--popover-foreground": "247 55% 21%",
    "--primary": "302 56% 37%",
    "--primary-foreground": "0 0% 100%",
    "--secondary": "288 33% 94%",
    "--secondary-foreground": "247 55% 21%",
    "--muted": "288 33% 95%",
    "--muted-foreground": "281 26% 45%",
    "--accent": "309 44% 94%",
    "--accent-foreground": "302 54% 31%",
    "--destructive": "0 72% 51%",
    "--destructive-foreground": "0 0% 100%",
    "--border": "294 21% 90%",
    "--input": "294 21% 90%",
    "--ring": "302 56% 37%",
    "--primary-hover": "302 54% 31%",
    "--secondary-hover": "288 33% 89%",
    "--destructive-hover": "0 68% 52%",
    "--muted-hover": "288 33% 89%",
    "--accent-hover": "309 44% 90%",
    "--selection-bg": "302 44% 89%",
    "--selection-fg": "247 55% 21%",
    "--scrollbar-thumb": "291 16% 83%",
    "--scrollbar-track": "291 30% 96%",
    "--scrollbar-thumb-hover": "290 16% 71%",
    "--ring-offset": "330 33% 99%",
    "--focus-ring-width": "2px",
    "--success": "142 72% 29%",
    "--warning": "26 90% 37%",
    "--error": "0 72% 51%",
    "--info": "302 56% 37%",
  },
  dark: {
    "--background": "252 43% 7%",
    "--foreground": "272 33% 92%",
    "--card": "252 36% 11%",
    "--card-foreground": "272 33% 92%",
    "--popover": "252 36% 11%",
    "--popover-foreground": "272 33% 92%",
    "--primary": "302 49% 57%",
    "--primary-foreground": "250 56% 14%",
    "--secondary": "253 28% 20%",
    "--secondary-foreground": "272 33% 92%",
    "--muted": "253 28% 18%",
    "--muted-foreground": "269 17% 67%",
    "--accent": "270 52% 23%",
    "--accent-foreground": "285 45% 88%",
    "--destructive": "3 84% 62%",
    "--destructive-foreground": "0 0% 100%",
    "--border": "254 30% 21%",
    "--input": "254 30% 21%",
    "--ring": "303 56% 69%",
    "--primary-hover": "303 52% 64%",
    "--secondary-hover": "254 29% 24%",
    "--destructive-hover": "3 88% 67%",
    "--muted-hover": "254 29% 22%",
    "--accent-hover": "270 52% 27%",
    "--selection-bg": "302 54% 31%",
    "--selection-fg": "317 64% 98%",
    "--scrollbar-thumb": "256 23% 29%",
    "--scrollbar-track": "252 36% 11%",
    "--scrollbar-thumb-hover": "257 21% 39%",
    "--ring-offset": "252 43% 7%",
    "--focus-ring-width": "2px",
    "--success": "158 64% 52%",
    "--warning": "43 96% 56%",
    "--error": "3 84% 62%",
    "--info": "302 49% 57%",
  },
} as const

export type ThemeName = keyof typeof themes

/** Apply a theme map to the document root (used by the theme engine). */
export function applyThemeVariables(theme: ThemeName): void {
  const root = document.documentElement
  const vars = themes[theme]
  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })
}

export const colors = { brand, semantic, hover, focus, selection, scrollbar, themes } as const

/** Typed style for inline color token usage. */
export type ThemeVars = Record<string, CSSProperties>