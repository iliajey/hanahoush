import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Files, FolderKanban, MessagesSquare, Rocket, Search, Users } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { PageWrapper } from "@/app/layouts/PageWrapper"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useUser } from "@/features/auth/hooks/useUser"
import { UserAvatar } from "@/features/auth/components/UserAvatar"
import { getDisplayName } from "@/features/auth/utils"
import { useLanguage } from "@/app/language/useLanguage"
import { useSeoMeta } from "@/features/cms/seo"

const QUICK_LINKS: { to: string; labelKey: string; icon: LucideIcon }[] = [
  { to: "/services", labelKey: "nav.services", icon: Rocket },
  { to: "/projects", labelKey: "nav.projects", icon: FolderKanban },
  { to: "/articles", labelKey: "nav.articles", icon: Files },
  { to: "/about", labelKey: "nav.about", icon: Users },
  { to: "/contact", labelKey: "nav.contact", icon: MessagesSquare },
  { to: "/search", labelKey: "nav.search", icon: Search },
]

/**
 * Authenticated landing page. This is an account overview, not an
 * operational ERP dashboard — operational surfaces arrive with the real
 * ERP track (Phase 10, when Odoo 19 is deployed). Content management is
 * performed from the staff admin console.
 */
export function DashboardPage() {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const { user } = useUser()

  useSeoMeta({ title: t("nav.dashboard"), robots: "noindex,follow" }, language)

  return (
    <PageWrapper title={t("nav.dashboard")} description={t("dashboard.intro")}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
        <Card className="h-fit">
          <CardHeader className="flex flex-row items-center gap-4">
            {user ? <UserAvatar user={user} className="h-12 w-12" /> : null}
            <div className="min-w-0">
              <CardTitle className="truncate">{user ? getDisplayName(user) : "—"}</CardTitle>
              <CardDescription className="truncate">{user?.email}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("dashboard.session")}</span>
              <Badge variant="success">{t("dashboard.sessionActive")}</Badge>
            </div>
            {user?.role ? (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("dashboard.role")}</span>
                <span className="font-medium">{user.role.name}</span>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.quickLinksTitle")}</CardTitle>
            <CardDescription>{t("dashboard.quickLinksDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-3 sm:grid-cols-2">
              {QUICK_LINKS.map(({ to, labelKey, icon: Icon }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 text-sm font-medium transition-colors hover:border-brand-500/40 hover:bg-accent"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" aria-hidden="true" />
                    {t(labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  )
}