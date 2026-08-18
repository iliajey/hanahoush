import type { ReactNode } from "react"
import { cn } from "@/shared/lib/cn"

export function SpotlightContainer({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("group relative overflow-hidden rounded-2xl border bg-card/50", className)}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(600px circle at var(--spot-x,50%) var(--spot-y,50%), hsl(var(--ring)/0.08), transparent 70%)",
        } as React.CSSProperties}
      />
      {children}
    </div>
  )
}
