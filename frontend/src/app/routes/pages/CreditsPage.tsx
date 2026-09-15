import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { ArrowLeft, Sparkles } from "lucide-react"

import { PageWrapper } from "@/app/layouts/PageWrapper"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/app/language/useLanguage"
import { useSeoMeta } from "@/features/cms/seo"

interface CreditsSection {
  key: string
  titleKey: string
  body?: string
}

/**
 * Creator-signature page. Sections are data-driven placeholders so future
 * user-provided content slots in without a redesign. No invented claims.
 */
const SECTIONS: CreditsSection[] = [
  { key: "creator", titleKey: "credits.sections.creator" },
  { key: "product", titleKey: "credits.sections.product" },
  { key: "design", titleKey: "credits.sections.design" },
  { key: "engineering", titleKey: "credits.sections.engineering" },
  { key: "tech", titleKey: "credits.sections.tech" },
  { key: "thanks", titleKey: "credits.sections.thanks" },
  { key: "story", titleKey: "credits.sections.story" },
]

export function CreditsPage() {
  const { t } = useTranslation()
  const { language } = useLanguage()
  useSeoMeta({ title: t("credits.title"), robots: "noindex,follow" }, language)

  return (
    <PageWrapper
      title={t("credits.title")}
      description={t("credits.eyebrow")}
      breadcrumb={[{ label: t("nav.home"), href: "/" }, { label: t("credits.title") }]}
    >
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 py-6 text-center">
        <Badge variant="secondary" className="gap-1.5">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          {t("credits.eyebrow")}
        </Badge>
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">{t("credits.title")}</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight" dir="auto" lang="fa">
            {t("credits.nameFa")}
          </h1>
          <p className="mt-1 text-xl text-muted-foreground" dir="ltr" lang="en">
            {t("credits.nameEn")}
          </p>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground" dir="auto">
            {t("credits.tagline")}
          </p>
        </div>
        <div className="grid w-full gap-3 text-start sm:grid-cols-2">
          {SECTIONS.map((s) => (
            <Card key={s.key}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{t(s.titleKey)}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-xs">{t("credits.coming")}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
          {t("credits.back")}
        </Link>
      </div>
    </PageWrapper>
  )
}
