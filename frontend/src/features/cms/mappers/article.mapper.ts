import type { Locale } from "../types"
import type { Article } from "../types"

/** View model consumed by marketing ArticleCard components. */
export interface ArticleView {
  id: number
  title: string
  description: string
  image?: string
  category?: string
  date?: string
  readTime?: string
  featured?: boolean
  slug: string
  publishedAt?: string | null
}

const WORDS_PER_MINUTE = 200

function estimateReadTime(text: string, locale: Locale): string {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  const minutes = Math.max(1, Math.round(words / WORDS_PER_MINUTE))
  return new Intl.NumberFormat(locale).format(minutes) + " min"
}

export function mapArticle(article: Article, locale: Locale): ArticleView {
  const description =
    article.short_description || article.short_description_en || article.description || ""
  return {
    id: article.id,
    title: article.title || article.title_en,
    description,
    image: article.cover_image?.file,
    category: article.category?.title_en || undefined,
    date: article.published_at ? formatDate(article.published_at, locale) : undefined,
    readTime: estimateReadTime(article.description_en || description, locale),
    featured: article.is_featured,
    slug: article.slug,
    publishedAt: article.published_at,
  }
}

export function mapArticles(items: Article[], locale: Locale): ArticleView[] {
  return items.map((item) => mapArticle(item, locale))
}

export function formatDate(value: string, locale: Locale): string {
  try {
    return new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : locale, {
      year: "numeric",
      month: "short",
    }).format(new Date(value))
  } catch {
    return value.slice(0, 7)
  }
}
