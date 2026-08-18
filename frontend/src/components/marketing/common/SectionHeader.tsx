import type { ReactNode } from "react"
import { cn } from "@/shared/lib/cn"
import { RevealContainer } from "./RevealContainer"

export interface SectionHeaderProps {
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  align?: "start" | "center"
  className?: string
}

export function SectionHeader({ eyebrow, title, description, align = "center", className }: SectionHeaderProps) {
  return (
    <RevealContainer className={cn("flex flex-col gap-4", align === "center" && "items-center text-center", className)}>
      {eyebrow && (
        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand-700 dark:text-brand-300">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
          {eyebrow}
        </span>
      )}
      <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">{title}</h2>
      {description && <p className="max-w-2xl text-lg text-muted-foreground">{description}</p>}
    </RevealContainer>
  )
}
