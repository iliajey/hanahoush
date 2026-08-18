import { useParams, Link } from "react-router-dom"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { ErrorState } from "@/components/ui/error-state"
import { PageRenderer } from "@/features/page-builder"
import type { Page, PageSection } from "@/features/page-builder/types"
import { useScrollDepth } from "@/features/analytics"
import { useArticleBySlug } from "../hooks"
import { useArticleSeo } from "../services/seo"
import { articleAnalytics } from "../services/analytics"
import { useEffect } from "react"

const ARTICLE_SECTIONS: string[] = ["article_hero", "article_content", "article_related", "article_newsletter", "article_cta"]

function buildArticlePage(slug: string, title: string): Page {
  const sections: PageSection[] = ARTICLE_SECTIONS.map((type, i) => ({
    id: i + 1,
    type,
    title: null,
    is_enabled: true,
    order: i + 1,
    config: { articleSlug: slug },
  }))
  return {
    id: 0,
    slug,
    title,
    status: "published",
    is_home: false,
    template: "article",
    version: 1,
    sections_count: sections.length,
    total_sections: sections.length,
    sections,
  }
}

/** /articles/:slug — the article reading experience, assembled via PageRenderer. */
export function ArticleDetailPage() {
  const { t } = useTranslation()
  const { slug = "" } = useParams<{ slug: string }>()
  const query = useArticleBySlug(slug)
  const article = query.data

  useScrollDepth("articles")
  useArticleSeo({ article, slug })
  useEffect(() => {
    if (article) articleAnalytics.view(article.slug)
  }, [article])

  if (query.isLoading) {
    return (
      <main className="p-8">
        <div className="mx-auto max-w-4xl animate-pulse space-y-4">
          <div className="h-8 w-1/3 rounded-full bg-muted" />
          <div className="h-14 w-2/3 rounded-2xl bg-muted" />
          <div className="h-4 w-1/2 rounded-full bg-muted" />
        </div>
      </main>
    )
  }
  if (query.isError || !article) {
    return (
      <main className="p-8">
        <ErrorState
          title={t("articles.notFoundTitle")}
          description={t("articles.notFoundDescription")}
          onRetry={() => query.refetch()}
        />
        <div className="mt-4 flex justify-center gap-3">
          <Button asChild variant="outline">
            <Link to="/articles">{t("nav.articles")}</Link>
          </Button>
          <Button asChild>
            <Link to="/">{t("nav.home")}</Link>
          </Button>
        </div>
      </main>
    )
  }

  const page = buildArticlePage(article.slug, article.title_en)
  return (
    <main className="flex-1">
      <PageRenderer page={page} />
    </main>
  )
}