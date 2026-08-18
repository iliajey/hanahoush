import type { SectionConfig } from "../types"

/**
 * Page-builder static configuration: the canonical section-type catalog,
 * fallback defaults (used only while the backend registry is loading) and
 * analytics flags. The authoritative registry + per-page layout come from the
 * API — this file only drives the frontend mapping.
 */
export const SECTION_TYPES = [
  "hero",
  "statistics",
  "services",
  "erp",
  "projects",
  "articles",
  "about",
  "team",
  "timeline",
  "partners",
  "testimonials",
  "faq",
  "cta",
  "footer",
  "journey",
  "comparison",
  "stack",
  "process",
  "featured_projects",
  "project_filters",
  "technology_explorer",
  "projects_timeline",
  "case_hero",
  "case_challenge",
  "case_objectives",
  "case_solution",
  "case_architecture",
  "case_technology",
  "case_journey",
  "case_gallery",
  "case_results",
  "case_related_projects",
  "case_related_articles",
  "case_cta",
  "articles_hero",
  "featured_article",
  "latest_articles",
  "article_filters",
  "category_explorer",
  "tag_explorer",
  "newsletter_cta",
  "article_cta",
  "article_hero",
  "article_content",
  "article_related",
  "company_story",
  "values",
  "offices",
  "social_links",
  "contact_form",
] as const

export type SectionType = (typeof SECTION_TYPES)[number]

export const isKnownSectionType = (type: string): type is SectionType =>
  (SECTION_TYPES as readonly string[]).includes(type)

/** Fallback defaults keyed by section type (never used once the registry loads). */
export const DEFAULT_SECTION_CONFIG: Record<string, SectionConfig> = {
  hero: { align: "center", show_grid: true, show_mesh: true, show_particles: false },
  statistics: { page_size: 20 },
  services: { page_size: 20 },
  projects: { featured: true, limit: 3 },
  articles: { featured: true, limit: 3 },
  team: { limit: 6 },
  testimonials: { featured: true, limit: 3 },
  faq: { page_size: 20 },
  cta: {},
  erp: {},
  about: {},
  timeline: {},
  partners: {},
  footer: {},
  company_story: {},
  values: {},
  offices: {},
  social_links: {},
  contact_form: {},
}

/** Section analytics configuration. */
export const SECTION_ANALYTICS = {
  enabled: true,
  /** Console.table the render records when running in dev. */
  logToConsole: import.meta.env.DEV,
} as const
