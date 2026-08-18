import type { HTMLAttributes } from "react"

import { cn } from "@/shared/lib/cn"

export interface GridProps extends HTMLAttributes<HTMLDivElement> {
  /** Number of columns at each breakpoint: base / sm / md / lg */
  cols?: {
    base?: 1 | 2 | 3 | 4
    sm?: 1 | 2 | 3 | 4
    md?: 2 | 3 | 4
    lg?: 3 | 4
  }
  gap?: "sm" | "md" | "lg"
}

const gapMap = { sm: "gap-3", md: "gap-6", lg: "gap-8" } as const

const baseCols: Record<number, string> = { 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" }
const smCols: Record<number, string> = { 1: "sm:grid-cols-1", 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-4" }
const mdCols: Record<number, string> = { 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-4" }
const lgCols: Record<number, string> = { 3: "lg:grid-cols-3", 4: "lg:grid-cols-4" }

export function Grid({ cols, gap = "md", className, ...props }: GridProps) {
  const classes = [
    cols?.base ? baseCols[cols.base] : "grid-cols-1",
    cols?.sm ? smCols[cols.sm] : "",
    cols?.md ? mdCols[cols.md] : "",
    cols?.lg ? lgCols[cols.lg] : "",
  ].filter(Boolean)

  return <div className={cn("grid", classes, gapMap[gap], className)} {...props} />
}
