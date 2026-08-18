import type { QueryClient } from "@tanstack/react-query"

export const projectsKeys = {
  all: ["projects"] as const,
  detail: (locale: string, slug: string) => ["projects", "detail", locale, slug] as const,
  list: (locale: string, params?: unknown) => ["projects", "list", locale, params ?? {}] as const,
  technologies: (locale: string) => ["projects", "technologies", locale] as const,
}

/** Prefetch the detail + related queries for a case study page. */
export function prefetchProjectCaseStudy(
  queryClient: QueryClient,
  locale: string,
  slug: string,
  fetchers: {
    detail: () => Promise<unknown>
    technologies: () => Promise<unknown>
  },
): Promise<void> {
  return Promise.all([
    queryClient.prefetchQuery({ queryKey: projectsKeys.detail(locale, slug), queryFn: fetchers.detail, staleTime: 5 * 60 * 1000 }),
    queryClient.prefetchQuery({ queryKey: projectsKeys.technologies(locale), queryFn: fetchers.technologies, staleTime: 5 * 60 * 1000 }),
  ]).then(() => undefined)
}