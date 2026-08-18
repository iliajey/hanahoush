import type { Locale } from "../types"

/**
 * Query-key factory for the CMS feature.
 *
 * Every key is scoped by the active locale so language switching isolates
 * cache entries (localized responses differ per `Accept-Language`).
 */
export const cmsKeys = {
  all: ["cms"] as const,

  articles: {
    all: (locale: Locale) => ["cms", "articles", locale] as const,
    list: (locale: Locale, params?: unknown) => ["cms", "articles", locale, "list", params ?? {}] as const,
    detail: (locale: Locale, id: number) => ["cms", "articles", locale, "detail", id] as const,
  },

  projects: {
    all: (locale: Locale) => ["cms", "projects", locale] as const,
    list: (locale: Locale, params?: unknown) => ["cms", "projects", locale, "list", params ?? {}] as const,
    detail: (locale: Locale, id: number) => ["cms", "projects", locale, "detail", id] as const,
  },

  services: {
    all: (locale: Locale) => ["cms", "services", locale] as const,
    list: (locale: Locale, params?: unknown) => ["cms", "services", locale, "list", params ?? {}] as const,
    sections: (locale: Locale) => ["cms", "services", locale, "sections"] as const,
    detail: (locale: Locale, id: number) => ["cms", "services", locale, "detail", id] as const,
  },

  company: {
    all: (locale: Locale) => ["cms", "company", locale] as const,
    about: (locale: Locale) => ["cms", "company", locale, "about"] as const,
    team: (locale: Locale) => ["cms", "company", locale, "team"] as const,
    partners: (locale: Locale) => ["cms", "company", locale, "partners"] as const,
    testimonials: (locale: Locale, params?: unknown) =>
      ["cms", "company", locale, "testimonials", params ?? {}] as const,
    faqs: (locale: Locale, params?: unknown) => ["cms", "company", locale, "faqs", params ?? {}] as const,
    timeline: (locale: Locale) => ["cms", "company", locale, "timeline"] as const,
    socialLinks: (locale: Locale) => ["cms", "company", locale, "social-links"] as const,
    offices: (locale: Locale) => ["cms", "company", locale, "offices"] as const,
  },

  site: {
    all: (locale: Locale) => ["cms", "site", locale] as const,
    settings: (locale: Locale) => ["cms", "site", locale, "settings"] as const,
    navigation: (locale: Locale) => ["cms", "site", locale, "navigation"] as const,
    footer: (locale: Locale) => ["cms", "site", locale, "footer"] as const,
  },
} as const
