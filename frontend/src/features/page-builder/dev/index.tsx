import { useState } from "react"

import { PageWrapper } from "@/app/layouts/PageWrapper"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { usePage, usePageBuilderRegistry, usePageList } from "../hooks"
import { PageRenderer } from "../renderer"
import { useSectionRenderRecords, clearSectionRenderRecords } from "../renderer/analytics"
import { registeredSections } from "../registry"

/** Development console — pick any page configuration and inspect the renderer. */
export function PageBuilderDevPage() {
  const pages = usePageList()
  const registry = usePageBuilderRegistry()
  const [slug, setSlug] = useState<string>("home")
  const page = usePage(slug)
  const records = useSectionRenderRecords()

  const selectedPage = page.data

  const loaded = records.filter((r) => r.status === "loaded").length
  const fallbacks = records.filter((r) => r.status === "fallback").length
  const errors = records.filter((r) => r.status === "error").length

  return (
    <PageWrapper title="Page Builder Console" description="Select any page configuration and inspect dynamic composition.">
      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-wrap items-center gap-4 p-5">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Page</span>
              <Select value={slug} onValueChange={(value) => setSlug(value)}>
                <SelectTrigger className="w-52">
                  <SelectValue placeholder="Select page" />
                </SelectTrigger>
                <SelectContent>
                  {(pages.data ?? []).map((p) => (
                    <SelectItem key={p.slug} value={p.slug}>
                      {p.title} ({p.slug})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge>Version {selectedPage?.version ?? "—"}</Badge>
              <Badge variant="outline">Sections {selectedPage?.sections_count ?? 0}</Badge>
              <Badge>Loaded {loaded}</Badge>
              <Badge variant="secondary">Fallbacks {fallbacks}</Badge>
              <Badge variant="destructive">Errors {errors}</Badge>
            </div>
            <Button size="sm" variant="outline" className="ml-auto" onClick={() => clearSectionRenderRecords()}>
              Clear analytics
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Inspector */}
          <div className="space-y-6">
            <Card>
              <CardContent className="space-y-2 p-5">
                <h3 className="text-sm font-semibold">Section order</h3>
                {(selectedPage?.sections ?? []).map((section, i) => (
                  <div key={section.id} className="flex items-center gap-2 text-sm">
                    <span className="w-5 text-right font-mono text-xs text-muted-foreground">{i + 1}</span>
                    <Badge variant="outline">{section.type}</Badge>
                  </div>
                ))}
                {!selectedPage?.sections?.length ? (
                  <p className="text-xs text-muted-foreground">No sections in this page.</p>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-2 p-5">
                <h3 className="text-sm font-semibold">Registered sections</h3>
                {registeredSections().map((s) => (
                  <div key={s.type} className="flex items-center gap-2 text-sm">
                    <Badge variant="secondary">{s.type}</Badge>
                    <span className="text-xs text-muted-foreground">{s.name}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-2 p-5">
                <h3 className="text-sm font-semibold">Render analytics</h3>
                {records.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Sections will appear here as they render (lazy loaded).</p>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="text-muted-foreground">
                      <tr>
                        <th className="py-1 pr-2">Type</th>
                        <th className="py-1 pr-2">Status</th>
                        <th className="py-1">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((record) => (
                        <tr key={record.id} className="border-t">
                          <td className="py-1 pr-2 font-mono">{record.type}</td>
                          <td className="py-1 pr-2">
                            <Badge
                              variant={
                                record.status === "loaded" ? "default" : record.status === "fallback" ? "secondary" : "destructive"
                              }
                            >
                              {record.status}
                            </Badge>
                          </td>
                          <td className="py-1 font-mono">{record.durationMs} ms</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          <div className="min-w-0 overflow-hidden rounded-2xl border bg-background/40">
            {page.isLoading ? (
              <div className="p-8 text-sm text-muted-foreground">Loading page configuration…</div>
            ) : page.isError ? (
              <div className="p-8 text-sm text-destructive">
                Failed to load page <code>{slug}</code>. Is the backend running?
              </div>
            ) : selectedPage ? (
              <PageRenderer page={selectedPage} />
            ) : null}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Registry section types: {registry.data?.section_types.length ?? 0} · Pages: {registry.data?.pages.length ?? 0}
        </p>
      </div>
    </PageWrapper>
  )
}
