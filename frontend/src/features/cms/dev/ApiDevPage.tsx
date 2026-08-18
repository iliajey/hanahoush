import { useCallback, useEffect, useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"

import { PageWrapper } from "@/app/layouts/PageWrapper"
import { useLanguage } from "@/app/language/useLanguage"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import { cmsGet } from "../api/client"
import { getCmsTimings, clearCmsTimings } from "./timingStore"
import { API_ENDPOINTS, resolveEndpoint, type ApiEndpointEntry } from "./apiRegistry"

interface CacheEntrySnapshot {
  key: string
  status: "pending" | "success" | "error"
  fetchStatus: "idle" | "fetching" | "paused"
  dataUpdatedAt: number | null
  errorUpdatedAt: number | null
  staleTime: number
}

function snapshotCache(queryClient: ReturnType<typeof useQueryClient>): CacheEntrySnapshot[] {
  return queryClient
    .getQueryCache()
    .findAll()
    .filter((query) => (query.queryKey[0] as string) === "cms")
    .map((query) => ({
      key: JSON.stringify(query.queryKey),
      status: query.state.status,
      fetchStatus: query.state.fetchStatus,
      dataUpdatedAt: query.state.dataUpdatedAt || null,
      errorUpdatedAt: query.state.errorUpdatedAt || null,
      staleTime: (query.options as { staleTime?: number }).staleTime ?? 0,
    }))
    .sort((a, b) => a.key.localeCompare(b.key))
}

function useTick(intervalMs: number): number {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return tick
}

interface TestResult {
  ok: boolean
  durationMs: number
  status: number | null
  summary?: string
}

/** Dev page — inspect every CMS endpoint, request timing, cache + query status. */
export function ApiDevPage() {
  const queryClient = useQueryClient()
  const { language } = useLanguage()
  const tick = useTick(1000)

  const cacheEntries = useMemo(() => snapshotCache(queryClient), [queryClient, tick])
  const timings = useMemo(() => getCmsTimings(), [tick])

  const [results, setResults] = useState<Record<string, TestResult>>({})
  const [running, setRunning] = useState<Record<string, boolean>>({})

  const runTest = useCallback(
    async (endpoint: ApiEndpointEntry) => {
      setRunning((r) => ({ ...r, [endpoint.path]: true }))
      const startedAt = performance.now()
      try {
        await cmsGet(resolveEndpoint(endpoint.path), { locale: language, params: { page_size: 3 } })
        setResults((r) => ({
          ...r,
          [endpoint.path]: {
            ok: true,
            durationMs: Math.round(performance.now() - startedAt),
            status: 200,
            summary: "OK",
          },
        }))
      } catch (error) {
        const status = (error as { response?: { status?: number } }).response?.status ?? null
        setResults((r) => ({
          ...r,
          [endpoint.path]: { ok: false, durationMs: Math.round(performance.now() - startedAt), status, summary: "Error" },
        }))
      } finally {
        setRunning((r) => ({ ...r, [endpoint.path]: false }))
      }
    },
    [language],
  )

  const runAll = useCallback(() => {
    API_ENDPOINTS.filter((e) => e.method === "GET").forEach((endpoint) => void runTest(endpoint))
  }, [runTest])

  const counts = {
    total: cacheEntries.length,
    success: cacheEntries.filter((e) => e.status === "success").length,
    fetching: cacheEntries.filter((e) => e.fetchStatus === "fetching").length,
    error: cacheEntries.filter((e) => e.status === "error").length,
  }

  const statusBadge = (status: CacheEntrySnapshot["status"]) => {
    const map = { pending: "secondary", success: "default", error: "destructive" } as const
    return <Badge variant={map[status]}>{status}</Badge>
  }

  return (
    <PageWrapper title="API Dev Console" description="Every CMS endpoint, request timing, cache and query state.">
      <div className="space-y-8">
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
            <div className="flex flex-wrap gap-3">
              <Badge variant="outline">Locale: {language}</Badge>
              <Badge variant="outline">Cached queries: {counts.total}</Badge>
              <Badge>Success: {counts.success}</Badge>
              <Badge variant="secondary">Fetching: {counts.fetching}</Badge>
              <Badge variant="destructive">Errors: {counts.error}</Badge>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => clearCmsTimings()}>
                Clear timings
              </Button>
              <Button size="sm" onClick={runAll}>
                Test all GET endpoints
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Endpoints */}
        <section>
          <h2 className="mb-3 text-lg font-semibold">Endpoints</h2>
          <div className="grid gap-3 lg:grid-cols-2">
            {API_ENDPOINTS.map((endpoint) => {
              const result = results[endpoint.path]
              return (
                <Card key={endpoint.path}>
                  <CardContent className="space-y-2 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <Badge variant="outline" className="font-mono">{endpoint.method}</Badge>
                        <code className="truncate text-sm">{endpoint.path}</code>
                      </div>
                      {endpoint.method === "GET" && (
                        <Button size="sm" variant="outline" onClick={() => void runTest(endpoint)} disabled={running[endpoint.path]}>
                          {running[endpoint.path] ? "Running…" : "Run"}
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{endpoint.description}</p>
                    <p className="text-xs text-muted-foreground">Hooks: {endpoint.hooks.join(", ")}</p>
                    {result && (
                      <p className="text-sm">
                        <Badge variant={result.ok ? "default" : "destructive"}>{result.ok ? "OK" : "FAIL"}</Badge>{" "}
                        <span className="font-mono text-xs">{result.status ?? "—"} · {result.durationMs} ms</span>
                      </p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        {/* Request timing */}
        <section>
          <h2 className="mb-3 text-lg font-semibold">Request timing</h2>
          {timings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No CMS requests recorded yet — refresh the home page or run endpoints above.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2">Method</th>
                    <th className="px-4 py-2">Path</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Duration</th>
                    <th className="px-4 py-2">Started</th>
                  </tr>
                </thead>
                <tbody>
                  {timings.map((timing) => (
                    <tr key={timing.id} className="border-b last:border-0">
                      <td className="px-4 py-2 font-mono text-xs">{timing.method}</td>
                      <td className="px-4 py-2 font-mono text-xs">{timing.path}</td>
                      <td className="px-4 py-2">
                        <Badge variant={timing.status === 200 ? "default" : timing.status ? "destructive" : "secondary"}>
                          {timing.status ?? "ERR"}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 font-mono text-xs">{timing.durationMs} ms</td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">{new Date(timing.startedAt).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Cache state */}
        <section>
          <h2 className="mb-3 text-lg font-semibold">Cache state</h2>
          {cacheEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No CMS queries mounted yet — visit the home page.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2">Query key</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Fetch</th>
                    <th className="px-4 py-2">Data age</th>
                    <th className="px-4 py-2">Stale</th>
                  </tr>
                </thead>
                <tbody>
                  {cacheEntries.map((entry) => (
                    <tr key={entry.key} className="border-b last:border-0">
                      <td className="px-4 py-2 font-mono text-xs">{entry.key}</td>
                      <td className="px-4 py-2">{statusBadge(entry.status)}</td>
                      <td className="px-4 py-2">
                        <Badge variant="outline">{entry.fetchStatus}</Badge>
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">
                        {entry.dataUpdatedAt ? `${Math.max(0, Math.round((Date.now() - entry.dataUpdatedAt) / 1000))}s ago` : "—"}
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">
                        {entry.staleTime ? `${Math.round(entry.staleTime / 1000)}s` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </PageWrapper>
  )
}