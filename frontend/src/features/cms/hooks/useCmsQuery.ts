import { useQuery, type UseQueryOptions, type UseQueryResult } from "@tanstack/react-query"

import { cmsQueryBaseOptions, type CmsQueryMeta } from "../cache/strategy"

/**
 * Base CMS query hook. Merges a query key + fetcher with the global CMS
 * cache policy (stale times, retry/backoff, gc lifetime). Structural sharing
 * + query-key hashing deduplicate concurrent requests automatically.
 */
export function useCmsQuery<T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>,
  meta: CmsQueryMeta = {},
  options?: Pick<UseQueryOptions<T>, "enabled" | "placeholderData" | "select">,
): UseQueryResult<T> {
  return useQuery<T>({
    queryKey,
    queryFn,
    ...cmsQueryBaseOptions(meta),
    ...options,
  })
}