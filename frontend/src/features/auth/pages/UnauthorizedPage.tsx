import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { PageWrapper } from "@/app/layouts/PageWrapper"
import { useLanguage } from "@/app/language/useLanguage"
import { useSeoMeta } from "@/features/cms/seo"

export function UnauthorizedPage() {
  const { t } = useTranslation()
  const { language } = useLanguage()

  useSeoMeta({ title: t("auth.unauthorizedTitle"), robots: "noindex,follow" }, language)

  return (
    <PageWrapper title={t("auth.unauthorizedTitle")}>
      <div className="flex flex-col items-center gap-6 py-16 text-center">
        <span className="text-6xl font-black text-destructive/70">403</span>
        <p className="max-w-md text-muted-foreground">{t("auth.unauthorizedDescription")}</p>
        <Button asChild>
          <Link to="/">{t("nav.home")}</Link>
        </Button>
      </div>
    </PageWrapper>
  )
}
