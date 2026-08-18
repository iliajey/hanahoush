import type { Locale } from "@/i18n"
import { apiClient } from "@/shared/api/axiosClient"
import type { PaginatedResponse } from "@/shared/types/api"

import type { SearchParams, SearchResponse, SearchResult } from "./types"

function buildParams(params: SearchParams): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  if (params.q) out.q = params.q
  if (params.type) out.type = params.type
  if (params.category) out.category = params.category
  if (params.ordering) out.ordering = params.ordering
  if (params.page != null) out.page = params.page
  if (params.pageSize != null) out.page_size = params.pageSize
  return out
}

/** Query the unified site-wide search API (single shared API client). */
export async function fetchSearch(params: SearchParams): Promise<SearchResponse> {
  const response = await apiClient.get<PaginatedResponse<SearchResult>>("/search/", {
    params: buildParams(params),
    headers: params.locale ? { "Accept-Language": params.locale } : undefined,
  })
  const envelope = response.data
  return {
    items: envelope.data ?? [],
    pagination: envelope.pagination ?? {
      count: 0,
      num_pages: 0,
      current_page: 1,
      page_size: 20,
      next: null,
      previous: null,
    },
  }
}

export function defaultSearchParams(locale: Locale, q: string): SearchParams {
  return { q, locale, ordering: "relevance", page: 1, pageSize: 20 }
}