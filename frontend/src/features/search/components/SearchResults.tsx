import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { FileText, FolderKanban, LayoutTemplate, Search as SearchIcon, Wrench } from "lucide-react"
import type { ComponentType } from "react"

import { EmptyState } from "@/components/ui/empty-state"
import { ErrorState } from "@/components/ui/error-state"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/shared/lib/cn"

import { searchAnalytics } from "../services/analytics"
import type { SearchResult, SearchResultType } from "../types"

const TYPE_ICONS: Record<SearchResultType, ComponentType<{ className?: string }>> = {
  article: FileText,
  project: FolderKanban,
  service: Wrench,
  page: LayoutTemplate,
}

export function groupResults(results: SearchResult[]): { type: SearchResultType; items: SearchResult[] }[] {
  const order: SearchResultType[] = ["article", "project", "service", "page"]
  return order
    .map((type) => ({
      type,
      items: results.filter((r) => r.type === type),
    }))
    .filter((group) => group.items.length > 0)
}

export interface SearchResultsProps {
  results: SearchResult[]
  total: number
  query: string
  isLoading: boolean
  isError: boolean
  hasSearched: boolean
  onRetry?: () => void
  /** Highlighted result id (command palette keyboard navigation). */
  activeId?: string | null
  onActiveChange?: (id: string) => void
}

export function SearchResults({
  results,
  total,
  query,
  isLoading,
  isError,
  hasSearched,
  onRetry,
  activeId,
  onActiveChange,
}: SearchResultsProps) {
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true" aria-label={t("common.loading")}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <ErrorState
        title={t("search.errorTitle")}
        description={t("errors.unexpected")}
        onRetry={onRetry}
      />
    )
  }

  if (!hasSearched) return null

  if (results.length === 0) {
    return (
      <EmptyState
        icon={<SearchIcon className="h-6 w-6" />}
        title={t("search.emptyTitle")}
        description={t("search.emptyDescription", { query })}
      />
    )
  }

  return (
    <div className="flex flex-col gap-8" data-testid="search-results">
      <p className="text-sm text-muted-foreground" role="status">
        {t("search.resultCount", { count: total })}
      </p>
      {groupResults(results).map((group) => (
        <section key={group.type} aria-label={t(`search.types.${group.type}`)}>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <TypeIcon type={group.type} className="h-4 w-4" />
            {t(`search.types.${group.type}`)}
            <span className="text-xs font-normal text-muted-foreground/70">({group.items.length})</span>
          </h2>
          <ul className="flex flex-col gap-2" role="listbox">
            {group.items.map((result) => (
              <li key={`${result.type}-${result.id}`} role="option" aria-selected={activeId === `${result.type}-${result.id}`}>
                <Link
                  to={result.url}
                  role="link"
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md border border-transparent p-3 text-start transition-colors hover:border-border hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    activeId === `${result.type}-${result.id}` && "border-border bg-accent",
                  )}
                  onMouseEnter={() => onActiveChange?.(`${result.type}-${result.id}`)}
                  onClick={() => searchAnalytics.resultClick(result.type, result.url)}
                >
                  {result.image ? (
                    <img
                      src={result.image}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="h-12 w-16 shrink-0 rounded-md object-cover"
                    />
                  ) : (
                    <span className="flex h-12 w-16 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <TypeIcon type={result.type} className="h-5 w-5" />
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate font-medium" data-testid="search-result-title">
                      {result.title}
                    </span>
                    {result.excerpt ? (
                      <span className="block truncate text-sm text-muted-foreground">{result.excerpt}</span>
                    ) : null}
                    {result.category_title ? (
                      <span className="mt-0.5 block text-xs text-muted-foreground/80">
                        {result.category_title}
                      </span>
                    ) : null}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

function TypeIcon({ type, className }: { type: SearchResultType; className?: string }) {
  const Icon = TYPE_ICONS[type]
  return <Icon className={className} aria-hidden />
}