import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"

import { PageWrapper } from "@/app/layouts/PageWrapper"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { useAnalyticsEvents, clearAnalyticsEvents } from "@/features/analytics"
import { useSectionRenderRecords, clearSectionRenderRecords } from "@/features/page-builder/renderer/analytics"
import { useProjectBySlug, useProjectsFiltered, useProjectTechnologies } from "../hooks"
import type { ProjectFilters } from "../types"

/** Development console — inspect project payload, filters, cache and analytics. */
export function ProjectsDevPage() {
  const queryClient = useQueryClient()
  const [slug, setSlug] = useState("demo-erp-system")
  const [filters, setFilters] = useState<ProjectFilters>({ pageSize: 12 })
  const detail = useProjectBySlug(slug)
  const filtered = useProjectsFiltered(filters)
  const technologies = useProjectTechnologies()
  const analytics = useAnalyticsEvents()
  const renders = useSectionRenderRecords()
  const [view, setView] = useState<"payload" | "state" | "cache">("payload")

  const cacheEntries = queryClient
    .getQueryCache()
    .findAll()
    .filter((query) => (query.queryKey[0] as string) === "projects")
    .map((query) => ({ key: JSON.stringify(query.queryKey), status: query.state.status, age: query.state.dataUpdatedAt ? Math.round((Date.now() - query.state.dataUpdatedAt) / 1000) : null }))
    .sort((a, b) => a.key.localeCompare(b.key))

  return (
    <PageWrapper title="Projects Dev Console" description="Project payload, filters, cache and analytics.">
      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <input
              aria-label="Project slug"
              className="h-9 w-56 rounded-md border bg-background px-2 text-sm"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
            <Badge>filtered {filtered.data?.count ?? 0}</Badge>
            <Badge variant="outline">technologies {technologies.data?.length ?? 0}</Badge>
            <Badge>{analytics.length} events</Badge>
            <Tabs value={view} onValueChange={(v) => setView(v as "payload" | "state" | "cache")} className="ml-auto">
              <TabsList>
                <TabsTrigger value="payload">Payload</TabsTrigger>
                <TabsTrigger value="state">State</TabsTrigger>
                <TabsTrigger value="cache">Cache</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button size="sm" variant="outline" onClick={() => clearAnalyticsEvents()}>
              Clear events
            </Button>
            <Button size="sm" variant="outline" onClick={() => clearSectionRenderRecords()}>
              Clear renders
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <div className="space-y-4">
            <Card>
              <CardContent className="space-y-2 p-4">
                <h3 className="text-sm font-semibold">Active filters</h3>
                <pre className="text-xs text-muted-foreground">{JSON.stringify(filters, null, 2)}</pre>
                <Button size="sm" variant="outline" onClick={() => setFilters({ pageSize: 12 })}>
                  Reset
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-2 p-4">
                <h3 className="text-sm font-semibold">Render analytics</h3>
                {renders.slice(0, 10).map((record) => (
                  <div key={record.id} className="flex items-center justify-between text-xs">
                    <span className="font-mono">{record.type}</span>
                    <span className="text-muted-foreground">{record.status} · {record.durationMs} ms</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-4">
              {view === "payload" ? (
                <pre className="max-h-[70vh] overflow-auto rounded-xl bg-muted/30 p-4 text-xs">
                  {JSON.stringify(detail.data ?? null, null, 2)}
                </pre>
              ) : view === "state" ? (
                <div className="space-y-2 text-sm">
                  <p>Project detail: <B state={detail.status} /></p>
                  <p>Filtered list: <B state={filtered.status} /></p>
                  <p>Technologies: <B state={technologies.status} /></p>
                  <p>Error: {detail.error ? String(detail.error) : "none"}</p>
                  <p>Empty: {filtered.data && filtered.data.items.length === 0 ? "true" : "false"}</p>
                </div>
              ) : (
                <div className="space-y-2 text-xs text-muted-foreground">
                  {cacheEntries.length === 0 ? (
                    <p>No project queries cached yet.</p>
                  ) : (
                    cacheEntries.map((entry) => (
                      <div key={entry.key} className="flex justify-between gap-3">
                        <code className="truncate">{entry.key}</code>
                        <span>
                          {entry.status} {entry.age != null ? `· ${entry.age}s` : ""}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageWrapper>
  )
}

function B({ state }: { state: string }) {
  return <span className="font-mono">{state}</span>
}
