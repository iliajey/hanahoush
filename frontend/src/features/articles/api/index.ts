import { apiClient } from "@/shared/api/axiosClient"
import { cmsGet, cmsList, type CmsRequestOptions } from "@/features/cms/api/client"

import type {
  ArticleCategorySummary,
  ArticleDetail,
  ArticleFilters,
  ArticleSummary,
  ArticleTagSummary,
} from "../types"
import { buildArticleParams } from "../utils"

/** Full article by slug (draft-protected, localized, with related content). */
export function fetchArticleBySlug(slug: string, options: CmsRequestOptions): Promise<ArticleDetail> {
  return cmsGet<ArticleDetail>(`/articles/by-slug/${slug}/`, options)
}

/** Filtered article listing (server-side search/filters/pagination). */
export async function fetchArticlesFiltered(
  filters: ArticleFilters,
  options: CmsRequestOptions,
): Promise<{ items: ArticleSummary[]; count: number }> {
  const result = await cmsList<ArticleSummary>("/articles", { ...options, params: buildArticleParams(filters) })
  return { items: result.items, count: result.pagination?.count ?? result.items.length }
}

/** Featured articles for the editorial featured block. */
export async function fetchFeaturedArticlesList(
  limit: number,
  options: CmsRequestOptions,
): Promise<ArticleSummary[]> {
  const result = await cmsList<ArticleSummary>("/articles", {
    ...options,
    params: { is_featured: true, page_size: limit, ordering: "-published_at" },
  })
  return result.items
}

/** Category explorer (used taxonomy with counts). */
export async function fetchArticleCategories(options: CmsRequestOptions): Promise<ArticleCategorySummary[]> {
  return cmsGet<ArticleCategorySummary[]>("/articles/categories", options)
}

/** Tag / topic explorer (used taxonomy with counts). */
export async function fetchArticleTags(options: CmsRequestOptions): Promise<ArticleTagSummary[]> {
  return cmsGet<ArticleTagSummary[]>("/articles/tags", options)
}

/** Newsletter subscription (single system). Returns a discriminated result. */
export async function subscribeNewsletter(
  email: string,
  locale: string,
  source: string,
): Promise<{ ok: true } | { ok: false; status: number; message?: string }> {
  try {
    const { data } = await apiClient.post<{ success: boolean; message: string; data: unknown; errors: unknown }>(
      "/newsletter/subscribe/",
      { email, locale, source },
    )
    if (data.success) return { ok: true }
    return { ok: false, status: 0, message: data.message }
  } catch (error) {
    const statusCode = (error as { response?: { status?: number; data?: { message?: string } } }).response?.status ?? 0
    const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message
    return { ok: false, status: statusCode, message }
  }
}