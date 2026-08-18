import type { MediaRef } from "@/features/cms/types"

export interface ArticleCategoryRef {
  id: number
  title_fa?: string
  title_en: string
  title_ar?: string
  slug: string
  articles_count?: number
}

export interface ArticleTagRef {
  id: number
  title_fa?: string
  title_en: string
  title_ar?: string
  slug: string
  articles_count?: number
}

export interface ArticleSummary {
  id: number
  slug: string
  title_fa?: string
  title_en: string
  title_ar?: string
  short_description_fa?: string
  short_description_en?: string
  short_description_ar?: string
  category: ArticleCategoryRef | null
  tags: ArticleTagRef[]
  author?: string | null
  cover_image: MediaRef | null
  status?: string
  is_published?: boolean
  is_featured: boolean
  is_public: boolean
  is_pinned?: boolean
  published_at?: string | null
  reading_time?: number
  created_at?: string
  updated_at?: string
}

export interface ArticleDetail extends ArticleSummary {
  description_fa?: string
  description_en?: string
  description_ar?: string
  related_articles: ArticleSummary[]
  related_projects: Array<{ id: number; slug: string; title: string; short_description?: string; cover_image?: MediaRef | null }>
  related_services: Array<{ id: number; title: string; description?: string; icon?: string; href?: string }>
}

export interface ArticleFilters {
  q?: string
  categorySlug?: string
  tagSlug?: string
  featuredOnly?: boolean
  page?: number
  pageSize?: number
  ordering?: string
}

export interface ArticleCategorySummary {
  id: number
  title_fa?: string
  title_en: string
  title_ar?: string
  slug: string
  articles_count?: number
}

export interface ArticleTagSummary {
  id: number
  title_fa?: string
  title_en: string
  title_ar?: string
  slug: string
  articles_count?: number
}

export interface TocEntry {
  id: string
  text: string
  level: number
}

export type NewsletterState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success" }
  | { kind: "duplicate" }
  | { kind: "error"; message?: string }
