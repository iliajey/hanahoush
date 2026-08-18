import type { ArticleFilters, ArticleSummary } from "../types"

/** Strip HTML tags to plain text (client-side; backend computes reading time too). */
export function stripHtml(html: string): string {
  if (!html) return ""
  if (typeof DOMParser === "undefined") return html.replace(/<[^>]+>/g, " ")
  const doc = new DOMParser().parseFromString(html, "text/html")
  return (doc.body.textContent || "").replace(/\s+/g, " ").trim()
}

/** Client-side reading-time estimate (wpm by locale). Deterministic. */
export function readingMinutes(text: string, locale = "en"): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  if (words === 0) return 0
  const wpm = locale === "fa" ? 180 : locale === "ar" ? 170 : 200
  return Math.max(1, Math.ceil(words / wpm))
}

/** Map an article summary to a localized reading-time label (e.g. "8 min"). */
export function readingTimeLabel(minutes?: number, locale = "en"): string | undefined {
  if (minutes == null) return undefined
  const value = new Intl.NumberFormat(locale === "fa" ? "fa-IR" : locale).format(minutes)
  const unit = locale === "fa" ? "دقیقه" : locale === "ar" ? "دقائق" : "min"
  return `${value} ${unit}`
}

/** Deterministic anchor id for headings. */
export function headingId(text: string, index: number): string {
  const slug = text.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF\s-]/g, "").trim().replace(/\s+/g, "-")
  return `${slug || "section"}-${index}`
}

/** Map the domain filter object onto the backend API query params. */
export function buildArticleParams(filters: ArticleFilters): Record<string, unknown> {
  const params: Record<string, unknown> = {}
  if (filters.q) params.q = filters.q
  if (filters.categorySlug) params.category_slug = filters.categorySlug
  if (filters.tagSlug) params.tags = filters.tagSlug
  if (filters.featuredOnly) params.is_featured = true
  if (filters.ordering) params.ordering = filters.ordering
  if (filters.page != null) params.page = filters.page
  if (filters.pageSize != null) params.page_size = filters.pageSize
  return params
}

export function formatArticleDate(value: string | undefined | null, locale: string): string {
  if (!value) return ""
  try {
    return new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : locale, { year: "numeric", month: "short", day: "numeric" }).format(new Date(value))
  } catch {
    return value
  }
}

export function articleTitle(article: Pick<ArticleSummary, "title_fa" | "title_en" | "title_ar">, locale: string): string {
  if (locale === "fa" && article.title_fa) return article.title_fa
  if (locale === "ar" && article.title_ar) return article.title_ar
  return article.title_en
}

export function articleExcerpt(article: Pick<ArticleSummary, "short_description_fa" | "short_description_en" | "short_description_ar">, locale: string): string {
  if (locale === "fa" && article.short_description_fa) return article.short_description_fa
  if (locale === "ar" && article.short_description_ar) return article.short_description_ar
  return article.short_description_en || ""
}