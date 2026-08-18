import { cn } from "@/shared/lib/cn"

import { Spinner } from "./spinner"

export interface LoadingProps {
  label?: string
  fullScreen?: boolean
  className?: string
}

/** Centered loading state (optionally full-viewport). */
export function Loading({ label, fullScreen = false, className }: LoadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3",
        fullScreen ? "min-h-screen" : "min-h-[200px]",
        className,
      )}
    >
      <Spinner size="lg" label={label} />
    </div>
  )
}
