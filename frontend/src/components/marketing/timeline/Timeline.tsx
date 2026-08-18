import type { ReactNode } from "react"
import { cn } from "@/shared/lib/cn"
import { RevealContainer } from "../common/RevealContainer"

export interface MilestoneProps { date: string; title: string; description?: string; icon?: ReactNode; className?: string }

export function Milestone({ date, title, description, icon, className }: MilestoneProps) {
  return (
    <RevealContainer className={cn("relative flex gap-6 pl-10 before:absolute before:left-5 before:top-2 before:h-full before:w-px before:bg-border", className)}>
      <div className="absolute left-0 top-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-card text-sm font-bold text-brand-600 shadow-sm">{icon || date}</div>
      <div className="pb-8">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{date}</span>
        <h4 className="mt-1 font-semibold">{title}</h4>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
    </RevealContainer>
  )
}

export function VerticalTimeline({ items, className }: { items: MilestoneProps[]; className?: string }) {
  return <div className={cn("space-y-2", className)}>{items.map((item, i) => (<Milestone key={i} {...item} />))}</div>
}

export function HorizontalTimeline({ items, className }: { items: MilestoneProps[]; className?: string }) {
  return (
    <div className={cn("flex gap-8 overflow-x-auto pb-4", className)}>
      {items.map((item, i) => (
        <div key={i} className="flex min-w-[200px] flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-brand-500/30 bg-card text-sm font-bold text-brand-600">{item.icon || item.date}</div>
          <div><span className="text-xs text-muted-foreground">{item.date}</span><h4 className="text-sm font-semibold">{item.title}</h4></div>
        </div>
      ))}
    </div>
  )
}
