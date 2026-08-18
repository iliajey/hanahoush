import { Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { cn } from "@/shared/lib/cn"

export interface SpinnerProps {
  size?: "sm" | "md" | "lg"
  label?: string
  className?: string
}

const sizeMap = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-10 w-10" } as const

export function Spinner({ size = "md", label, className }: SpinnerProps) {
  const { t } = useTranslation()
  return (
    <span role="status" aria-live="polite" className={cn("inline-flex items-center gap-2", className)}>
      <Loader2 className={cn("animate-spin text-primary", sizeMap[size])} />
      {label ? <span className="text-sm text-muted-foreground">{label}</span> : null}
      <span className="sr-only">{label ?? t("common.loading")}</span>
    </span>
  )
}
