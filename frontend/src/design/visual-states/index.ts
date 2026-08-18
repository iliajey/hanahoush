/**
 * Hanahoush Visual State System — the "scroll story".
 *
 * A lightweight, token-driven mechanism that lets the ambient background
 * subtly change character as the user moves through a page. Each section is
 * annotated with `data-visual-state="hero|services|erp|projects|articles|cta"`
 * (added centrally by the Page Builder renderer). A single IntersectionObserver
 * in `<VisualStateProvider />` watches those elements and publishes CSS custom
 * properties on `document.documentElement`:
 *
 *   --vs-grid-size       grid cell size (px)   -> density
 *   --vs-grid-scale      grid morph scale      -> subtle settle/morph
 *   --vs-energy-opacity  energy glow opacity   -> brighten/dim
 *   --vs-energy-size     energy glow radius
 *   --vs-energy-x/y      energy glow position  -> per-section drift
 *   --vs-mesh-opacity    gradient mesh opacity -> ambient strength
 *
 * The background CSS consumes these variables with 700ms transitions, so the
 * page "breathes" between sections without any per-component visual hacks.
 * No motion conveys required information (Part G) — states also apply under
 * `prefers-reduced-motion`, just without animated transitions.
 */

export type VisualState = "hero" | "services" | "erp" | "projects" | "articles" | "cta" | "default"

export interface VisualStateStyle {
  /** Grid cell size in px. Larger = calmer, smaller = denser/data-like. */
  gridSize: number
  /** Subtle grid morph (≈1). <1 relaxes, >1 engages. */
  gridScale: number
  /** Energy glow opacity 0..1. */
  energyOpacity: number
  /** Energy glow radius in px. */
  energySize: number
  /** Energy glow anchor (percent string). */
  energyX: string
  energyY: string
  /** Gradient mesh opacity 0..1. */
  meshOpacity: number
}

/**
 * The visual story (Part C):
 * hero = strongest presence · services = settles slightly ·
 * erp = denser/data-oriented · projects = spatial/editorial (larger cells) ·
 * articles = calm · cta = strongest energy return.
 */
export const visualStateTokens: Record<VisualState, VisualStateStyle> = {
  hero: {
    gridSize: 48,
    gridScale: 1,
    energyOpacity: 0.5,
    energySize: 560,
    energyX: "50%",
    energyY: "22%",
    meshOpacity: 1,
  },
  services: {
    gridSize: 56,
    gridScale: 1.03,
    energyOpacity: 0.38,
    energySize: 520,
    energyX: "28%",
    energyY: "40%",
    meshOpacity: 0.85,
  },
  erp: {
    gridSize: 40,
    gridScale: 1,
    energyOpacity: 0.42,
    energySize: 500,
    energyX: "72%",
    energyY: "35%",
    meshOpacity: 0.9,
  },
  projects: {
    gridSize: 64,
    gridScale: 0.97,
    energyOpacity: 0.3,
    energySize: 640,
    energyX: "50%",
    energyY: "50%",
    meshOpacity: 0.7,
  },
  articles: {
    gridSize: 72,
    gridScale: 1,
    energyOpacity: 0.2,
    energySize: 560,
    energyX: "50%",
    energyY: "42%",
    meshOpacity: 0.6,
  },
  cta: {
    gridSize: 48,
    gridScale: 1,
    energyOpacity: 0.58,
    energySize: 640,
    energyX: "50%",
    energyY: "58%",
    meshOpacity: 1,
  },
  default: {
    gridSize: 48,
    gridScale: 1,
    energyOpacity: 0.25,
    energySize: 520,
    energyX: "50%",
    energyY: "30%",
    meshOpacity: 0.8,
  },
}

/** CSS custom property names published by the provider. */
export const visualStateVars = {
  gridSize: "--vs-grid-size",
  gridScale: "--vs-grid-scale",
  energyOpacity: "--vs-energy-opacity",
  energySize: "--vs-energy-size",
  energyX: "--vs-energy-x",
  energyY: "--vs-energy-y",
  meshOpacity: "--vs-mesh-opacity",
} as const

/**
 * Map a Page-Builder section type onto a visual state. Unknown/neutral
 * sections fall back to `default` so non-landing pages stay calm and we never
 * hardcode page-specific hacks into individual components.
 */
export function visualStateForSectionType(type: string): VisualState {
  switch (type) {
    case "hero":
      return "hero"
    case "services":
      return "services"
    case "erp":
      return "erp"
    case "projects":
    case "featured_projects":
    case "project_filters":
    case "technology_explorer":
    case "projects_timeline":
    case "case_hero":
    case "case_challenge":
    case "case_objectives":
    case "case_gallery":
    case "case_related_projects":
      return "projects"
    case "articles":
    case "articles_hero":
    case "featured_article":
    case "latest_articles":
    case "article_filters":
    case "category_explorer":
    case "tag_explorer":
    case "newsletter_cta":
      return "articles"
    case "cta":
    case "case_cta":
    case "article_cta":
      return "cta"
    default:
      return "default"
  }
}

export const visualStates = { tokens: visualStateTokens, vars: visualStateVars, forSectionType: visualStateForSectionType } as const

export default visualStates