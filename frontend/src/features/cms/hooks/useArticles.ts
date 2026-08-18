import { useLanguage } from "@/app/language/useLanguage"

import { fetchArticle, fetchArticles, fetchFeaturedArticles, type ArticleListParams } from "../api/articles"
import { cmsKeys } from "../queries/keys"
import type { Article, Paginated } from "../types"

import { useCmsQuery } from "./useCmsQuery"

/** Paginated published articles with pagination/filtering/search support. */
export function useArticles(params: ArticleListParams = {}) {
  const locale = useLanguage().language
  return useCmsQuery<Paginated<Article>>(
    cmsKeys.articles.list(locale, params),
    () => fetchArticles(params, { locale }),
    { tier: "listings", description: "GET /api/v1/articles/" },
  )
}

/** Featured published articles (homepage highlights). */
export function useFeaturedArticles(limit = 3) {
  const locale = useLanguage().language
  return useCmsQuery<Article[]>(
    cmsKeys.articles.list(locale, { featured: true, limit }),
    () => fetchFeaturedArticles({ locale }, limit),
    { tier: "listings", description: "GET /api/v1/articles/?is_featured=true" },
  )
}

/** Single article detail. */
export function useArticle(id: number | undefined) {
  const locale = useLanguage().language
  return useCmsQuery<Article>(
    cmsKeys.articles.detail(locale, id ?? 0),
    () => fetchArticle(id as number, { locale }),
    { tier: "content", description: `GET /api/v1/articles/${id}/` },
    { enabled: id != null },
  )
}
