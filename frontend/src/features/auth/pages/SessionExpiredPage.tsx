import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { Timer } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PageWrapper } from "@/app/layouts/PageWrapper"
import { useLanguage } from "@/app/language/useLanguage"
import { useSeoMeta } from "@/features/cms/seo"

export function SessionExpiredPage() {
  const { t } = useTranslation()
  const { language } = useLanguage()

  useSeoMeta({ title: t("auth.sessionExpiredTitle"), robots: "noindex,follow" }, language)

  return (
    <PageWrapper title={t("auth.sessionExpiredTitle")}>
      <div className="flex flex-col items-center gap-6 py-16 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Timer className="h-8 w-8" />
        </span>
        <p className="max-w-md text-muted-foreground">{t("auth.sessionExpiredDescription")}</p>
        <Button asChild>
          <Link to="/login">{t("auth.goToLogin")}</Link>
        </Button>
      </div>
    </PageWrapper>
  )
}
