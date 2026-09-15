import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { PageWrapper } from "@/app/layouts/PageWrapper"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Pagination } from "@/components/ui/pagination"
import { useToast } from "@/components/ui/toast"
import { useAuthorization } from "@/features/auth/hooks/useAuthorization"
import { CAPABILITIES } from "@/features/auth/role-config"
import { useLanguage } from "@/app/language/useLanguage"
import { useSeoMeta } from "@/features/cms/seo"
import { studioPathWithLocale } from "@/shared/lib/studioLocale"

import { useCancelScheduleMutation, useRescheduleMutation, useScheduleCounts, useSchedulePage } from "../hooks"
import { WorkflowBadge, Countdown } from "../components"
import type { PublicationSchedule } from "../types"
import type { LanguageCode } from "@/app/language/language.types"

function bucketOf(s: PublicationSchedule, now: number): "overdue" | "today" | "upcoming" | "other" {
  if (s.status !== "scheduled") return "other"
  const t = new Date(s.scheduled_for).getTime()
  const day = new Date()
  day.setHours(0, 0, 0, 0)
  const end = day.getTime() + 86400000
  if (t < now) return "overdue"
  if (t >= day.getTime() && t < end) return "today"
  return "upcoming"
}

function needsAttention(s: PublicationSchedule): boolean {
  if (s.has_failed) return true
  if (s.status === "scheduled" && bucketOf(s, Date.now()) === "overdue") return true
  const r = s.locale_readiness
  if (!r) return false
  return (["en", "fa", "ar"] as const).some((l) => (r[l]?.critical ?? 0) > 0)
}

/** Deep link into the owning studio for a schedule row (best-effort). */
function studioPath(item: PublicationSchedule, locale?: LanguageCode): string | null {
  const model = (item.content_type ?? "").split(".")[1] ?? ""
  if (item.object_id == null) return null
  const base =
    model === "article"
      ? `/dashboard/articles/${item.object_id}/edit`
      : model === "project"
        ? `/dashboard/projects/${item.object_id}/edit`
        : model === "service"
          ? `/dashboard/services/${item.object_id}/edit`
          : null
  if (!base) return null
  return locale ? studioPathWithLocale(base, locale) : base
}

