import { forwardRef } from "react"
import type { HTMLAttributes } from "react"

import { cn } from "@/shared/lib/cn"

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  /** Vertical rhythm of the section. */
  padding?: "none" | "sm" | "md" | "lg" | "xl"
  /** Visually separate the section (top border). */
  separated?: boolean
}

const paddingMap = {
  none: "py-0",
  sm: "py-8",
  md: "py-12",
  lg: "py-16",
  xl: "py-24",
} as const

/** A page section with consistent vertical spacing. */
const Section = forwardRef<HTMLElement, SectionProps>(
  ({ className, padding = "lg", separated = false, ...props }, ref) => (
    <section
      ref={ref}
      className={cn(paddingMap[padding], separated && "border-t", className)}
      {...props}
    />
  ),
)
Section.displayName = "Section"

export { Section }
