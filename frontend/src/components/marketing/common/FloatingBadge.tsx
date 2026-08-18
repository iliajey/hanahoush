import { cn } from "@/shared/lib/cn"

export function FloatingBadge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex animate-float items-center gap-1.5 rounded-full border bg-card/80 px-3 py-1 text-xs font-medium shadow-sm backdrop-blur",
        className,
      )}
    >
      {children}
    </span>
  )
}
