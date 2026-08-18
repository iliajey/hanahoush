import { Boxes, Database, Globe, Server } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/shared/lib/cn"

export type ArchitectureLabel = string | { en?: string; fa?: string; ar?: string }
export type ArchitectureLabels = ArchitectureLabel[] | Record<string, string[]>

export interface ArchitectureNode {
  layer: string
  labels?: ArchitectureLabels
}

export interface ArchitectureGraph {
  description?: string
  nodes?: ArchitectureNode[]
}

const LAYER_ICONS: Record<string, LucideIcon> = {
  frontend: Globe,
  backend: Server,
  database: Database,
  services: Boxes,
  infrastructure: Boxes,
  integrations: Boxes,
}

function pickLabel(label: ArchitectureLabel, locale: string): string {
  if (typeof label === "string") return label
  return (locale === "fa" && label.fa) || (locale === "ar" && label.ar) || label.en || label.fa || label.ar || ""
}

/** Resolve a node's labels into the current language (lenient about shapes). */
function resolveLabels(labels: ArchitectureLabels | undefined, locale: string): string[] {
  if (!labels) return []
  if (Array.isArray(labels)) return labels.map((label) => pickLabel(label, locale)).filter(Boolean)
  const list = labels[locale] || labels.en || []
  return Array.isArray(list) ? list.filter(Boolean) : []
}

/**
 * Architecturally honest visualization: renders only nodes supplied by the
 * CMS/project data. Falls back to a clear message when none exist.
 */
export function ArchitectureViewer({
  architecture,
  locale = "en",
}: {
  architecture?: ArchitectureGraph | null
  locale?: string
}) {
  const nodes = architecture?.nodes

  if (!nodes || nodes.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        Architecture information is not available for this project yet.
      </div>
    )
  }

  return (
    <div>
      {architecture?.description ? (
        <p className="mb-6 max-w-2xl text-muted-foreground">{architecture.description}</p>
      ) : null}
      <div className="flex flex-col gap-4">
        {nodes.map((node, i) => {
          const Icon = LAYER_ICONS[node.layer.toLowerCase()] ?? Boxes
          const labels = resolveLabels(node.labels, locale)
          return (
            <div key={`${node.layer}-${i}`} className="flex items-stretch gap-3">
              <div className="flex w-32 shrink-0 flex-col items-center justify-center gap-1 rounded-l-2xl border border-r-0 bg-muted/40 px-2 py-3 text-center">
                <Icon className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                <span className="text-xs font-semibold">{node.layer}</span>
              </div>
              <div className={cn("flex flex-1 flex-wrap items-center gap-2 rounded-r-2xl border px-3 py-3")}>
                {labels.length ? (
                  labels.map((label) => (
                    <span key={label} className="rounded-lg bg-muted px-3 py-1.5 text-sm font-medium">
                      {label}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}