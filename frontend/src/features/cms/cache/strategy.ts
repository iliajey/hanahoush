import type { QueryClient } from "@tanstack/react-query"

/**
 * Global CMS cache strategy.
 *
 * Read-heavy marketing content is cached aggressively and refreshed in the
 * background. Different content tiers get different lifetimes:
 *
 * - `site`    — site settings / navigation / footer (rarely change) → 30 min
 * - `content` — about / team / timeline / services sections → 5 min
 * - `listings`— articles / projects / services / testimonials / partners /
 *               FAQs (freshest) → 2 min
 *
 * Retries use an exponential backoff and requests are deduplicated by
 * React Query's structural sharing + query-key hashing (same key = one
 * in-flight request shared by every subscriber).
 */
export const CMS_CACHE = {
  staleTimes: {
    site: 1000 * 60 * 30,
    content: 1000 * 60 * 5,
    listings: 1000 * 60 * 2,
  },
  gcTime: 1000 * 60 * 10,
  retry: {
    max: 2,
    initialDelay: 300,
    backoff: (attempt: number) => Math.min(300 * 2 ** attempt, 30_000),
  },
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
} as const

export interface CmsQueryMeta {
  /** Cache tier used for `staleTime` (defaults to `listings`). */
  tier?: keyof typeof CMS_CACHE.staleTimes
  /** Human description shown on the /dev/api page. */
  description?: string
}

/** Resolve the staleTime for a cache tier. */
export function staleTimeFor(tier: keyof typeof CMS_CACHE.staleTimes = "listings"): number {
  return CMS_CACHE.staleTimes[tier]
}

/** Options injected into every CMS query. */
export function cmsQueryBaseOptions(meta: CmsQueryMeta = {}) {
  return {
    gcTime: CMS_CACHE.gcTime,
    staleTime: staleTimeFor(meta.tier ?? "listings"),
    retry: CMS_CACHE.retry.max,
    retryDelay: CMS_CACHE.retry.backoff,
    refetchOnWindowFocus: CMS_CACHE.refetchOnWindowFocus,
    refetchOnReconnect: CMS_CACHE.refetchOnReconnect,
  }
}

/**
 * Prefetch a set of queries into the cache ahead of navigation.
 * Returns a promise resolved when every query has settled.
 */
export async function prefetchQueries(
  queryClient: QueryClient,
  queries: Array<{ queryKey: readonly unknown[]; queryFn: () => unknown; staleTime?: number }>,
): Promise<void> {
  await Promise.all(
    queries.map((query) =>
      queryClient.prefetchQuery({
        queryKey: query.queryKey,
        queryFn: query.queryFn,
        staleTime: query.staleTime ?? staleTimeFor("content"),
      }),
    ),
  )
}
