import { Suspense, useMemo, useRef } from "react"
import type { ReactNode } from "react"

import { AlertTriangle } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/shared/lib/cn"
import { useSectionVisibility } from "@/features/analytics"

import { getSectionComponent } from "../registry"
import type { Page, PageSection } from "../types"
import { recordSectionRender } from "./analytics"
import { SectionBoundary } from "./SectionBoundary"
import { visualStateForSectionType } from "@/design/visual-states"

export interface PageRendererProps {
  page: Page
  className?: string
}

/** Lazy-loading fallback shown while a section chunk is fetched. */
export function SectionSkeleton() {
  return (
    <div className="py-16" aria-busy="true">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-2xl border bg-card p-6">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  )
}

/** Unknown section fallback — never crashes the page. */
export function UnknownSectionFallback({ type }: { type: string }) {
  return (
    <div role="note" className="flex items-center gap-3 rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
      <AlertTriangle className="h-5 w-5 shrink-0" />
      <span>
        Unknown section type <code className="rounded bg-muted px-1.5 py-0.5">{type}</code> — configured but not
        registered in the section registry.
      </span>
    </div>
  )
}

/** Reports render timing for analytics after the lazy chunk resolves. */
function SectionReporter({
  id,
  type,
  startedAt,
  onLoaded,
  children,
}: {
  id: number
  type: string
  startedAt: number
  onLoaded: () => void
  children: ReactNode
}) {
  const reported = useRef(false)
  if (!reported.current) {
    reported.current = true
    onLoaded()
  }
  void id
  void type
  void startedAt
  return <>{children}</>
}

function SectionSlot({ section }: { section: PageSection }) {
  const startedAtRef = useRef<number | null>(null)
  if (startedAtRef.current === null) {
    startedAtRef.current = typeof performance !== "undefined" ? performance.now() : Date.now()
  }

  const visibilityRef = useSectionVisibility<HTMLDivElement>(section.type)

  const record = (status: "loaded" | "error" | "fallback") => {
    recordSectionRender({
      type: section.type,
      startedAt: startedAtRef.current as number,
      durationMs: Math.round((typeof performance !== "undefined" ? performance.now() : Date.now()) - (startedAtRef.current as number)),
      status,
    })
  }

  const Component = getSectionComponent(section.type)

  if (!Component) {
    record("fallback")
    return (
      <div className="px-4 py-8">
        <UnknownSectionFallback type={section.type} />
      </div>
    )
  }

  return (
    <div
      data-section-type={section.type}
      data-section-order={section.order}
      data-visual-state={visualStateForSectionType(section.type)}
      ref={visibilityRef}
    >
      <SectionBoundary onError={() => record("error")}>
        <Suspense fallback={<SectionSkeleton />}>
          <SectionReporter
            id={section.id}
            type={section.type}
            startedAt={startedAtRef.current as number}
            onLoaded={() => record("loaded")}
          >
            <Component config={section.config} />
          </SectionReporter>
        </Suspense>
      </SectionBoundary>
    </div>
  )
}

/**
 * Assembles a page from its backend configuration.
 *
 * - Skips disabled sections.
 * - Deduplicates section types (defensive; the DB also enforces uniqueness).
 * - Lazy-loads every section (code-split per chunk).
 * - Isolates each section with its own error boundary.
 * - Falls back gracefully for unknown/unregistered section types.
 * - Records render analytics (timing + status).
 */
export function PageRenderer({ page, className }: PageRendererProps) {
  const sections = useMemo(() => {
    const seen = new Set<string>()
    const result: PageSection[] = []
    for (const section of page.sections ?? []) {
      if (!section.is_enabled) continue
      if (seen.has(section.type)) continue
      seen.add(section.type)
      result.push(section)
    }
    return result
  }, [page])

  if (sections.length === 0) {
    return (
      <div className={cn("py-16 text-center text-sm text-muted-foreground", className)}>
        This page has no enabled sections yet.
      </div>
    )
  }

  return (
    <div className={cn(className)}>
      {sections.map((section) => (
        <SectionSlot key={`${section.type}-${section.id}`} section={section} />
      ))}
    </div>
  )
}
