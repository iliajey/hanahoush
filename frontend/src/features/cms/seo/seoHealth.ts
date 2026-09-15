import type { HealthItem } from "@/components/ui"

type SeoSource = {
  slug?: string
  meta_title?: string
  meta_description?: string
  canonical_url?: string
  og_image?: { file: string } | null
  ogImageUrl?: string | null
  title_en?: string
  title_fa?: string
  title_ar?: string
  short_description_en?: string
  short_description_fa?: string
  short_description_ar?: string
  description_en?: string
  description_fa?: string
  description_ar?: string
}

export interface SeoTargetIds {
  slug?: string
  title?: string
  description?: string
  canonical?: string
  og?: string
}

export function seoHealthItems(
  source: SeoSource,
  t: (k: string, o?: Record<string, unknown>) => string,
  ids: SeoTargetIds = {},
): HealthItem[] {
  const items: HealthItem[] = []
  const tid = {
    slug: ids.slug ?? "seo-slug",
    title: ids.title ?? "seo-title",
    description: ids.description ?? "seo-description",
    canonical: ids.canonical ?? "seo-canonical",
    og: ids.og ?? "seo-og",
  }
  const title = (source.meta_title ?? "").trim()
  const desc = (source.meta_description ?? "").trim()
  const slug = (source.slug ?? "").trim()
  const canonical = (source.canonical_url ?? "").trim()
  const hasOg = Boolean(source.og_image?.file || source.ogImageUrl)
  if (!slug) items.push({ key: "seo-slug", severity: "critical", message: t("seo.health.missingSlug"), target: tid.slug })
  if (!title) items.push({ key: "seo-title-missing", severity: "warning", message: t("seo.health.missingTitle"), target: tid.title })
  else if (title.length > 60) items.push({ key: "seo-title-long", severity: "warning", message: t("seo.health.titleLong", { count: title.length }), target: tid.title })
  else if (title.length < 10) items.push({ key: "seo-title-weak", severity: "warning", message: t("seo.health.titleWeak"), target: tid.title })
  if (!desc) items.push({ key: "seo-desc-missing", severity: "warning", message: t("seo.health.missingDescription"), target: tid.description })
  else if (desc.length > 160) items.push({ key: "seo-desc-long", severity: "warning", message: t("seo.health.descriptionLong", { count: desc.length }), target: tid.description })
  if (!canonical) items.push({ key: "seo-canonical-missing", severity: "warning", message: t("seo.health.missingCanonical"), target: tid.canonical })
  if (!hasOg) items.push({ key: "seo-og-missing", severity: "warning", message: t("seo.health.missingOgImage"), target: tid.og })
  for (const locale of ["fa", "en", "ar"] as const) {
    const lt = (source[`title_${locale}` as keyof SeoSource] as string | undefined)?.trim()
    if (!lt) items.push({ key: `seo-locale-${locale}`, severity: "warning", message: t("seo.health.missingLocale", { locale: locale.toUpperCase() }), target: tid.title, locale })
  }
  if (canonical && slug && !canonical.includes(slug)) items.push({ key: "seo-canonical-mismatch", severity: "warning", message: t("seo.health.canonicalMismatch"), target: tid.canonical })
  return items
}
