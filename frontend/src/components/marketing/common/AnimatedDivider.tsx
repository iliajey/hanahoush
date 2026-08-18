import { cn } from "@/shared/lib/cn"

export function AnimatedDivider({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-3 py-6", className)}>
      <div className="h-px w-12 bg-gradient-to-r from-transparent to-border" />
      <div className="h-2 w-2 rounded-full bg-brand-500/60" />
      <div className="h-2 w-2 rounded-full bg-brand-500/40" />
      <div className="h-2 w-2 rounded-full bg-brand-500/20" />
      <div className="h-px w-12 bg-gradient-to-l from-transparent to-border" />
    </div>
  )
}
