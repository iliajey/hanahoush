import type { ReactNode } from "react"

import { cn } from "@/shared/lib/cn"

export interface SectionTitleProps {
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  align?: "start" | "center"
  className?: string
}

export function SectionTitle({ eyebrow, title, description, align = "start", className }: SectionTitleProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      {eyebrow ? (
        <span className="inline-flex w-fit items-center rounded-full bg-brand-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-700 dark:text-brand-300">
          {eyebrow}
        </span>
      ) : null}
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
      {description ? <p className="max-w-2xl text-base text-muted-foreground">{description}</p> : null}
    </div>
  )
}
