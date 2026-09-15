import { useTranslation } from "react-i18next"
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react"

import { Badge } from "./badge"
import type { HealthItem } from "./content-health"

/** Compact health summary reusing existing health items. Never color-only. */
export function HealthIndicator({ items }: { items: HealthItem[] }) {
  const { t } = useTranslation()
  const critical = items.filter((i) => i.severity === "critical").length
  const warnings = items.filter((i) => i.severity === "warning").length
  if (critical > 0) {
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="h-3 w-3" aria-hidden="true" />
        {t("health.blocking")} · {critical}
      </Badge>
    )
  }
  if (warnings > 0) {
    return (
      <Badge variant="warning" className="gap-1">
        <AlertTriangle className="h-3 w-3" aria-hidden="true" />
        {t("health.attention")} · {warnings}
      </Badge>
    )
  }
  return (
    <Badge variant="success" className="gap-1">
      <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
      {t("health.healthy")}
    </Badge>
  )
}
