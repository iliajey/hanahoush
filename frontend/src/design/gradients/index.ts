/**
 * Hanahoush Gradient System — brand, hero, CTA, hover and mesh gradients.
 * Exposed as the single `gradients` object to avoid name collisions.
 *
 * The gradients mirror the brand mark's intrinsic magenta → deep indigo
 * rotation (hue ~302° → ~246°). Light and dark variants lower/increase
 * luminance like the semantic tokens.
 */

const brand = {
  name: "hanahoush-brand",
  css: "linear-gradient(135deg, hsl(302 56% 37%), hsl(246 49% 26%))",
  fallback: "#932990",
} as const

const hero = {
  name: "hanahoush-hero",
  css: "radial-gradient(60% 50% at 50% 0%, hsl(302 56% 37% / 0.18), transparent 70%)",
  fallback: "transparent",
} as const

const cta = {
  name: "hanahoush-cta",
  css: "linear-gradient(135deg, hsl(302 56% 37%), hsl(278 54% 31%))",
  fallback: "#932990",
} as const

const hover = {
  brand: "linear-gradient(135deg, hsl(302 49% 57%), hsl(246 49% 32%))",
  cta: "linear-gradient(135deg, hsl(302 49% 57%), hsl(270 52% 34%))",
} as const

const mesh = {
  name: "hanahoush-mesh",
  css: [
    "radial-gradient(40% 40% at 20% 20%, hsl(302 56% 37% / 0.12), transparent 70%)",
    "radial-gradient(40% 40% at 80% 60%, hsl(270 52% 24% / 0.12), transparent 70%)",
    "radial-gradient(30% 30% at 60% 20%, hsl(310 60% 55% / 0.08), transparent 70%)",
  ].join(", "),
} as const

/** CSS string values for gradient surfaces. */
export const gradients = { brand, hero, cta, hover, mesh } as const

/** Curated list of renderable gradients (have a CSS string). */
export const renderableGradients = [brand, hero, cta, mesh] as const

export default gradients