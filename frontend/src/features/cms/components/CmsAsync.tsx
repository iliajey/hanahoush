import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"

import { EmptyState } from "@/components/ui/empty-state"
import { ErrorState } from "@/components/ui/error-state"
import { Skeleton } from "@/components/ui/skeleton"

export interface CmsAsyncProps {
  isLoading: boolean
  isError: boolean
  error?: unknown
  isEmpty?: boolean
  onRetry?: () => void
  skeleton?: ReactNode
  empty?: ReactNode
  fallback?: ReactNode
  showError?: boolean
  children: ReactNode
}

/**
 * Unified CMS async-state boundary. Every CMS section routes through this so
 * loading (skeleton) / error / empty / success states stay consistent across
 * the site. User-facing error copy is generic and localized — raw exception
 * details are never rendered.
 */
export function CmsAsync({
  isLoading,
  isError,
  error: _error,
  isEmpty,
  onRetry,
  skeleton,
  empty,
  fallback,
  showError = true,
  children,
}: CmsAsyncProps) {
  const { t } = useTranslation()
  if (isLoading) {
    return skeleton ?? <CmsSectionSkeleton />
  }
  if (isError && showError) {
    return (
      <ErrorState
        title={t("errors.sectionTitle")}
        description={t("errors.sectionDescription")}
        onRetry={onRetry}
      />
    )
  }
  if (isError) {
    return fallback ?? null
  }
  if (isEmpty) {
    return empty ?? <CmsEmpty />
  }
  return <>{children}</>
}

/** Default section skeleton (rows of shimmering blocks). */
export function CmsSectionSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-3 rounded-2xl border bg-card p-6">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  )
}

/** Default empty state for a section with no content yet. */
export function CmsEmpty() {
  const { t } = useTranslation()
  return (
    <EmptyState
      title={t("errors.emptySectionTitle")}
      description={t("errors.emptySectionDescription")}
    />
  )
}
