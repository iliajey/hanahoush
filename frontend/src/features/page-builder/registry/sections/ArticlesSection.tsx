import { useLanguage } from "@/app/language/useLanguage"
import { ArticleCard, ArticleGrid } from "@/components/marketing/articles"
import { useFeaturedArticles } from "@/features/cms"
import { CmsAsync } from "@/features/cms/components"
import { mapArticles } from "@/features/cms/mappers"

import { SectionHeading, type SectionProps } from "./common"

/** Featured article cards. */
export default function ArticlesSection({ config }: SectionProps) {
  const { language } = useLanguage()
  const articles = useFeaturedArticles(Number(config.limit ?? 3))

  return (
    <section className="border-t py-20 bg-muted/30">
      <SectionHeading config={config} />
      <CmsAsync
        isLoading={articles.isLoading}
        isError={articles.isError}
        onRetry={() => articles.refetch()}
        isEmpty={!articles.data?.length}
      >
        <ArticleGrid className="mt-12">
          {mapArticles(articles.data ?? [], language).map((article) => (
            <ArticleCard
              key={article.id}
              title={article.title}
              description={article.description}
              image={article.image}
              category={article.category}
              date={article.date}
              readTime={article.readTime}
              featured={article.featured}
            />
          ))}
        </ArticleGrid>
      </CmsAsync>
    </section>
  )
}
