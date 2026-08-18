import { apiClient } from "@/shared/api/axiosClient"
import type { ApiEnvelope } from "@/shared/types/api"

import type { ListParams, Locale, Paginated } from "../types"
import { recordTiming } from "../dev/timingStore"

/** Per-request options for CMS reads. */
export interface CmsRequestOptions {
  locale: Locale
  params?: Record<string, unknown>
  signal?: AbortSignal
}

function now(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now()
}

async function trackedGet<T>(
  method: "GET",
  path: string,
  options: CmsRequestOptions,
): Promise<{ data: T; status: number }> {
  const startedAt = now()
  try {
    const response = await apiClient.get<T>(path, {
      params: options.params,
      signal: options.signal,
      headers: { "Accept-Language": options.locale },
    })
    recordTiming({ method, path, startedAt, durationMs: Math.round(now() - startedAt), status: response.status })
    return { data: response.data, status: response.status }
  } catch (error) {
    recordTiming({
      method,
      path,
      startedAt,
      durationMs: Math.round(now() - startedAt),
      status: (error as { response?: { status?: number } }).response?.status ?? null,
    })
    throw error
  }
}

/**
 * Perform a GET against the CMS API and return the unwrapped envelope data.
 *
 * The active language is sent as `Accept-Language` so the backend resolves
 * localized `title` / `description` / ... fields automatically, which gives
 * automatic language switching with per-language cache isolation.
 */
export async function cmsGet<T>(path: string, options: CmsRequestOptions): Promise<T> {
  const { data } = await trackedGet<ApiEnvelope<T>>("GET", path, options)
  return data.data
}

/** Fetch a paginated list, keeping items + pagination metadata together. */
export async function cmsList<T>(path: string, options: CmsRequestOptions): Promise<Paginated<T>> {
  const { data } = await trackedGet<ApiEnvelope<T[]>>("GET", path, options)
  return { items: data.data ?? [], pagination: data.pagination }
}

/** Pagination helpers shared by hooks. */
export function buildListParams(params: ListParams = {}): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  if (params.page != null) out.page = params.page
  if (params.pageSize != null) out.page_size = params.pageSize
  if (params.ordering) out.ordering = params.ordering
  if (params.q) out.q = params.q
  return out
}
