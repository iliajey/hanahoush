import type { QueryClient } from "@tanstack/react-query"

import { cmsKeys } from "../queries/keys"
import type { Locale } from "../types"

/**
 * Invalidate every cached CMS query for the given locale. Used after content
 * mutations / admin updates to force a background refresh.
 */
export function invalidateCmsCache(queryClient: QueryClient, locale?: Locale): Promise<void> {
  const queryKey: unknown[] = locale ? ["cms", locale] : ["cms"]
  return queryClient.invalidateQueries({ queryKey })
}

/** Remove (drop) a specific cached resource so the next view refetches. */
export function clearCmsEntries(queryClient: QueryClient): void {
  queryClient.removeQueries({ queryKey: cmsKeys.all })
}