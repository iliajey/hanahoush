import { trackEvent } from "@/features/analytics"

/** Project-domain analytics helpers (single analytics system). */
export const projectAnalytics = {
  view(slug: string) {
    trackEvent("project_view", { slug })
  },
  filter(filters: Record<string, unknown>) {
    trackEvent("project_filter", filters)
  },
  search(q: string) {
    trackEvent("project_search", { q })
  },
  technologyFilter(slug: string) {
    trackEvent("technology_filter", { technology: slug })
  },
  galleryOpen() {
    trackEvent("project_gallery_open", {})
  },
  galleryImage(index: number) {
    trackEvent("project_gallery_image_view", { index })
  },
  relatedProjectClick(slug: string) {
    trackEvent("related_project_click", { slug })
  },
  relatedArticleClick(slug: string) {
    trackEvent("related_article_click", { slug })
  },
  cta(label?: string) {
    trackEvent("project_cta_click", { label })
  },
  caseSection(section: string) {
    trackEvent("case_study_section_visible", { section })
  },
}