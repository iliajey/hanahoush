import { CalendarClock, Send } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/shared/lib/cn"

/** Publish / schedule control for an approved workflow. */
export function PublishButton({
  canPublish = true,
  canSchedule = true,
  onPublish,
  onSchedule,
  className,
}: {
  canPublish?: boolean
  canSchedule?: boolean
  onPublish?: (soft: boolean) => void
  onSchedule?: (datetime: string) => void
  className?: string
}) {
  const [soft, setSoft] = useState(false)
  const [when, setWhen] = useState("")

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Button size="sm" disabled={!canPublish || !onPublish} onClick={() => onPublish?.(soft)}>
        <Send className="mr-2 h-3.5 w-3.5" />
        Publish
      </Button>
      <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
        <input type="checkbox" checked={soft} onChange={(e) => setSoft(e.target.checked)} className="accent-brand-600" />
        Soft publish
      </label>
      <div className="flex items-center gap-1.5">
        <Input
          type="datetime-local"
          value={when}
          onChange={(e) => setWhen(e.target.value)}
          className="h-8 w-44 text-xs"
          aria-label="Schedule publish time"
        />
        <Button
          size="sm"
          variant="outline"
          className="h-8 px-2"
          disabled={!canSchedule || !onSchedule || !when}
          onClick={() => when && onSchedule?.(new Date(when).toISOString())}
        >
          <CalendarClock className="h-3.5 w-3.5" /> Schedule
        </Button>
      </div>
    </div>
  )
}