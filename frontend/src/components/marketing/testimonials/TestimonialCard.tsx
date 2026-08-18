import type { ReactNode } from "react"
import { cn } from "@/shared/lib/cn"
import { RevealContainer } from "../common/RevealContainer"
import { ResponsiveImage } from "@/features/cms/components/ResponsiveImage"

export interface TestimonialCardProps { quote: string; name: string; role: string; company: string; avatar?: string; rating?: number; logo?: string; className?: string }

export function TestimonialCard({ quote, name, role, company, avatar, rating = 5, logo, className }: TestimonialCardProps) {
  return (
    <RevealContainer className={cn("flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm", className)}>
      <div className="flex gap-0.5">{Array.from({ length: rating }).map((_, i) => (<span key={i} className="text-amber-500 text-sm">★</span>))}</div>
      <blockquote className="text-sm italic text-muted-foreground">"{quote}"</blockquote>
      <div className="mt-auto flex items-center gap-3 pt-2">
        {avatar && <div className="h-10 w-10 overflow-hidden rounded-full bg-muted"><ResponsiveImage src={avatar} alt={name} className="h-full w-full" /></div>}
        <div>
          <div className="text-sm font-semibold">{name}</div>
          <div className="text-xs text-muted-foreground">{role}, {company}</div>
        </div>
        {logo && <img src={logo} alt={company} className="ml-auto h-6 opacity-50" />}
      </div>
    </RevealContainer>
  )
}

export function TestimonialGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid gap-6 sm:grid-cols-2 lg:grid-cols-3", className)}>{children}</div>
}
