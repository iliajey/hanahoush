import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { Revision } from "../types"

function formatDate(value: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
  } catch {
    return value
  }
}

/** A single version card with optional rollback action. */
export function RevisionCard({
  revision,
  onRollback,
  isLatest,
}: {
  revision: Revision
  onRollback?: () => void
  isLatest?: boolean
}) {
  return (
    <Card className={isLatest ? "border-brand-500/40" : undefined}>
      <CardContent className="flex items-start gap-3 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted font-mono text-sm font-bold">
          v{revision.version}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{revision.summary || `Revision v${revision.version}`}</span>
            {isLatest ? <Badge variant="secondary">latest</Badge> : null}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {revision.created_by?.username || "system"} · {formatDate(revision.created_at)}
          </div>
        </div>
        {onRollback ? (
          <Button size="sm" variant="outline" onClick={onRollback}>
            Rollback
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}
