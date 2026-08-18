import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"

import { PageWrapper } from "@/app/layouts/PageWrapper"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { useAnalyticsEvents, clearAnalyticsEvents } from "@/features/analytics"
import { useSectionRenderRecords, clearSectionRenderRecords } from "@/features/page-builder/renderer/analytics"
import { useArticleBySlug, useArticlesFiltered, useArticleCategories, useArticleTags } from "../hooks"
import type { ArticleFilters } from "../types"

/** Development console — inspect article payload, filters, cache, SEO and analytics. */
export function ArticlesDevPage() {
  const queryClient = useQueryClient()
  const [slug, setSlug] = useState("demo-digital-transformation")
  const [filters, setFilters] = useState<ArticleFilters>({ pageSize: 12 })
  const detail = useArticleBySlug(slug)
  const list = useArticlesFiltered(filters)
  const categories = useArticleCategories()
  const tags = useArticleTags()
  const analytics = useAnalyticsEvents()
  const renders = useSectionRenderRecords()
  const [view, setView] = useState<"payload" | "state" | "cache">("payload")

  const cacheEntries = queryClient
    .getQueryCache()
    .findAll()
    .filter((query) => (query.queryKey[0] as string) === "articles")
    .map((query) => ({ key: JSON.stringify(query.queryKey), status: query.state.status, age: query.state.dataUpdatedAt ? Math.round((Date.now() - query.state.dataUpdatedAt) / 1000) : null }))
    .sort((a, b) => a.key.localeCompare(b.key))

  return (
    <PageWrapper title="Articles Dev Console" description="CMS payload, filters, cache, SEO and analytics.">
      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <input aria-label="Article slug" className="h-9 w-64 rounded-md border bg-background px-2 text-sm" value={slug} onChange={(e) => setSlug(e.target.value)} />
            <Badge>list {list.data?.count ?? 0}</Badge>
            <Badge variant="outline">categories {categories.data?.length ?? 0}</Badge>
            <Badge variant="outline">tags {tags.data?.length ?? 0}</Badge>
            <Badge>reading_time {detail.data?.reading_time ?? "—"}</Badge>
            <Badge>{analytics.length} events</Badge>
            <Tabs value={view} onValueChange={(v) => setView(v as "payload" | "state" | "cache")} className="ml-auto">
              <TabsList>
                <TabsTrigger value="payload">Payload</TabsTrigger>
                <TabsTrigger value="state">State</TabsTrigger>
                <TabsTrigger value="cache">Cache</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button size="sm" variant="outline" onClick={() => clearAnalyticsEvents()}>Clear events</Button>
            <Button size="sm" variant="outline" onClick={() => clearSectionRenderRecords()}>Clear renders</Button>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <div className="space-y-4">
            <Card>
              <CardContent className="space-y-2 p-4">
                <h3 className="text-sm font-semibold">Active filters</h3>
                <pre className="text-xs text-muted-foreground">{JSON.stringify(filters, null, 2)}</pre>
                <Button size="sm" variant="outline" onClick={() => setFilters({ pageSize: 12 })}>Reset</Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-2 p-4">
                <h3 className="text-sm font-semibold">SEO (article)</h3>
                <p className="text-xs text-muted-foreground">title: {detail.data?.title_en}</p>
                <p className="text-xs text-muted-foreground">reading: {detail.data?.reading_time ?? "—"} min</p>
                <p className="text-xs text-muted-foreground">related: {detail.data?.related_articles.length ?? 0} articles · {detail.data?.related_projects.length ?? 0} projects · {detail.data?.related_services.length ?? 0} services</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-2 p-4">
                <h3 className="text-sm font-semibold">Analytics</h3>
                {analytics.slice(0, 10).map((event) => (
                  <div key={event.id} className="flex justify-between text-xs">
                    <span className="font-mono">{event.name}</span>
                    <span className="text-muted-foreground">{Object.entries(event.payload).map(([k, v]) => `${k}=${String(v).slice(0, 20)}`).join(" · ")}</span>
                  </div>
                ))}
                {analytics.length === 0 ? <p className="text-xs text-muted-foreground">Interact to see events.</p> : null}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-4">
              {view === "payload" ? (
                <pre className="max-h-[70vh] overflow-auto rounded-xl bg-muted/30 p-4 text-xs">{JSON.stringify(detail.data ?? null, null, 2)}</pre>
              ) : view === "state" ? (
                <div className="space-y-2 text-sm">
                  <p>Detail: <code>{detail.status}</code> · error: {detail.error ? String(detail.error) : "none"}</p>
                  <p>List: <code>{list.status}</code> · count: {list.data?.count ?? 0}</p>
                  <p>Empty: {list.data && list.data.items.length === 0 ? "true" : "false"}</p>
                  <p>Renders: {renders.length}</p>
                </div>
              ) : (
                <div className="space-y-2 text-xs text-muted-foreground">
                  {cacheEntries.length === 0 ? <p>No article queries cached yet.</p> : cacheEntries.map((entry) => (
                    <div key={entry.key} className="flex justify-between gap-3">
                      <code className="truncate">{entry.key}</code>
                      <span>{entry.status} {entry.age != null ? `· ${entry.age}s` : ""}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageWrapper>
  )
}