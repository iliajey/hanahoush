import { useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"

import { SiteBackground } from "@/design/background"
import { useLanguage } from "@/app/language/useLanguage"
import { ErrorState } from "@/components/ui/error-state"
import { Skeleton } from "@/components/ui/skeleton"
import { usePage, PageRenderer } from "@/features/page-builder"
import { useSeoMeta, JsonLd, type SeoInput } from "@/features/cms/seo"
import { useScrollDepth } from "@/features/analytics"
import { useAbout, useFAQs, useSiteSettings } from "@/features/cms"
import { companyAnalytics } from "@/features/analytics/domains"
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
 * /about — the Company / About experience, composed by <PageRenderer /> from
 * the published "about" Page record. Never hardcodes the layout: hero, story,
 * mission/vision, values, team, timeline, partners, testimonials, FAQ,
 * offices, social links and CTA all come from the CMS + section registry.
 *
 * Emits Organization + FAQPage structured data and tracks analytics events.
 */
export function AboutPage() {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const page = usePage("about")
  const about = useAbout()
  const settings = useSiteSettings()
  const faqs = useFAQs({ pageSize: 20 })

  useScrollDepth("about")
  useSeoMeta(seoInput(page.data?.seo), language, { title: t("about.title") })
  useEffect(() => {
    companyAnalytics.view()
  }, [])

  const organization = useMemo(() => {
    const site = settings.data
    const logo = site?.logo?.file
    const data: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: site?.site_name || "Hanahoush",
      description: about.data?.description || undefined,
      url: window.location.origin,
      email: site?.contact_email || undefined,
      telephone: site?.contact_phone || undefined,
      logo: logo ? { "@type": "ImageObject", url: logo } : undefined,
      contactPoint: site?.contact_email
        ? {
            "@type": "ContactPoint",
            contactType: "sales",
            email: site.contact_email,
            telephone: site.contact_phone || undefined,
            availableLanguage: ["en", "fa", "ar"],
          }
        : undefined,
      sameAs: undefined,
    }
    return data
  }, [settings.data, about.data])

  const faqData = useMemo(() => {
    const items = faqs.data?.items ?? []
    if (!items.length) return null
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: items.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    }
  }, [faqs.data])

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
      <JsonLd data={organization} />
      {faqData ? <JsonLd data={faqData} /> : null}
      <SiteBackground grid particles />
      <PageRenderer page={page.data} />
    </main>
  )
}