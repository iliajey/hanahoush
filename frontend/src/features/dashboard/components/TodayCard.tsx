import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { Sun } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuthorization } from "@/features/auth/hooks/useAuthorization"
import { CAPABILITIES } from "@/features/auth/role-config"
import type { OperationalDashboard } from "../types"

function countAttention(data: OperationalDashboard): number {
  return (
    (data.content.articles_drafts ?? 0) +
    (data.content.articles_awaiting_review ?? 0) +
    (data.editorial.pending_approvals ?? 0) +
    (data.editorial.failed_count ?? 0) +
    (data.editorial.overdue_count ?? 0)
  )
}

/** Today/Focus card: real dashboard data only, role-aware, honest empty state. */
export function TodayCard({ data }: { data: OperationalDashboard }) {
  const { t } = useTranslation()
  const { can } = useAuthorization()

  const attention = can(CAPABILITIES.EDITORIAL) || can(CAPABILITIES.CONTENT_ARTICLES) ? countAttention(data) : 0
  const scheduledToday = can(CAPABILITIES.EDITORIAL) ? (data.editorial.today_count ?? 0) : 0
  const failed = can(CAPABILITIES.EDITORIAL) ? (data.editorial.failed_count ?? 0) : 0
  const review = can(CAPABILITIES.CONTENT_ARTICLES) ? (data.content.articles_awaiting_review ?? 0) : 0

  const rows = [
    attention > 0 ? { key: "attention", label: t("today.attention", { count: attention }), to: "/dashboard/timeline?bucket=attention" } : null,
    scheduledToday > 0 ? { key: "scheduled", label: t("today.scheduled", { count: scheduledToday }), to: "/dashboard/timeline" } : null,
    failed > 0 ? { key: "failed", label: t("today.failed", { count: failed }), to: "/dashboard/timeline?bucket=attention" } : null,
    review > 0 ? { key: "review", label: t("today.review", { count: review }), to: "/dashboard/articles?status=review" } : null,
  ].filter((r): r is { key: string; label: string; to: string } => r != null)

  if (!rows.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sun className="h-4 w-4 text-brand-600 dark:text-brand-400" aria-hidden="true" />
            {t("today.title")}
          </CardTitle>
          <CardDescription>{t("today.allClearTitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t("today.allClearDescription")}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-brand-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sun className="h-4 w-4 text-brand-600 dark:text-brand-400" aria-hidden="true" />
          {t("today.title")}
        </CardTitle>
        <CardDescription>{t("today.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-2">
          {rows.map((row) => (
            <li key={row.key}>
              <Link
                to={row.to}
                className="flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:border-brand-500/40 hover:bg-accent"
              >
                <span dir="auto">{row.label}</span>
                <Badge variant="secondary" className="shrink-0">{t("today.openQueue")}</Badge>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
