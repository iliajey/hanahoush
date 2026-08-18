import { ArrowDown, ArrowLeftRight, ArrowUp } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { DiffChange } from "../types"

function pretty(value: unknown): string {
  if (value === null || value === undefined) return "—"
  if (typeof value === "object") return JSON.stringify(value)
  return String(value)
}

const KIND_META = {
  added: { label: "Added", Icon: ArrowUp, tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  removed: { label: "Removed", Icon: ArrowDown, tone: "bg-destructive/10 text-destructive" },
  changed: { label: "Changed", Icon: ArrowLeftRight, tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
} as const

/** Renders a structured field-level diff between two revisions. */
export function DiffViewer({ changes, from, to }: { changes: DiffChange[]; from?: number; to?: number }) {
  if (!changes || changes.length === 0) {
    return <p className="text-sm text-muted-foreground">No differences between these revisions.</p>
  }
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {from != null && to != null ? (
          <Badge variant="outline" className="font-mono">
            v{from} → v{to}
          </Badge>
        ) : null}
        <span>{changes.length} field(s) changed</span>
      </div>
      {changes.map((change) => {
        const meta = KIND_META[change.kind]
        const Icon = meta.Icon
        return (
          <div key={change.field} className="rounded-xl border bg-card p-3">
            <div className="flex items-center gap-2">
              <Icon className={`h-4 w-4 ${meta.tone.split(" ").at(-1)}`} />
              <code className="text-sm font-semibold">{change.field}</code>
              <span className={`rounded px-1.5 py-0.5 text-xs ${meta.tone}`}>{meta.label}</span>
            </div>
            <div className="mt-2 grid gap-1 text-xs sm:grid-cols-2">
              <div className="rounded bg-destructive/5 px-2 py-1 text-muted-foreground">
                <span className="text-destructive">− </span>
                {pretty(change.old)}
              </div>
              <div className="rounded bg-emerald-500/5 px-2 py-1 text-muted-foreground">
                <span className="text-emerald-600">+ </span>
                {pretty(change.new)}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}