function LocaleDots({ item }: { item: PublicationSchedule }) {
  const readiness = item.locale_readiness
  if (!readiness) return null
  const studio = studioPath(item)
  return (
    <span className="inline-flex items-center gap-1.5" role="group" aria-label="Locale readiness">
      {(["en", "fa", "ar"] as const).map((locale) => {
        const r = readiness[locale]
        if (!r) return null
        const symbol = r.critical > 0 ? "!" : r.ready ? "●" : "○"
        const label = `${locale.toUpperCase()} — ${r.critical > 0 ? "blocked" : r.ready ? "ready" : "incomplete"}${r.issues.length ? `: ${r.issues.join("; ")}` : ""}`
        const dot = (
          <span
            title={label}
            aria-label={label}
            className={`inline-flex items-center gap-0.5 text-xs font-medium tabular-nums ${r.critical > 0 ? "text-destructive" : r.ready ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}
          >
            <span aria-hidden="true">{symbol}</span>
            {locale.toUpperCase()}
          </span>
        )
        return studio ? (
          <Link
            key={locale}
            to={studioPath(item, locale) ?? studio}
            title={`${label} — open studio in ${locale.toUpperCase()}`}
            aria-label={`${label} — open studio in ${locale.toUpperCase()}`}
            className="rounded-sm hover:underline focus-visible:outline-2 focus-visible:outline-ring"
          >
            {dot}
          </Link>
        ) : (
          <span key={locale}>{dot}</span>
        )
      })}
    </span>
  )
}

function Row({ item, now }: { item: PublicationSchedule; now: number }) {
  const { t } = useTranslation()
  const { can } = useAuthorization()
  const { toast } = useToast()
  const canMutate = can(CAPABILITIES.EDITORIAL_SCHEDULE)
  const cancel = useCancelScheduleMutation()
  const reschedule = useRescheduleMutation()
  const [when, setWhen] = useState("")
  const type = (item.content_type ?? "").split(".")[1] ?? item.content_type ?? "—"
  const studio = studioPath(item)
  const attention = needsAttention(item)
  const notify = (kind: "reschedule" | "cancel", ok: boolean, message?: string) =>
    toast({
      title: ok
        ? kind === "reschedule"
          ? t("timeline.rescheduled")
          : t("timeline.cancelled")
        : t("timeline.actionFailed"),
      description: ok ? undefined : message ?? t("errors.unexpected"),
      variant: ok ? "success" : "error",
    })
  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{type}</Badge>
            {item.stage ? <WorkflowBadge stageCode={item.stage.code} stageName={item.stage.name} /> : null}
            <Badge variant={item.status === "scheduled" ? "secondary" : item.status === "published" ? "default" : "destructive"}>{item.status}</Badge>
            {attention && item.status === "scheduled" ? <Badge variant="destructive">Needs attention</Badge> : null}
            {item.has_failed && item.status === "scheduled" ? (
              <Badge variant="destructive" title={item.last_failed_details ?? "Publication failed"}>
                Failed — fix & retry
              </Badge>
            ) : null}
            <LocaleDots item={item} />
          </div>
          <p className="mt-1 truncate text-sm font-medium" dir="auto">{item.content_label || `#${item.object_id ?? item.workflow}`}</p>
          <p className="text-xs text-muted-foreground">
            <time dateTime={item.scheduled_for} title={new Date(item.scheduled_for).toLocaleString()}>
              {new Date(item.scheduled_for).toLocaleString()}
            </time>
            {" "}<Countdown iso={item.scheduled_for} now={now} />
            {" "}· by {item.scheduled_by?.username ?? "—"}
          </p>
          {item.has_failed && item.status === "scheduled" && item.last_failed_details ? (
            <p className="mt-1 text-xs text-destructive" role="alert" dir="auto">
              Last failure: {item.last_failed_details}
              {item.last_failed_at ? ` · ${new Date(item.last_failed_at).toLocaleString()}` : null}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-3">
            {item.workflow ? (
              <Link to={`/dashboard/editorial/${item.workflow}`} className="text-xs font-medium text-primary hover:underline">
                {t("editorialWorkspace.open")}
              </Link>
            ) : null}
            {studio ? (
              <Link to={studio} className="text-xs font-medium text-primary hover:underline">
                Open studio
              </Link>
            ) : null}
          </div>
        </div>
        {canMutate && item.status === "scheduled" ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="h-8 w-44 text-xs" aria-label="Reschedule time" />
            <Button
              size="sm"
              variant="outline"
              disabled={!when || reschedule.isPending}
              onClick={() =>
                when &&
                reschedule.mutate(
                  { id: item.id, when: new Date(when).toISOString() },
                  {
                    onSuccess: () => notify("reschedule", true),
                    onError: (e) => notify("reschedule", false, (e as Error)?.message),
                  },
                )
              }
            >
              Reschedule
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={cancel.isPending}
              onClick={() =>
                cancel.mutate(item.id, {
                  onSuccess: () => notify("cancel", true),
                  onError: (e) => notify("cancel", false, (e as Error)?.message),
                })
              }
            >
              Cancel
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

const PAGE_SIZE = 20

export function PublicationTimelinePage() {
  const { t } = useTranslation()
  const { language } = useLanguage()
  useSeoMeta({ title: t("timeline.title"), robots: "noindex,follow" }, language)
  const [q, setQ] = useState("")
  const [bucket, setBucket] = useState("all")
  const [view, setView] = useState<"list" | "month">("list")
  const [page, setPage] = useState(1)
  const [now, setNow] = useState(() => Date.now())

  // Minute-level refresh for countdown labels; one timer per page, not per row.
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  // Server is authoritative: bucket + pagination run in the API. Search stays
  // client-side over the fetched page (server has no schedule text search).
  const serverBucket = bucket === "all" || bucket === "other" ? undefined : bucket
  const pageQuery = useSchedulePage(
    bucket === "other"
      ? { bucket: "done", page, pageSize: PAGE_SIZE }
      : { bucket: serverBucket, page, pageSize: PAGE_SIZE },
  )
  const countsQuery = useScheduleCounts()
  const { data: pageData, isLoading, isError, refetch } = pageQuery
  const items = useMemo(() => {
    const rows = (pageData?.items ?? []).filter((s) =>
      q ? (s.content_label ?? "").toLowerCase().includes(q.toLowerCase()) : true,
    )
    return [...rows].sort((a, b) => +new Date(a.scheduled_for) - +new Date(b.scheduled_for))
  }, [pageData, q])

  const groups = useMemo(() => {
    const map = new Map<string, PublicationSchedule[]>()
    for (const s of items) {
      const d = new Date(s.scheduled_for)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(s)
    }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1))
  }, [items])

  const counts = countsQuery.data
  const overdue = counts?.overdue ?? 0
  const today = counts?.today ?? 0
  const attentionCount = counts?.attention ?? 0
  const total = counts?.total ?? pageData?.pagination?.count ?? items.length
  const numPages = pageData?.pagination?.num_pages ?? 1

  return (
    <PageWrapper
      title={t("timeline.title")}
      description={t("timeline.subtitle")}
      breadcrumb={[{ label: t("navWorkspace.dashboard"), href: "/dashboard" }, { label: t("timeline.title") }]}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge variant={overdue ? "destructive" : "outline"}>Overdue: {overdue}</Badge>
        <Badge variant="secondary">Today: {today}</Badge>
        <Badge variant={attentionCount ? "destructive" : "outline"}>Needs attention: {attentionCount}</Badge>
        {(counts?.failed ?? 0) > 0 ? <Badge variant="destructive">Failed: {counts?.failed}</Badge> : null}
        <Badge variant="outline">Total: {total}</Badge>
        <div className="ms-auto flex flex-wrap items-center gap-2">
          <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} placeholder={t("timeline.search")} className="h-8 w-44 text-xs" aria-label={t("timeline.search")} />
          <Select value={bucket} onValueChange={(v) => { setBucket(v); setPage(1) }}>
            <SelectTrigger className="h-8 w-36 text-xs" aria-label="Bucket filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="attention">Needs attention</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="other">Done</SelectItem>
            </SelectContent>
          </Select>
          <Select value={view} onValueChange={(v) => setView(v as "list" | "month")}>
            <SelectTrigger className="h-8 w-28 text-xs" aria-label="View">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="list">List</SelectItem>
              <SelectItem value="month">Day groups</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {isLoading ? (
        <div className="space-y-2" role="status" aria-live="polite">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="flex gap-2 p-6">
            <p className="text-sm text-muted-foreground">{t("timeline.loadFailed")}</p>
            <Button size="sm" variant="outline" onClick={() => void refetch()}>{t("errors.retry")}</Button>
          </CardContent>
        </Card>
      ) : !items.length ? (
        <EmptyState title={t("timeline.empty")} description={t("timeline.emptyDescription")} />
      ) : view === "list" ? (
        <div className="space-y-3">{items.map((s) => <Row key={s.id} item={s} now={now} />)}</div>
      ) : (
        <div className="space-y-6">
          {groups.map(([day, rows]) => (
            <section key={day} aria-label={day}>
              <h2 className="mb-2 text-sm font-semibold tabular-nums" dir="ltr">{day} · {rows.length}</h2>
              <div className="space-y-3">{rows.map((s) => <Row key={s.id} item={s} now={now} />)}</div>
            </section>
          ))}
        </div>
      )}
      {numPages > 1 ? (
        <div className="mt-4">
          <Pagination currentPage={page} totalPages={numPages} onPageChange={setPage} />
        </div>
      ) : null}
    </PageWrapper>
  )
}
