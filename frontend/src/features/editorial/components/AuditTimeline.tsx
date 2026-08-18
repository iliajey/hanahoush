import { Activity, UserRound } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/shared/lib/cn"
import type { AuditEvent } from "../types"

function formatDate(value: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
  } catch {
    return value
  }
}

/** A single audit event row in a vertical timeline. */
export function AuditEventRow({ event, className }: { event: AuditEvent; className?: string }) {
  return (
    <li className={cn("relative flex gap-3 pl-4 before:absolute before:left-0 before:top-2 before:h-full before:w-px before:bg-border", className)}>
      <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-brand-500" />
      <div className="pb-4">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="outline" className="font-mono text-xs">
            {event.action}
          </Badge>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <UserRound className="h-3 w-3" /> {event.actor?.username ?? "system"}
          </span>
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          {formatDate(event.created_at)}
          {event.ip_address ? ` · ${event.ip_address}` : ""}
        </div>
        {event.details ? <p className="mt-1 text-xs text-muted-foreground">{event.details}</p> : null}
      </div>
    </li>
  )
}

/** Vertical audit timeline for a workflow. */
export function AuditTimeline({ events, className }: { events: AuditEvent[]; className?: string }) {
  if (events.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Activity className="h-4 w-4" /> No audit events yet.
      </div>
    )
  }
  return <ul className={cn("list-none", className)}>{events.map((event) => <AuditEventRow key={event.id} event={event} />)}</ul>
}