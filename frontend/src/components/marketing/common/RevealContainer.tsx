import type { ReactNode } from "react"
import { cn } from "@/shared/lib/cn"

export interface RevealContainerProps {
  children: ReactNode
  className?: string
  delay?: number
  direction?: "up" | "none"
}

export function RevealContainer({ children, className, delay = 0, direction = "up" }: RevealContainerProps) {
  return (
    <div
      className={cn("reveal", className)}
      style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
      data-reveal-direction={direction}
    >
      {children}
    </div>
  )
}
