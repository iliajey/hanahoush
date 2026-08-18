import type { ReactNode } from "react"
import { cn } from "@/shared/lib/cn"
import { RevealContainer } from "../common/RevealContainer"

export interface ERPFeatureCardProps { icon: ReactNode; title: string; description: string; className?: string }

export function ERPFeatureCard({ icon, title, description, className }: ERPFeatureCardProps) {
  return (
    <RevealContainer className={cn("flex gap-4 rounded-2xl border bg-card p-6 transition-all hover:border-ring/30 hover:shadow-md", className)}>
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">{icon}</div>
      <div>
        <h4 className="mb-1 font-semibold">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </RevealContainer>
  )
}

export function ERPModules({ modules, className }: { modules: { name: string; status: "live" | "soon" }[]; className?: string }) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {modules.map((m) => (
        <div key={m.name} className="flex items-center gap-2 rounded-xl border bg-card px-4 py-3 text-sm font-medium shadow-sm">
          <span className={cn("h-2 w-2 rounded-full", m.status === "live" ? "bg-emerald-500" : "bg-amber-500")} />{m.name}
        </div>
      ))}
    </div>
  )
}

export function ERPTimeline({ items, className }: { items: { year: string; title: string; description: string }[]; className?: string }) {
  return (
    <div className={cn("relative space-y-8 before:absolute before:left-4 before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-border", className)}>
      {items.map((item, i) => (
        <RevealContainer key={i} className="flex gap-6 pl-10">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-brand-500/30 bg-card text-xs font-bold text-brand-600">{item.year}</div>
          <div><h4 className="font-semibold">{item.title}</h4><p className="text-sm text-muted-foreground">{item.description}</p></div>
        </RevealContainer>
      ))}
    </div>
  )
}

export function ERPArchitecturePlaceholder({ className }: { className?: string }) {
  return <div className={cn("flex h-64 items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-muted/30 text-sm text-muted-foreground", className)}>ERP Architecture Diagram</div>
}
