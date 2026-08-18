import type { QueryClient } from "@tanstack/react-query"

export const articlesKeys = {
  all: ["articles"] as const,
  detail: (locale: string, slug: string) => ["articles", "detail", locale, slug] as const,
  list: (locale: string, params?: unknown) => ["articles", "list", locale, params ?? {}] as const,
  featured: (locale: string, limit: number) => ["articles", "featured", locale, limit] as const,
  categories: (locale: string) => ["articles", "categories", locale] as const,
  tags: (locale: string) => ["articles", "tags", locale] as const,
}

/** Prefetch article detail + taxonomy for a reading page. */
export function prefetchArticle(
  queryClient: QueryClient,
  locale: string,
  slug: string,
  fetchers: { detail: () => Promise<unknown>; tags: () => Promise<unknown> },
): Promise<void> {
  return Promise.all([
    queryClient.prefetchQuery({ queryKey: articlesKeys.detail(locale, slug), queryFn: fetchers.detail, staleTime: 5 * 60 * 1000 }),
    queryClient.prefetchQuery({ queryKey: articlesKeys.tags(locale), queryFn: fetchers.tags, staleTime: 5 * 60 * 1000 }),
  ]).then(() => undefined)
}