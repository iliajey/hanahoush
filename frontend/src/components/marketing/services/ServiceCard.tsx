import type { ReactNode } from "react"
import { cn } from "@/shared/lib/cn"
import { RevealContainer } from "../common/RevealContainer"
import { Button } from "@/components/ui/button"

export interface ServiceCardProps {
  icon: ReactNode
  title: string
  description: string
  href?: string
  features?: string[]
  className?: string
}

export function ServiceCard({ icon, title, description, href, features, className }: ServiceCardProps) {
  return (
    <RevealContainer className={cn("group relative rounded-2xl border bg-card p-6 transition-all duration-200 hover:border-ring/30 hover:shadow-lg", className)}>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 transition-colors group-hover:bg-brand-500/20 dark:text-brand-400">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="mb-4 text-sm text-muted-foreground">{description}</p>
      {features && features.length > 0 && (
        <ul className="mb-4 space-y-1.5 text-sm text-muted-foreground">
          {features.map((f) => (<li key={f} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-brand-500/60" />{f}</li>))}
        </ul>
      )}
      {href && <Button variant="link" className="h-auto p-0 text-sm font-medium" asChild><a href={href}>Learn more →</a></Button>}
    </RevealContainer>
  )
}

export function ServiceGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid gap-6 sm:grid-cols-2 lg:grid-cols-3", className)}>{children}</div>
}

export function ServiceIcon({ children }: { children: ReactNode }) {
  return <span className="flex-shrink-0">{children}</span>
}
