import { useState } from "react"

import { PageWrapper } from "@/app/layouts/PageWrapper"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { usePage } from "@/features/page-builder"
import { PageRenderer } from "@/features/page-builder"
import { useAnalyticsEvents, clearAnalyticsEvents } from "@/features/analytics"
import { useSectionRenderRecords, clearSectionRenderRecords } from "@/features/page-builder/renderer/analytics"

/** Development console — inspect the /services CMS payload, rendered sections and analytics. */
export function ServicesDevPage() {
  const page = usePage("services")
  const analytics = useAnalyticsEvents()
  const renders = useSectionRenderRecords()
  const [view, setView] = useState<"preview" | "payload">("preview")

  return (
    <PageWrapper title="Services Dev Console" description="CMS payload, rendered sections and analytics.">
      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <Badge>version {page.data?.version ?? "—"}</Badge>
            <Badge variant="outline">sections {page.data?.sections_count ?? 0}</Badge>
            <Badge>{analytics.length} events</Badge>
            <Badge variant="secondary">{renders.length} renders</Badge>
            <Tabs value={view} onValueChange={(v) => setView(v as "preview" | "payload")} className="ml-auto">
              <TabsList>
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="payload">CMS payload</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => clearAnalyticsEvents()}>
                Clear events
              </Button>
              <Button size="sm" variant="outline" onClick={() => clearSectionRenderRecords()}>
                Clear renders
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <div className="space-y-6">
            <Card>
              <CardContent className="space-y-2 p-4">
                <h3 className="text-sm font-semibold">Section order</h3>
                {(page.data?.sections ?? []).map((section, i) => (
                  <div key={section.id} className="flex items-center gap-2 text-sm">
                    <span className="w-5 text-right font-mono text-xs text-muted-foreground">{i + 1}</span>
                    <Badge variant="outline">{section.type}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-2 p-4">
                <h3 className="text-sm font-semibold">Analytics</h3>
                {analytics.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Interact with the page to see events (visibility, CTA clicks, accordion, scroll depth).</p>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="text-muted-foreground">
                      <tr>
                        <th className="py-1 pr-2">Event</th>
                        <th className="py-1">Detail</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.slice(0, 14).map((event) => (
                        <tr key={event.id} className="border-t">
                          <td className="py-1 pr-2 font-mono">{event.name}</td>
                          <td className="py-1 text-muted-foreground">
                            {Object.entries(event.payload)
                              .map(([k, v]) => `${k}=${String(v).slice(0, 24)}`)
                              .join(" · ")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-2 p-4">
                <h3 className="text-sm font-semibold">Section renders</h3>
                {renders.slice(0, 10).map((record) => (
                  <div key={record.id} className="flex items-center justify-between text-xs">
                    <span className="font-mono">{record.type}</span>
                    <span className="text-muted-foreground">
                      {record.status} · {record.durationMs} ms
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="min-w-0">
            {view === "preview" ? (
              <div className="overflow-hidden rounded-2xl border bg-background/40">
                {page.isLoading ? (
                  <div className="p-8 text-sm text-muted-foreground">Loading services page…</div>
                ) : page.isError ? (
                  <div className="p-8 text-sm text-destructive">Failed to load /pages/services/.</div>
                ) : page.data ? (
                  <PageRenderer page={page.data} />
                ) : null}
              </div>
            ) : (
              <pre className="max-h-[70vh] overflow-auto rounded-2xl border bg-muted/30 p-4 text-xs">
                {JSON.stringify(page.data ?? {}, null, 2)}
              </pre>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}