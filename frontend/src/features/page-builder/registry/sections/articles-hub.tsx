import { useEffect, useState } from "react"
import { Search } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { ArticleCard, ArticleGrid } from "@/components/marketing/articles"
import { CmsAsync } from "@/features/cms/components"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  ArticleFilterBar,
  CategoryExplorer,
  FeaturedArticle,
  NewsletterCTA,
  TagExplorer,
  ArticleCTA,
} from "@/features/articles/components"
import {
  useArticleCategories,
  useArticleTags,
  useArticlesFiltered,
  useFeaturedArticlesList,
} from "@/features/articles/hooks"
import { articleAnalytics, setArticleSearchQuery, useArticleSearchQuery } from "@/features/articles/services"
import { mapArticleCards } from "@/features/articles/mappers"
import { useLanguage } from "@/app/language/useLanguage"
import type { ArticleFilters } from "@/features/articles/types"

import { cfgString, SectionHeading, type SectionProps } from "./common"

/** 1 · Articles Hero — editorial heading + live search. */
export function ArticlesHeroSection({ config }: SectionProps) {
  const [value, setValue] = useState("")
  const { t } = useTranslation()
  return (
    <section className="relative overflow-hidden pt-20 pb-14">
      <div className="container-hanahoush relative z-10 flex flex-col items-center gap-6 text-center">
        <span className="inline-flex rounded-full bg-brand-500/10 px-4 py-1.5 text-sm font-semibold uppercase tracking-widest text-brand-700 dark:text-brand-300">
          {cfgString(config, "eyebrow", "Hanahoush Engineering & Technology")}
        </span>
        <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          {cfgString(config, "headline", "The engineering magazine.")}
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">{cfgString(config, "subtitle")}</p>
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder={t("search.placeholder")}
            className="h-11 pl-10"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-label={t("search.placeholder")}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                articleAnalytics.search(value)
                setArticleSearchQuery(value)
                document.getElementById("discover")?.scrollIntoView({ behavior: "smooth" })
              }
            }}
          />
        </div>
      </div>
    </section>
  )
}

/** 2 · Featured Article — one dominant editorial article. */
export function FeaturedArticleSection({ config }: SectionProps) {
  const { language } = useLanguage()
  const { t } = useTranslation()
  const featured = useFeaturedArticlesList(Number(config.limit ?? 1))
  const article = featured.data?.[0]
  return (
    <section className="py-12">
      <div className="container-hanahoush">
        <SectionHeading config={config} />
        {featured.isLoading ? <p className="mt-8 text-muted-foreground">{t("articleList.loadingFeatured")}</p> : null}
        <div className="mt-8">
          <FeaturedArticle article={article} locale={language} />
        </div>
      </div>
    </section>
  )
}

/** 3 · Latest Articles — responsive editorial grid. */
export function LatestArticlesSection({ config }: SectionProps) {
  const { language } = useLanguage()
  const query = useArticlesFiltered({ pageSize: Number(config.limit ?? 6) })
  return (
    <section className="border-t py-20 bg-muted/30">
      <SectionHeading config={config} />
      <div className="container-hanahoush mt-10">
        <CmsAsync isLoading={query.isLoading} isError={query.isError} isEmpty={!query.data?.items.length}>
<ArticleGrid>
            {mapArticleCards(query.data?.items ?? [], language).map((card, i) => (
              <Link key={i} to={`/articles/${query.data?.items[i]?.slug}`} className="contents">
                <ArticleCard {...card} />
              </Link>
            ))}
          </ArticleGrid>
        </CmsAsync>
      </div>
    </section>
  )
}

/** 4 · Article Discovery — search/filters/sort + server-side paginated grid. */
export function ArticleFiltersSection({ config }: SectionProps) {
  const { language } = useLanguage()
  const { t } = useTranslation()
  const searchQuery = useArticleSearchQuery()
  const categories = useArticleCategories()
  const tags = useArticleTags()
  const [filters, setFilters] = useState<ArticleFilters>({
    pageSize: Number(config.page_size ?? 12),
    ordering: "-published_at",
  })
  const query = useArticlesFiltered({ ...filters, q: searchQuery || filters.q })

  return (
    <section id="discover" className="border-t py-20">
      <div className="container-hanahoush">
        <SectionHeading config={config} />
        <div className="mt-8">
          <ArticleFilterBar
            filters={filters}
            onChange={setFilters}
            categories={categories.data ?? []}
            tags={tags.data ?? []}
            count={query.data?.count ?? 0}
          />
        </div>
<div className="mt-8">
          {query.isLoading ? <p className="text-muted-foreground">{t("articleList.loading")}</p> : null}
          {query.isError ? <p className="text-destructive">{t("articleList.error")}</p> : null}
          {query.data && query.data.items.length === 0 && !query.isLoading ? (
            <p className="text-muted-foreground">{t("articleList.empty")}</p>
          ) : null}
          {query.data && query.data.items.length > 0 ? (
            <>
              <ArticleGrid>
                {mapArticleCards(query.data.items, language).map((card, i) => (
                  <Link key={i} to={`/articles/${query.data?.items[i]?.slug}`} className="contents">
                    <ArticleCard {...card} />
                  </Link>
                ))}
              </ArticleGrid>
              <div className="mt-8 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("articleList.count", { count: query.data.count })}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) + 1 }))}
                  disabled={!query.data || query.data.items.length >= query.data.count}
                >
{t("articleList.loadMore")}
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </section>
  )
}

/** 5 · Category Explorer — real CMS categories. */
export function CategoryExplorerSection({ config }: SectionProps) {
  const categories = useArticleCategories()
  return (
    <section className="border-t py-16 bg-muted/30">
      <div className="container-hanahoush">
        <SectionHeading config={config} />
        <div className="mt-8">
          <CategoryExplorer categories={categories.data ?? []} />
        </div>
      </div>
    </section>
  )
}

/** 6 · Tag / Topic Explorer — real CMS tags. */
export function TagExplorerSection({ config }: SectionProps) {
  const tags = useArticleTags()
  return (
    <section className="border-t py-16">
      <div className="container-hanahoush">
        <SectionHeading config={config} />
        <div className="mt-8">
          <TagExplorer tags={tags.data ?? []} />
        </div>
      </div>
    </section>
  )
}

/** 7 · Newsletter CTA. */
export function NewsletterCTASection({ config }: SectionProps) {
  return (
    <section className="py-16">
      <div className="container-hanahoush">
        <NewsletterCTA source={String(config.source ?? "articles-newsletter")} title={cfgString(config, "title", "Don't miss new engineering writing.")} description={cfgString(config, "description")} />
      </div>
    </section>
  )
}

/** 8 · Final Article CTA. */
export function ArticleCTASection({ config: _config }: SectionProps) {
  useEffect(() => {
    articleAnalytics.section("article_cta")
  }, [])
  return (
    <section className="py-16">
      <div className="container-hanahoush">
        <ArticleCTA />
      </div>
    </section>
  )
}
