import { useTranslation } from "react-i18next"
import { Activity } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { OperationalDashboard } from "../types"

/** Compact UX system indicator from existing dashboard data. No new monitoring. */
export function SystemPulse({ data }: { data: OperationalDashboard }) {
  const { t } = useTranslation()
  const db = data.system.database.status
  const healthy = db === "healthy"
  return (
    <Card>
      <CardContent className="flex items-center gap-2 p-4">
        <Activity className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" aria-hidden="true" />
        <span className="text-sm font-medium">{t("systemPulse.title")}</span>
        <Badge variant={healthy ? "success" : "warning"} className="ms-auto gap-1.5">
          <span aria-hidden="true">●</span>
          {healthy ? t("systemPulse.operational") : db === "unknown" ? t("systemPulse.unknown") : t("systemPulse.degraded")}
        </Badge>
      </CardContent>
    </Card>
  )
}
