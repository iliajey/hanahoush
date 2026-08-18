import { trackEvent } from "@/features/analytics"

/** Article-domain analytics helpers (single analytics system). */
export const articleAnalytics = {
  view(slug: string) {
    trackEvent("article_view", { slug })
  },
  search(q: string) {
    trackEvent("article_search", { q })
  },
  filter(filters: Record<string, unknown>) {
    trackEvent("article_filter", filters)
  },
  categoryClick(slug: string) {
    trackEvent("category_click", { slug })
  },
  tagClick(slug: string) {
    trackEvent("tag_click", { slug })
  },
  featuredClick(slug: string) {
    trackEvent("featured_article_click", { slug })
  },
  share(method: string) {
    trackEvent("article_share", { method })
  },
  copyLink() {
    trackEvent("copy_link", {})
  },
  newsletter(status: string) {
    trackEvent("newsletter_submit", { status })
  },
  relatedArticle(slug: string) {
    trackEvent("related_article_click", { slug })
  },
  relatedProject(slug: string) {
    trackEvent("related_project_click", { slug })
  },
  relatedService(id: number) {
    trackEvent("related_service_click", { id })
  },
  cta(label?: string) {
    trackEvent("article_cta_click", { label })
  },
  section(section: string) {
    trackEvent("article_section_visible", { section })
  },
}