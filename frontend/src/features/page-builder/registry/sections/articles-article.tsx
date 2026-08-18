import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { CalendarDays, Clock, UserRound } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { ResponsiveImage } from "@/features/cms/components/ResponsiveImage"
import {
  ArticleContent,
  ArticleMeta,
  ArticleShare,
  ArticleTableOfContents,
  NewsletterCTA,
  ReadingProgress,
  RelatedArticles,
  RelatedProjects,
  RelatedServices,
} from "@/features/articles/components"
import { useArticleBySlug } from "@/features/articles/hooks"
import { articleAnalytics, transformArticleContent } from "@/features/articles/services"
import { formatArticleDate, readingTimeLabel } from "@/features/articles/utils"
import { useLanguage } from "@/app/language/useLanguage"
import type { SectionConfig } from "../../types"
import type { TocEntry } from "@/features/articles/types"

import { type SectionProps } from "./common"

function useArticle(config: SectionConfig) {
  const slug = String(config.articleSlug ?? config.article_slug ?? "")
  const query = useArticleBySlug(slug)
  return { slug, article: query.data, query }
}

/** 1 · Article Hero — title, meta, tags, cover. */
export function ArticleHeroSection({ config }: SectionProps) {
  const { language } = useLanguage()
  const { t } = useTranslation()
  const { article, query } = useArticle(config)
  if (query.isLoading) return <div className="container-hanahoush py-16"><p className="text-muted-foreground">{t("article.loading")}</p></div>
  if (query.isError || !article) return <div className="container-hanahoush py-16"><p className="text-destructive">{t("article.unavailable")}</p></div>
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/articles/${article.slug}` : ""
  return (
    <section className="relative overflow-hidden pt-16 pb-10">
      <div className="container-hanahoush">
        <div className="mx-auto max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Breadcrumb
              className="mb-6"
              items={[
                { label: t("nav.home"), href: "/" },
                { label: t("nav.articles"), href: "/articles" },
                { label: article.title_en || t("nav.articles") },
              ]}
            />
            <div className="flex flex-wrap items-center gap-2">
              {article.category ? <Badge variant="secondary">{article.category.title_en}</Badge> : null}
              {article.published_at ? (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" /> {formatArticleDate(article.published_at, language)}
                </span>
              ) : null}
              {article.reading_time ? (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" /> {readingTimeLabel(article.reading_time, language)}
                </span>
              ) : null}
            </div>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">{article.title_en}</h1>
            <p className="mt-4 text-lg text-muted-foreground">{article.short_description_en || ""}</p>
            <div className="mt-5 flex flex-wrap items-center gap-4">
              {article.author ? (
                <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <UserRound className="h-4 w-4" /> <span className="font-medium text-foreground">{article.author}</span>
                </span>
              ) : null}
              <ArticleShare title={article.title_en} url={shareUrl} />
            </div>
          </motion.div>
          {article.cover_image?.file ? (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} className="mt-8 overflow-hidden rounded-3xl border">
              <ResponsiveImage src={article.cover_image.file} alt={article.title_en} className="aspect-[21/9] h-full w-full" />
            </motion.div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

/** 2 · Article Content — safe body render + TOC + reading progress. */
export function ArticleContentSection({ config }: SectionProps) {
  const { language } = useLanguage()
  const { article, query } = useArticle(config)
  const [toc, setToc] = useState<TocEntry[]>([])
  const [mobileTocOpen, setMobileTocOpen] = useState(false)
  const { t } = useTranslation()

  if (query.isLoading || !article) return null
  const rawHtml = article.description_fa && language === "fa" ? article.description_fa
    : article.description_ar && language === "ar" ? article.description_ar
    : article.description_en || article.description_fa || article.description_ar || ""
  const transformed = transformArticleContent(rawHtml)
  const tocForRender = toc.length ? toc : transformed.toc

  return (
    <section className="py-10">
      <ReadingProgress />
      <div className="container-hanahoush">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[220px_minmax(0,720px)]">
          {/* Desktop TOC */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-6">
              <ArticleTableOfContents toc={tocForRender} />
              <ArticleMeta article={article} locale={language} className="flex-col items-start" />
            </div>
          </aside>

          <div>
            <button
              type="button"
              className="mb-4 inline-flex items-center gap-1 rounded-lg border bg-card px-3 py-1.5 text-sm text-muted-foreground lg:hidden"
              onClick={() => setMobileTocOpen((v) => !v)}
              aria-expanded={mobileTocOpen}
              aria-controls="article-mobile-toc"
            >
              {mobileTocOpen ? t("article.tocHide") : t("article.toc")}
            </button>
            {mobileTocOpen ? (
              <div id="article-mobile-toc" className="mb-6 rounded-xl border bg-card p-4 lg:hidden">
                <ArticleTableOfContents toc={tocForRender} />
              </div>
            ) : null}
            <div className="article-body prose prose-slate dark:prose-invert max-w-none">
              <ArticleContent
                html={rawHtml}
                onToc={(next) => {
                  if (next.length) setToc(next)
                  articleAnalytics.section("article_content")
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/** 3 · Related content (articles / projects / services). */
export function ArticleRelatedSection({ config }: SectionProps) {
  const { language } = useLanguage()
  const { article } = useArticle(config)
  const { t } = useTranslation()
  if (!article) return null
  useEffect(() => {
    articleAnalytics.section("article_related")
  }, [])
  return (
    <section className="border-t py-16 bg-muted/30">
      <div className="container-hanahoush space-y-12">
        <div>
          <h2 className="text-2xl font-bold">{t("article.relatedArticles")}</h2>
          <div className="mt-6">
            <RelatedArticles articles={article.related_articles} locale={language} />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold">{t("article.relatedProjects")}</h2>
          <div className="mt-6">
            <RelatedProjects projects={article.related_projects} />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold">{t("article.relatedServices")}</h2>
          <div className="mt-6">
            <RelatedServices services={article.related_services} />
          </div>
        </div>
      </div>
    </section>
  )
}

/** 4 · Article newsletter CTA. */
export function ArticleNewsletterSection({ config }: SectionProps) {
  const { t } = useTranslation()
  return (
    <section className="py-16">
      <div className="container-hanahoush">
        <NewsletterCTA source={String(config.source ?? "articles-detail")} title={t("article.newsletterTitle")} description={t("article.newsletterDescription")} />
      </div>
    </section>
  )
}
