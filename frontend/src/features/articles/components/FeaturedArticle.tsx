import { motion } from "framer-motion"
import { ArrowRight, Clock } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { ResponsiveImage } from "@/features/cms/components/ResponsiveImage"
import type { ArticleSummary } from "../types"
import { articleAnalytics } from "../services/analytics"
import { formatArticleDate, readingTimeLabel } from "../utils"

/** Dominant editorial featured article (not a card). */
export function FeaturedArticle({
  article,
  locale,
  onOpen,
}: {
  article: ArticleSummary | null | undefined
  locale: string
  onOpen?: (slug: string) => void
}) {
  if (!article) return null
  const title = article.title_en
  const excerpt = article.short_description_en || ""
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55 }}
      className="grid gap-8 lg:grid-cols-12"
    >
      <div className="relative overflow-hidden rounded-3xl border lg:col-span-7">
        <div className="aspect-[16/9]">
          <ResponsiveImage src={article.cover_image?.file} alt={title} className="h-full w-full" />
        </div>
      </div>
      <div className="flex flex-col justify-center lg:col-span-5">
        <div className="flex items-center gap-2">
          {article.category ? <Badge variant="secondary">{article.category.title_en}</Badge> : null}
          {article.published_at ? (
            <span className="text-xs text-muted-foreground">{formatArticleDate(article.published_at, locale)}</span>
          ) : null}
        </div>
        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
        <p className="mt-4 max-w-xl text-muted-foreground">{excerpt}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {article.author ? <span>{article.author}</span> : null}
          {article.reading_time ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {readingTimeLabel(article.reading_time, locale)}
            </span>
          ) : null}
        </div>
        <a
          href={`/articles/${article.slug}`}
          onClick={() => {
            articleAnalytics.featuredClick(article.slug)
            onOpen?.(article.slug)
          }}
          className="mt-6 inline-flex items-center gap-1 font-medium text-brand-700 hover:underline dark:text-brand-300"
        >
          Read the article <ArrowRight className="h-4 w-4 rtl:rotate-180" />
        </a>
      </div>
    </motion.article>
  )
}