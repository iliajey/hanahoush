import { useTranslation } from "react-i18next"

import { ErrorState } from "@/components/ui/error-state"
import { Skeleton } from "@/components/ui/skeleton"
import { SiteBackground } from "@/design/background"
import { useLanguage } from "@/app/language/useLanguage"
import { usePage, PageRenderer } from "@/features/page-builder"
import { useSeoMeta, type SeoInput } from "@/features/cms/seo"
import { useScrollDepth } from "@/features/analytics"
import type { PageSEO } from "@/features/page-builder/types"

function seoInput(seo?: PageSEO): SeoInput | undefined {
  if (!seo) return undefined
  return {
    title: seo.meta_title || undefined,
    description: seo.meta_description || undefined,
    keywords: seo.meta_keywords,
    canonicalUrl: seo.canonical_url || undefined,
    ogImage: seo.og_image || undefined,
    robots: seo.robots || undefined,
    ogType: "website",
  }
}

/** /articles — Knowledge Hub / Engineering Magazine, composed by the Page Builder. */
export function ArticlesPage() {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const page = usePage("articles")

  useScrollDepth("articles")
  useSeoMeta(seoInput(page.data?.seo), language, { title: "Hanahoush — Articles" })

  if (page.isLoading) {
    return <main className="p-8"><Skeleton className="mx-auto h-12 w-2/3" /><Skeleton className="mx-auto h-24 w-full max-w-4xl" /></main>
  }
  if (page.isError || !page.data) {
    return <main className="p-8"><ErrorState title="Couldn't load the knowledge hub" description={t("errors.unexpected")} onRetry={() => page.refetch()} /></main>
  }
  return (
    <main>
      <SiteBackground grid particles />
      <PageRenderer page={page.data} />
    </main>
  )
}