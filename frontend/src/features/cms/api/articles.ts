import type { Article, ListParams, Paginated } from "../types"

import { buildListParams, cmsGet, cmsList, type CmsRequestOptions } from "./client"

const RESOURCE = "/articles"

export interface ArticleListParams extends ListParams {
  category?: number
  category_slug?: string
  is_featured?: boolean
  is_pinned?: boolean
  author?: number
  tags?: string
}

export async function fetchArticles(
  params: ArticleListParams,
  options: CmsRequestOptions,
): Promise<Paginated<Article>> {
  return cmsList<Article>(RESOURCE, {
    ...options,
    params: buildListParams({ ...params, page: params.page ?? 1 }),
  })
}

export async function fetchArticle(id: number, options: CmsRequestOptions): Promise<Article> {
  return cmsGet<Article>(`${RESOURCE}/${id}/`, options)
}

export async function fetchFeaturedArticles(
  options: CmsRequestOptions,
  limit = 3,
): Promise<Article[]> {
  const result = await cmsList<Article>(RESOURCE, {
    ...options,
    params: { ...buildListParams({ pageSize: limit, ordering: "-published_at" }), is_featured: true },
  })
  return result.items
}
