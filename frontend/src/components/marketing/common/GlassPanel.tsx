import type { HTMLAttributes, ReactNode } from "react"
import { cn } from "@/shared/lib/cn"

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  level?: "subtle" | "standard" | "strong"
}

export function GlassPanel({ children, level = "standard", className, ...props }: GlassPanelProps) {
  return (
    <div
      className={cn(
        level === "subtle" && "glass-subtle",
        level === "standard" && "glass",
        level === "strong" && "glass-strong",
        "rounded-2xl",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
