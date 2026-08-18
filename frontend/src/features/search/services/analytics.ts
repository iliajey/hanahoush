import { trackEvent } from "@/features/analytics"

/**
 * Search experience analytics (Phase 8H). Thin, typed wrappers over the single
 * `trackEvent` system — the payloads feed the persistent analytics stream via
 * the ingestion endpoint.
 */
export const searchAnalytics = {
  view() {
    trackEvent("search_view", {})
  },
  submit(q?: string) {
    trackEvent("search_submit", { q })
  },
  resultClick(type?: string, url?: string) {
    trackEvent("search_result_click", { type, url })
  },
  empty(q?: string) {
    trackEvent("search_empty", { q })
  },
  filter(filter?: Record<string, unknown>) {
    trackEvent("search_filter", filter ?? {})
  },
}