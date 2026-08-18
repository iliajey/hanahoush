import { LockKeyhole } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { ContentLock } from "../types"

function remaining(expiresAt: string): string {
  try {
    const minutes = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 60000)
    return `${Math.max(1, minutes)} min`
  } catch {
    return "…"
  }
}

/** Shows who holds the content lock and when it auto-releases. */
export function LockIndicator({
  lock,
  onRelease,
  showRelease = true,
}: {
  lock: ContentLock | null
  onRelease?: () => void
  showRelease?: boolean
}) {
  if (!lock) return null
  return (
    <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm">
      <LockKeyhole className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
      <span className="min-w-0 truncate">
        Locked by <span className="font-medium">{lock.locked_by.username}</span> · auto-unlocks in{" "}
        <Badge variant="secondary" className="text-xs">
          {remaining(lock.expires_at)}
        </Badge>
      </span>
      {showRelease && onRelease ? (
        <Button size="sm" variant="ghost" className="ml-auto h-7 px-2 text-xs" onClick={onRelease}>
          Release
        </Button>
      ) : null}
    </div>
  )
}