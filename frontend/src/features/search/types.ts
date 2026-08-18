import type { Locale } from "@/i18n"
import type { PaginationMeta } from "@/shared/types/api"

export type SearchResultType = "article" | "project" | "service" | "page"

export interface SearchResult {
  type: SearchResultType
  id: number
  title: string
  excerpt: string
  slug: string
  image: string | null
  url: string
  relevance: number
  published_at: string | null
  category_slug: string | null
  category_title: string | null
  locale: string
}

export interface SearchParams {
  q?: string
  type?: SearchResultType | ""
  locale?: Locale
  category?: string
  ordering?: "relevance" | "published_at" | "-published_at"
  page?: number
  pageSize?: number
}

export interface SearchResponse {
  items: SearchResult[]
  pagination: PaginationMeta
}

export const SEARCH_MIN_LENGTH = 2