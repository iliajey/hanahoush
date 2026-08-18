/** Staff newsletter admin API (Phase 8G/9G). Subscribers are created through
 * the public subscribe endpoint; staff only read, filter, activate/deactivate
 * and export. The unsubscribe token is never read by the client. */
import { apiClient } from "@/shared/api/axiosClient"
import type { ApiEnvelope, PaginatedResponse } from "@/shared/types/api"

import type {
  NewsletterListParams,
  NewsletterListResult,
  NewsletterStateResult,
  NewsletterSubscriber,
} from "./types"

export async function listNewsletterSubscribers(params: NewsletterListParams = {}): Promise<NewsletterListResult> {
  const query: Record<string, unknown> = { page_size: params.pageSize ?? 50 }
  if (params.page != null) query.page = params.page
  if (params.q) query.q = params.q
  if (params.locale) query.locale = params.locale
  if (params.is_active != null) query.is_active = String(params.is_active)
  if (params.ordering) query.ordering = params.ordering

  const { data } = await apiClient.get<PaginatedResponse<NewsletterSubscriber>>("/api/v1/admin/newsletter/", {
    params: query,
  })
  return { items: data.data ?? [], pagination: data.pagination }
}

export async function activateSubscriber(id: number): Promise<NewsletterStateResult> {
  const { data } = await apiClient.post<ApiEnvelope<NewsletterStateResult>>(`/api/v1/admin/newsletter/${id}/activate/`)
  return data.data
}

export async function deactivateSubscriber(id: number): Promise<NewsletterStateResult> {
  const { data } = await apiClient.post<ApiEnvelope<NewsletterStateResult>>(`/api/v1/admin/newsletter/${id}/deactivate/`)
  return data.data
}

/** Download the filtered subscriber CSV. Fetched as a blob so the JWT is
 * attached as a Bearer header (a plain anchor cannot). Never includes the
 * unsubscribe token (backend guarantees this). */
export async function exportNewsletterSubscribers(params: NewsletterListParams = {}): Promise<void> {
  const query: Record<string, unknown> = {}
  if (params.q) query.q = params.q
  if (params.locale) query.locale = params.locale
  if (params.is_active != null) query.is_active = String(params.is_active)

  const response = await apiClient.get<Blob>("/api/v1/admin/newsletter/export/", {
    params: query,
    responseType: "blob",
  })
  const url = URL.createObjectURL(response.data)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = "newsletter-subscribers.csv"
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}