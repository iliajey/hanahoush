import type { ReactNode } from "react"
import { AlertCircle, RefreshCw } from "lucide-react"
import { useTranslation } from "react-i18next"

import { cn } from "@/shared/lib/cn"

import { Button } from "./button"

export interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
  retryLabel?: string
  className?: string
  children?: ReactNode
}

export function ErrorState({
  title,
  description,
  onRetry,
  retryLabel,
  className,
  children,
}: ErrorStateProps) {
  const { t } = useTranslation()
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-10 text-center",
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="h-6 w-6" />
      </div>
      <div>
        <h3 className="text-base font-semibold">{title ?? t("errors.unexpected")}</h3>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children}
      {onRetry ? (
        <Button variant="outline" onClick={onRetry}>
          <RefreshCw className="me-2" />
          {retryLabel ?? t("errors.retry")}
        </Button>
      ) : null}
    </div>
  )
}
