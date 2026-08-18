import type { LucideIcon } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"

export interface StatTileProps {
  label: string
  value: number | string
  icon?: LucideIcon
  hint?: string
}

/** Dense metric tile for the operational dashboard. */
export function StatTile({ label, value, icon: Icon, hint }: StatTileProps) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
          {hint ? <p className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        {Icon ? <Icon className="h-5 w-5 shrink-0 text-brand-600 dark:text-brand-400" aria-hidden="true" /> : null}
      </CardContent>
    </Card>
  )
}