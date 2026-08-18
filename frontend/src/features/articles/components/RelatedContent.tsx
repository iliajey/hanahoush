import { motion } from "framer-motion"
import { ArrowRight, FolderGit2, Layers } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { ResponsiveImage } from "@/features/cms/components/ResponsiveImage"
import { articleAnalytics } from "../services/analytics"
import type { ArticleDetail } from "../types"
import { articleExcerpt, articleTitle, formatArticleDate, readingTimeLabel } from "../utils"

const MotionLink = motion(Link)

/** Related articles (server-computed by category/tag overlap). */
export function RelatedArticles({ articles, locale }: { articles: ArticleDetail["related_articles"]; locale: string }) {
  if (articles.length === 0) return null
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {articles.map((article, i) => (
        <MotionLink
          key={article.id}
          to={`/articles/${article.slug}`}
          onClick={() => articleAnalytics.relatedArticle(article.slug)}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.35, delay: i * 0.05 }}
          className="group overflow-hidden rounded-2xl border bg-card transition-colors hover:border-brand-500/40"
        >
          {article.cover_image?.file ? (
            <div className="aspect-video overflow-hidden bg-muted">
              <ResponsiveImage src={article.cover_image.file} alt={article.title_en} className="h-full w-full transition-transform duration-300 group-hover:scale-105" />
            </div>
          ) : null}
          <div className="p-5">
            <h4 className="font-semibold group-hover:text-primary">{articleTitle(article, locale)}</h4>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{articleExcerpt(article, locale)}</p>
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              {article.published_at ? <span>{formatArticleDate(article.published_at, locale)}</span> : null}
              {article.reading_time ? <span>{readingTimeLabel(article.reading_time, locale)}</span> : null}
            </div>
          </div>
        </MotionLink>
      ))}
    </div>
  )
}

/** Related projects (server-computed by technology/topic overlap). */
export function RelatedProjects({ projects }: { projects: ArticleDetail["related_projects"] }) {
  const { t } = useTranslation()
  if (projects.length === 0) return null
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <Link
          key={project.id}
          to={`/projects/${project.slug}`}
          onClick={() => articleAnalytics.relatedProject(project.slug)}
          className="group rounded-2xl border bg-card p-5 transition-colors hover:border-brand-500/40"
        >
          <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <FolderGit2 className="h-3.5 w-3.5" /> {t("article.caseStudyLabel")}
          </span>
          <h4 className="mt-2 font-semibold group-hover:text-primary">{project.title}</h4>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{project.short_description || ""}</p>
        </Link>
      ))}
    </div>
  )
}

/** Related services (server-computed by topic overlap). */
export function RelatedServices({ services }: { services: ArticleDetail["related_services"] }) {
  const { t } = useTranslation()
  if (services.length === 0) return null
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {services.map((service) => (
        <Link
          key={service.id}
          to={service.href || "/services"}
          onClick={() => articleAnalytics.relatedService(service.id)}
          className="group rounded-2xl border bg-card p-5 transition-colors hover:border-brand-500/40"
        >
          <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <Layers className="h-3.5 w-3.5" /> {t("article.serviceLabel")}
          </span>
          <h4 className="mt-2 font-semibold group-hover:text-primary">{service.title}</h4>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{service.description || ""}</p>
        </Link>
      ))}
    </div>
  )
}

/** Article meta row (author, dates, reading time, tags). */
export function ArticleMeta({
  article,
  locale,
  className,
}: {
  article: ArticleDetail
  locale: string
  className?: string
}) {
  const { t } = useTranslation()
  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground ${className ?? ""}`}>
      {article.author ? <span>{t("article.metaBy")} <span className="font-medium text-foreground">{article.author}</span></span> : null}
      {article.published_at ? <span>{t("article.metaPublished")} {formatArticleDate(article.published_at, locale)}</span> : null}
      {article.reading_time ? <span>{readingTimeLabel(article.reading_time, locale)}</span> : null}
      <div className="flex flex-wrap gap-1.5">
        {(article.tags ?? []).map((tag) => (
          <Link key={tag.id} to={`/articles?tag=${tag.slug}`} onClick={() => articleAnalytics.tagClick(tag.slug)} className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium hover:bg-muted/70">
            {tag.title_en}
          </Link>
        ))}
      </div>
    </div>
  )
}

/** Contextual final CTA. */
export function ArticleCTA({ hasRelatedProject }: { hasRelatedProject?: boolean }) {
  const { t } = useTranslation()
  const primaryLabel = hasRelatedProject ? t("articleCTA.caseStudy") : t("articleCTA.talk")
  const primaryHref = hasRelatedProject ? undefined : "/contact"
  return (
    <div className="rounded-3xl bg-gradient-to-br from-brand-600 to-brand-900 p-10 text-center text-white">
      <h3 className="text-3xl font-bold">{t("articleCTA.title")}</h3>
      <p className="mx-auto mt-3 max-w-xl text-white/80">{t("articleCTA.body")}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-4">
        {primaryHref ? (
          <Link
            to={primaryHref}
            onClick={() => articleAnalytics.cta(primaryLabel)}
            className="inline-flex items-center gap-1 rounded-lg bg-white px-6 py-3 font-semibold text-brand-700 hover:bg-white/90"
          >
            {primaryLabel} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Link>
        ) : null}
        <Link
          to="/contact"
          onClick={() => articleAnalytics.cta("contact")}
          className="inline-flex items-center rounded-lg border border-white/40 px-6 py-3 font-semibold text-white hover:bg-white/10"
        >
          {t("articleCTA.contact")}
        </Link>
      </div>
    </div>
  )
}