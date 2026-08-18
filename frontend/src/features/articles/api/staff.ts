/** Staff article-management API (Phase 9G). Reuses the existing article CMS
 * endpoints — no second CMS. Writes are staff-only on the backend
 * (IsStaffOrReadOnly); the workspace is only reachable by staff roles. */
import { apiClient } from "@/shared/api/axiosClient"
import type { ApiEnvelope, PaginatedResponse } from "@/shared/types/api"

export type ArticleStatus = "draft" | "review" | "published" | "archived"

export interface StaffArticle {
  id: number
  title_fa: string
  title_en: string
  title_ar: string
  slug: string
  short_description_fa: string
  short_description_en: string
  short_description_ar: string
  status: ArticleStatus
  status_display: string
  is_published: boolean
  is_featured: boolean
  is_public: boolean
  is_pinned: boolean
  published_at: string | null
  category: { id: number; title_fa: string; title_en: string; slug: string } | null
  tags: Array<{ id: number; title_en: string; slug: string }>
  author: string | null
  reading_time: number | null
  created_at: string
  updated_at: string
}

export interface StaffArticleDetail extends StaffArticle {
  description_fa: string
  description_en: string
  description_ar: string
  meta_title: string
  meta_description: string
  meta_keywords: string
}

export interface StaffArticleListParams {
  page?: number
  pageSize?: number
  q?: string
  status?: ArticleStatus
  ordering?: string
  is_featured?: boolean
}

export interface StaffArticlePayload {
  title_fa?: string
  title_en?: string
  title_ar?: string
  slug?: string
  short_description_fa?: string
  short_description_en?: string
  short_description_ar?: string
  description_fa?: string
  description_en?: string
  description_ar?: string
  category?: number | null
  cover_image?: number | null
  status?: ArticleStatus
  is_featured?: boolean
  is_public?: boolean
  is_pinned?: boolean
  published_at?: string | null
  sort_order?: number
  meta_title?: string
  meta_description?: string
  meta_keywords?: string
}

export interface StaffArticleListResult {
  items: StaffArticle[]
  pagination: PaginatedResponse<StaffArticle>["pagination"]
}

export async function listStaffArticles(params: StaffArticleListParams = {}): Promise<StaffArticleListResult> {
  const query: Record<string, unknown> = { page_size: params.pageSize ?? 25 }
  if (params.page != null) query.page = params.page
  if (params.q) query.q = params.q
  if (params.status) query.status = params.status
  if (params.ordering) query.ordering = params.ordering
  if (params.is_featured != null) query.is_featured = String(params.is_featured)

  const { data } = await apiClient.get<PaginatedResponse<StaffArticle>>("/api/v1/articles/", { params: query })
  return { items: data.data ?? [], pagination: data.pagination }
}

export async function fetchStaffArticle(id: number): Promise<StaffArticleDetail> {
  const { data } = await apiClient.get<ApiEnvelope<StaffArticleDetail>>(`/api/v1/articles/${id}/`)
  return data.data
}

export async function createStaffArticle(payload: StaffArticlePayload): Promise<StaffArticle> {
  const { data } = await apiClient.post<ApiEnvelope<StaffArticle>>("/api/v1/articles/", payload)
  return data.data
}

export async function updateStaffArticle(id: number, payload: StaffArticlePayload): Promise<StaffArticle> {
  const { data } = await apiClient.patch<ApiEnvelope<StaffArticle>>(`/api/v1/articles/${id}/`, payload)
  return data.data
}