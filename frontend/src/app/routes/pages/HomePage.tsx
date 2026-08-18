import { useTranslation } from "react-i18next"

import { SiteBackground } from "@/design/background"
import { useLanguage } from "@/app/language/useLanguage"
import { ErrorState } from "@/components/ui/error-state"
import { Skeleton } from "@/components/ui/skeleton"
import { usePage } from "@/features/page-builder"
import { PageRenderer } from "@/features/page-builder"
import { useSeoMeta, type SeoInput } from "@/features/cms/seo"
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

/**
 * Home route. The page layout is no longer hardcoded — it is composed at
 * runtime by <PageRenderer /> from the published "home" page configuration
 * served by the Page Builder API.
 */
export function HomePage() {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const page = usePage("home")

  useSeoMeta(seoInput(page.data?.seo), language, { title: "Hanahoush" })

  if (page.isLoading) {
    return (
      <main className="space-y-12">
        <Skeleton className="mx-auto h-12 w-2/3" />
        <Skeleton className="mx-auto h-24 w-full max-w-4xl" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      </main>
    )
  }

  if (page.isError || !page.data) {
    return (
      <main className="p-8">
        <ErrorState
          title={t("errors.loadingPageTitle")}
          description={t("errors.unexpected")}
          onRetry={() => page.refetch()}
        />
      </main>
    )
  }

  return (
    <main>
      <SiteBackground grid particles />
      <PageRenderer page={page.data} />
    </main>
  )
}
