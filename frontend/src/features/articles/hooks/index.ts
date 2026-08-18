import { useLanguage } from "@/app/language/useLanguage"
import { useCmsQuery } from "@/features/cms/hooks/useCmsQuery"

import {
  fetchArticleBySlug,
  fetchArticleCategories,
  fetchArticlesFiltered,
  fetchArticleTags,
  fetchFeaturedArticlesList,
} from "../api"
import { articlesKeys } from "../queries"
import type { ArticleCategorySummary, ArticleDetail, ArticleFilters, ArticleSummary, ArticleTagSummary } from "../types"

function useLocale() {
  return useLanguage().language
}

/** Full article by slug (draft-protected). */
export function useArticleBySlug(slug: string | undefined) {
  const locale = useLocale()
  return useCmsQuery<ArticleDetail>(
    articlesKeys.detail(locale, slug ?? ""),
    () => fetchArticleBySlug(slug as string, { locale }),
    { tier: "content", description: `GET /api/v1/articles/by-slug/${slug}/` },
    { enabled: Boolean(slug) },
  )
}

/** Filtered article listing (server-side). */
export function useArticlesFiltered(filters: ArticleFilters) {
  const locale = useLocale()
  return useCmsQuery<{ items: ArticleSummary[]; count: number }>(
    articlesKeys.list(locale, filters),
    () => fetchArticlesFiltered(filters, { locale }),
    { tier: "listings", description: "GET /api/v1/articles/?q=&category_slug=&tags=&ordering=" },
  )
}

/** Featured articles (editorial block). */
export function useFeaturedArticlesList(limit = 1) {
  const locale = useLocale()
  return useCmsQuery<ArticleSummary[]>(
    articlesKeys.featured(locale, limit),
    () => fetchFeaturedArticlesList(limit, { locale }),
    { tier: "listings", description: "GET /api/v1/articles/?is_featured=true" },
  )
}

/** Category explorer. */
export function useArticleCategories() {
  const locale = useLocale()
  return useCmsQuery<ArticleCategorySummary[]>(
    articlesKeys.categories(locale),
    () => fetchArticleCategories({ locale }),
    { tier: "content", description: "GET /api/v1/articles/categories/" },
  )
}

/** Tag / topic explorer. */
export function useArticleTags() {
  const locale = useLocale()
  return useCmsQuery<ArticleTagSummary[]>(
    articlesKeys.tags(locale),
    () => fetchArticleTags({ locale }),
    { tier: "content", description: "GET /api/v1/articles/tags/" },
  )
}