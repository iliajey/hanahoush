import { useTranslation } from "react-i18next"

import { SiteBackground } from "@/design/background"
import { useLanguage } from "@/app/language/useLanguage"
import { ErrorState } from "@/components/ui/error-state"
import { Skeleton } from "@/components/ui/skeleton"
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

/**
 * /contact — the Contact / inquiry experience, composed by <PageRenderer />
 * from the published "contact" Page record. Includes the production contact
 * form (hero → form → offices → socials → CTA).
 */
export function ContactPage() {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const page = usePage("contact")

  useScrollDepth("contact")
  useSeoMeta(seoInput(page.data?.seo), language, { title: t("contact.title") })

  if (page.isLoading) {
    return (
      <main className="space-y-12">
        <Skeleton className="mx-auto h-12 w-2/3" />
        <Skeleton className="mx-auto h-24 w-full max-w-4xl" />
        <Skeleton className="mx-auto h-80 w-full max-w-2xl rounded-3xl" />
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