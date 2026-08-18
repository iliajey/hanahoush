import { cn } from "@/shared/lib/cn"

export function GlowBorder({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("relative rounded-2xl", className)}>
      <div
        aria-hidden="true"
        className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-brand-500/40 via-brand-500/20 to-brand-500/40 opacity-0 blur-sm transition-opacity duration-300 group-hover:opacity-100"
      />
      <div className="relative rounded-2xl border bg-card">{children}</div>
    </div>
  )
}
