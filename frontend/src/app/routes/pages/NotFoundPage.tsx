import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { FileText, FolderKanban, Home, MessagesSquare, Search, Wrench } from "lucide-react"

import { PageWrapper } from "@/app/layouts/PageWrapper"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/app/language/useLanguage"
import { useSeoMeta } from "@/features/cms/seo"

const EXPLORE_LINKS = [
  { to: "/search", labelKey: "nav.search", icon: Search },
  { to: "/services", labelKey: "nav.services", icon: Wrench },
  { to: "/projects", labelKey: "nav.projects", icon: FolderKanban },
  { to: "/articles", labelKey: "nav.articles", icon: FileText },
  { to: "/contact", labelKey: "nav.contact", icon: MessagesSquare },
] as const

export function NotFoundPage() {
  const { t } = useTranslation()
  const { language } = useLanguage()

  useSeoMeta({ title: t("notFound.title"), robots: "noindex,follow" }, language)

  return (
    <PageWrapper>
      <div className="flex flex-col items-center gap-6 py-20 text-center">
        <span className="text-7xl font-black text-brand-600/70 dark:text-brand-400/60" aria-hidden="true">404</span>
        <h1 className="text-2xl font-bold">{t("notFound.title")}</h1>
        <p className="max-w-md text-muted-foreground">{t("notFound.description")}</p>
        <Button asChild>
          <Link to="/">
            <Home className="me-2 h-4 w-4" aria-hidden="true" />
            {t("nav.home")}
          </Link>
        </Button>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          {EXPLORE_LINKS.map(({ to, labelKey, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-brand-500/40 hover:bg-accent"
            >
              <Icon className="h-4 w-4 text-brand-600 dark:text-brand-400" aria-hidden="true" />
              {t(labelKey)}
            </Link>
          ))}
        </div>
      </div>
    </PageWrapper>
  )
}