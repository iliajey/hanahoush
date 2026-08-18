import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { PageWrapper } from "@/app/layouts/PageWrapper"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { useAuditEvents, useLocks, useSchedules, useWorkflows } from "../hooks"
import { WorkflowBadge } from "../components"
import type { Workflow } from "../types"

/** Editorial workspace hub (Part M). Reuses the Phase 8C hooks and API — the
 * backend state machine is never duplicated in the frontend. */
export function EditorialWorkspaceHub() {
  const { t } = useTranslation()

  return (
    <PageWrapper title={t("editorialWorkspace.title")} description={t("editorialWorkspace.subtitle")}>
      <Tabs defaultValue="review">
        <TabsList className="flex-wrap">
          <TabsTrigger value="review">{t("editorialWorkspace.tab.review")}</TabsTrigger>
          <TabsTrigger value="all">{t("editorialWorkspace.tab.all")}</TabsTrigger>
          <TabsTrigger value="schedule">{t("editorialWorkspace.tab.schedule")}</TabsTrigger>
          <TabsTrigger value="locks">{t("editorialWorkspace.tab.locks")}</TabsTrigger>
          <TabsTrigger value="audit">{t("editorialWorkspace.tab.audit")}</TabsTrigger>
        </TabsList>

        <TabsContent value="review">
          <WorkflowList mode="review" />
        </TabsContent>
        <TabsContent value="all">
          <WorkflowList mode="all" />
        </TabsContent>
        <TabsContent value="schedule">
          <ScheduleTab />
        </TabsContent>
        <TabsContent value="locks">
          <LocksTab />
        </TabsContent>
        <TabsContent value="audit">
          <AuditTab />
        </TabsContent>
      </Tabs>
    </PageWrapper>
  )
}

function WorkflowList({ mode }: { mode: "review" | "all" }) {
  const { t } = useTranslation()
  const { data, isLoading, isError } = useWorkflows()

  const items: Workflow[] | undefined =
    mode === "review" ? data?.filter((workflow) => (workflow.pending_approvals_count ?? 0) > 0) : data

  if (isLoading) return <Skeleton className="h-40" />
  if (isError || !items) {
    return <EmptyState title={t("editorialWorkspace.errorTitle")} description={t("editorialWorkspace.errorDescription")} />
  }
  if (!items.length) {
    return (
      <EmptyState
        title={mode === "review" ? t("editorialWorkspace.emptyReview") : t("editorialWorkspace.empty")}
        description={t("editorialWorkspace.emptyDescription")}
      />
    )
  }

  return (
    <div className="space-y-3">
      {items.map((workflow) => (
        <Card key={workflow.id}>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="flex min-w-0 items-center gap-3">
              <WorkflowBadge stageCode={workflow.stage.code} stageName={workflow.stage.name} />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{workflow.content_label}</p>
                <p className="text-xs text-muted-foreground">v{workflow.version}</p>
              </div>
            </div>
            <Button size="sm" variant="outline" asChild>
              <Link to={`/dashboard/editorial/${workflow.id}`}>{t("editorialWorkspace.open")}</Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function ScheduleTab() {
  const { t } = useTranslation()
  const { data, isLoading } = useSchedules()
  if (isLoading) return <Skeleton className="h-40" />
  if (!data?.length) return <EmptyState title={t("editorialWorkspace.emptySchedule")} description={t("editorialWorkspace.emptyDescription")} />
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((schedule) => (
        <Card key={schedule.id}>
          <CardContent className="space-y-2 p-4">
            <Badge variant={schedule.status === "published" ? "default" : schedule.status === "cancelled" ? "destructive" : "secondary"}>
              {schedule.status}
            </Badge>
            <p className="text-sm font-medium">{new Date(schedule.scheduled_for).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{schedule.scheduled_by?.username ?? "—"}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function LocksTab() {
  const { t } = useTranslation()
  const { data, isLoading } = useLocks()
  if (isLoading) return <Skeleton className="h-40" />
  if (!data?.length) return <EmptyState title={t("editorialWorkspace.emptyLocks")} description={t("editorialWorkspace.emptyDescription")} />
  return (
    <div className="space-y-3">
      {data.map((lock) => (
        <Card key={lock.id}>
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{lock.content_label}</p>
              <p className="text-xs text-muted-foreground">
                {lock.locked_by.username} · {new Date(lock.expires_at).toLocaleString()}
              </p>
            </div>
            {lock.note ? <Badge variant="outline">{lock.note}</Badge> : null}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function AuditTab() {
  const { t } = useTranslation()
  const { data, isLoading } = useAuditEvents()
  if (isLoading) return <Skeleton className="h-40" />
  if (!data?.length) return <EmptyState title={t("editorialWorkspace.emptyAudit")} description={t("editorialWorkspace.emptyDescription")} />
  return (
    <div className="space-y-3">
      {data.map((event) => (
        <Card key={event.id}>
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{event.action}</p>
              {event.details ? <p className="truncate text-xs text-muted-foreground">{event.details}</p> : null}
            </div>
            <p className="shrink-0 text-xs text-muted-foreground">{event.actor?.username ?? "—"}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}