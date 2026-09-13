import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react"
import { useTranslation } from "react-i18next"

import { cn } from "@/shared/lib/cn"

import { Badge } from "./badge"
import { Card, CardContent, CardHeader, CardTitle } from "./card"

export type HealthSeverity = "critical" | "warning" | "good"

/** One actionable content-health finding. `target` is an element id the
 * panel scrolls to (and `locale` optionally switches the editing language
 * first) when the user clicks the row. */
export interface HealthItem {
  key: string
  severity: Exclude<HealthSeverity, "good">
  message: string
  target?: string
  locale?: "fa" | "en" | "ar"
}

/** Actionable content-health panel (Phase 15): every warning is clickable
 * and scrolls to the offending field. No vanity scores — only the explicit
 * list of findings plus a healthy confirmation when empty. */
export function ContentHealthPanel({
  items,
  stats,
  healthyLabel,
  onNavigate,
  title,
}: {
  items: HealthItem[]
  stats?: Array<{ label: string; value: string | number }>
  healthyLabel?: string
  onNavigate?: (item: HealthItem) => void
  title?: string
}) {
  const { t } = useTranslation()
  const critical = items.filter((item) => item.severity === "critical").length
  const warnings = items.filter((item) => item.severity === "warning").length

  const activate = (item: HealthItem) => {
    onNavigate?.(item)
    if (!item.target) return
    requestAnimationFrame(() => {
      const node = document.getElementById(item.target!) as HTMLElement | null
      node?.scrollIntoView?.({ behavior: "smooth", block: "center" })
      try {
        ;(node as HTMLElement & { focus?: (opts?: object) => void })?.focus?.({ preventScroll: true })
      } catch {
        /* non-focusable targets (e.g. plain paragraphs) */
      }
    })
  }

  return (
    <Card aria-live="polite">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">{title ?? t("studio.health.title")}</CardTitle>
          <div className="flex items-center gap-1.5">
            {critical > 0 ? (
              <Badge variant="destructive">
                {t("studio.health.critical", { count: critical })}
              </Badge>
            ) : null}
            {warnings > 0 ? (
              <Badge variant="secondary">
                {t("studio.health.warning", { count: warnings })}
              </Badge>
            ) : null}
            {items.length === 0 ? <Badge variant="default">{t("studio.health.good")}</Badge> : null}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {stats?.length ? (
          <dl className="grid gap-2 text-sm sm:grid-cols-2" aria-live="polite">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex items-center justify-between gap-2 rounded-md bg-muted/40 px-3 py-2"
              >
                <dt className="text-muted-foreground">{stat.label}</dt>
                <dd className="font-semibold tabular-nums">{stat.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {items.length > 0 ? (
          <ul className={cn("flex flex-col gap-1.5", stats?.length && "mt-3")}>
            {items.map((item) => (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={() => activate(item)}
                  className="flex w-full items-start gap-2 rounded-md border border-transparent px-2 py-1.5 text-start text-xs transition-colors hover:border-border hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {item.severity === "critical" ? (
                    <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" aria-hidden="true" />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden="true" />
                  )}
                  <span>{item.message}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className={cn("flex items-center gap-1.5 text-xs font-medium text-green-700 dark:text-green-400", stats?.length && "mt-3")}>
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            {healthyLabel ?? t("studio.health.allGood")}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
