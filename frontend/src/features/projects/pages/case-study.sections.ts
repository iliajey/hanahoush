import type { Page, PageSection } from "@/features/page-builder/types"

/** Ordered case-study section template (assembled, then rendered via PageRenderer). */
export const CASE_STUDY_SECTIONS: string[] = [
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
]

/** Build a Page-shaped object for the case study, driven by the project slug. */
export function buildCaseStudyPage(
  slug: string,
  meta: { title?: string; description?: string; canonical?: string; ogImage?: string },
): Page {
  const sections: PageSection[] = CASE_STUDY_SECTIONS.map((type, i) => ({
    id: i + 1,
    type,
    title: null,
    is_enabled: true,
    order: i + 1,
    config: { projectSlug: slug },
  }))
  return {
    id: 0,
    slug,
    title: meta.title || slug,
    status: "published",
    is_home: false,
    template: "case-study",
    version: 1,
    sections_count: sections.length,
    total_sections: sections.length,
    seo: {
      meta_title: meta.title || undefined,
      meta_description: meta.description || undefined,
      canonical_url: meta.canonical || undefined,
      og_image: meta.ogImage || undefined,
    },
    sections,
  }
}