import type { QueryClient } from "@tanstack/react-query"

import { prefetchQueries } from "../cache/strategy"
import {
  fetchAbout,
  fetchArticles,
  fetchFAQs,
  fetchPartners,
  fetchProjects,
  fetchServices,
  fetchTestimonials,
  fetchTimeline,
} from "../api"
import type { Locale } from "../types"

/**
 * Prefetch every query the landing page needs. Call it during navigation
 * (e.g. from a route loader) so the home page renders instantly.
 */
export function prefetchHomeContent(queryClient: QueryClient, locale: Locale): Promise<void> {
  return prefetchQueries(queryClient, [
    {
      queryKey: ["cms", "articles", locale, "list", { featured: true, limit: 3 }],
      queryFn: () => fetchArticles({ pageSize: 3, ordering: "-published_at" }, { locale }),
      staleTime: 2 * 60 * 1000,
    },
    {
      queryKey: ["cms", "projects", locale, "list", { featured: true, limit: 3 }],
      queryFn: () => fetchProjects({ pageSize: 3, ordering: "-end_date" }, { locale }),
      staleTime: 2 * 60 * 1000,
    },
    {
      queryKey: ["cms", "services", locale, "list", {}],
      queryFn: () => fetchServices({ pageSize: 20 }, { locale }),
      staleTime: 5 * 60 * 1000,
    },
    {
      queryKey: ["cms", "company", locale, "about"],
      queryFn: () => fetchAbout({ locale }),
      staleTime: 5 * 60 * 1000,
    },
    {
      queryKey: ["cms", "company", locale, "testimonials", {}],
      queryFn: () => fetchTestimonials({ is_featured: true }, { locale }),
      staleTime: 2 * 60 * 1000,
    },
    {
      queryKey: ["cms", "company", locale, "partners"],
      queryFn: () => fetchPartners({ locale }),
      staleTime: 5 * 60 * 1000,
    },
    {
      queryKey: ["cms", "company", locale, "faqs", {}],
      queryFn: () => fetchFAQs({}, { locale }),
      staleTime: 2 * 60 * 1000,
    },
    {
      queryKey: ["cms", "company", locale, "timeline"],
      queryFn: () => fetchTimeline({ locale }),
      staleTime: 5 * 60 * 1000,
    },
  ])
}
