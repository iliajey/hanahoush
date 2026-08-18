import type { ReactNode } from "react"
import { cn } from "@/shared/lib/cn"
import { GlassPanel } from "../common/GlassPanel"

export function StatCard({ label, value, suffix, icon, trend }: {
  label: string; value: string; suffix?: string; icon?: ReactNode; trend?: { value: string; positive: boolean }
}) {
  return (
    <GlassPanel level="subtle" className="flex flex-col gap-2 p-6 text-center">
      {icon && <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">{icon}</div>}
      <div className="text-3xl font-bold tracking-tight tabular-nums">{value}{suffix}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
      {trend && (
        <span className={cn("text-xs font-medium", trend.positive ? "text-emerald-600" : "text-destructive")}>
          {trend.positive ? "↑" : "↓"} {trend.value}
        </span>
      )}
    </GlassPanel>
  )
}

export function StatGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4", className)}>{children}</div>
}
