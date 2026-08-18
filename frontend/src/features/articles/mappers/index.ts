import type { ArticleSummary } from "../types"
import { articleExcerpt, articleTitle, formatArticleDate, readingTimeLabel } from "../utils"

/** View model for the marketing ArticleCard. */
export interface ArticleCardView {
  title: string
  description: string
  image?: string
  category?: string
  date?: string
  readTime?: string
  featured: boolean
}

export function mapArticleCard(article: ArticleSummary, locale: string): ArticleCardView {
  return {
    title: articleTitle(article, locale),
    description: articleExcerpt(article, locale),
    image: article.cover_image?.file,
    category: article.category?.title_en,
    date: formatArticleDate(article.published_at, locale) || undefined,
    readTime: readingTimeLabel(article.reading_time, locale),
    featured: Boolean(article.is_featured),
  }
}

export function mapArticleCards(items: ArticleSummary[], locale: string): ArticleCardView[] {
  return items.map((item) => mapArticleCard(item, locale))
}
