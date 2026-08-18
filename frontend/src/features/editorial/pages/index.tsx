import type { ReactNode } from "react"
import { useState } from "react"

import { PageWrapper } from "@/app/layouts/PageWrapper"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

import {
  ApprovalStatus,
  AuditTimeline,
  CommentThread,
  DiffViewer,
  PublishButton,
  RevisionCard,
  WorkflowBadge,
} from "../components"
import {
  useApproveMutation,
  useCommentMutation,
  useDiff,
  usePublishMutation,
  useResolveCommentMutation,
  useRollbackMutation,
  useScheduleMutation,
  useSchedules,
  useWorkflow,
  useWorkflows,
} from "../hooks"
import type { Workflow } from "../types"

function PageShell({ children }: { children: ReactNode }) {
  return <PageWrapper title="Loading…">{children}</PageWrapper>
}

/** Revision history — version chain with rollback. */
export function RevisionHistoryPage({ workflowId }: { workflowId: number }) {
  const workflow = useWorkflow(workflowId)
  const rollback = useRollbackMutation(workflowId)
  const latest = workflow.data?.version ?? 0

  if (workflow.isLoading) return <PageShell><Skeleton className="h-24" /></PageShell>
  if (workflow.isError || !workflow.data) return <PageShell><p className="text-sm text-destructive">Failed to load workflow.</p></PageShell>

  return (
    <PageWrapper title="Revision History" description={`${workflow.data.content_label} · v${latest}`}>
      <div className="flex items-center gap-2">
        <WorkflowBadge stageCode={workflow.data.stage.code} stageName={workflow.data.stage.name} />
        <Badge variant="secondary">{workflow.data.revisions.length} revisions</Badge>
      </div>
      <div className="mt-6 space-y-3">
        {workflow.data.revisions.map((revision) => (
          <RevisionCard
            key={revision.id}
            revision={revision}
            isLatest={revision.version === latest}
            onRollback={() => rollback.mutate(revision.id)}
          />
        ))}
      </div>
    </PageWrapper>
  )
}

/** Workflow timeline — the stage machine + audit trail. */
export function WorkflowTimelinePage({ workflowId }: { workflowId: number }) {
  const workflow = useWorkflow(workflowId)
  if (workflow.isLoading) return <PageShell><Skeleton className="h-24" /></PageShell>
  if (workflow.isError || !workflow.data) return <PageShell><p className="text-sm text-destructive">Failed to load workflow.</p></PageShell>

  const stages = workflow.data.stages
  const currentIndex = Math.max(0, stages.findIndex((s) => s.code === workflow.data.stage.code))

  return (
    <PageWrapper title="Workflow Timeline" description={workflow.data.content_label}>
      <div className="flex flex-wrap items-center gap-2">
        {stages.map((stage, i) => (
          <div key={stage.code} className="flex items-center gap-2">
            <Badge variant={i === currentIndex ? "default" : i < currentIndex ? "secondary" : "outline"}>
              {stage.name}
            </Badge>
            {i < stages.length - 1 ? <span className="text-muted-foreground">→</span> : null}
          </div>
        ))}
      </div>
      <div className="mt-6">
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Audit trail</h3>
        <AuditTimeline events={workflow.data.audit} />
      </div>
    </PageWrapper>
  )
}

/** Approval queue — workflows with pending approvals across the site. */
export function ApprovalQueuePage({ onSelect }: { onSelect?: (id: number) => void }) {
  const workflows = useWorkflows()

  return (
    <PageWrapper title="Approval Queue" description="Workflows waiting for a decision.">
      <div className="space-y-4">
        {(workflows.data ?? []).map((wf: Workflow) => (
          <Card key={wf.id}>
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <WorkflowBadge stageCode={wf.stage.code} stageName={wf.stage.name} />
                  <span className="truncate text-sm font-medium">{wf.content_label}</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {wf.pending_approvals_count ?? 0} pending approval(s) · v{wf.version}
                </div>
              </div>
              {onSelect ? (
                <Button size="sm" variant="outline" onClick={() => onSelect(wf.id)}>
                  Review
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </PageWrapper>
  )
}

/** Review panel — approvals, threaded comments and publish controls. */
export interface ReviewPanelPageProps {
  workflowId: number
  /** Authorization gates (default true keeps existing callers working). */
  canApprove?: boolean
  canSchedule?: boolean
  canPublish?: boolean
  canComment?: boolean
}

export function ReviewPanelPage({
  workflowId,
  canApprove = true,
  canSchedule = true,
  canPublish = true,
  canComment = true,
}: ReviewPanelPageProps) {
  const workflow = useWorkflow(workflowId)
  const addComment = useCommentMutation(workflowId)
  const resolveComment = useResolveCommentMutation(workflowId)
  const approve = useApproveMutation(workflowId)
  const publish = usePublishMutation(workflowId)
  const schedule = useScheduleMutation(workflowId)

  if (workflow.isLoading) return <PageShell><Skeleton className="h-24" /></PageShell>
  if (workflow.isError || !workflow.data) return <PageShell><p className="text-sm text-destructive">Failed to load workflow.</p></PageShell>

  const data = workflow.data
  return (
    <PageWrapper title="Review Panel" description={data.content_label}>
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Approvals</h3>
          <div className="space-y-2">
            {data.approvals.map((approval) => (
              <Card key={approval.id}>
                <CardContent className="flex items-center justify-between gap-3 p-3">
                  <div>
                    <div className="text-sm font-medium">{approval.stage.name}</div>
                    <div className="text-xs text-muted-foreground">by {approval.approver?.username ?? "unassigned"}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ApprovalStatus status={approval.status} />
                    {approval.status === "pending" && canApprove ? (
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => approve.mutate({ approvalId: approval.id, approved: true })}>
                          Approve
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => approve.mutate({ approvalId: approval.id, approved: false })}>
                          Reject
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Comments</h3>
          {canComment ? (
            <CommentThread
              comments={data.comments}
              onCompose={(body) => addComment.mutate({ body })}
              onResolve={(comment) => resolveComment.mutate(comment.id)}
            />
          ) : (
            <p className="text-sm text-muted-foreground">You do not have permission to comment on this item.</p>
          )}
          <div className="mt-6">
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Publishing</h3>
            {(canPublish || canSchedule) && (data.stage.code === "approved" || data.stage.code === "scheduled") ? (
              <PublishButton
                canPublish={canPublish}
                canSchedule={canSchedule}
                onPublish={(soft) => publish.mutate({ soft })}
                onSchedule={(when) => schedule.mutate(when)}
              />
            ) : (
              <p className="text-sm text-muted-foreground">Publishing is not available for this workflow stage.</p>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}

/** Diff viewer — pick two revisions and see field-level changes. */
export function DiffViewerPage({ workflowId }: { workflowId: number }) {
  const [from, setFrom] = useState<number | undefined>()
  const [to, setTo] = useState<number | undefined>()
  const workflow = useWorkflow(workflowId)
  const revisions = workflow.data?.revisions ?? []

  return (
    <PageWrapper title="Diff Viewer" description="Compare two revisions.">
      <div className="flex flex-wrap items-end gap-3">
        <Field label="From" value={from} onChange={setFrom} options={revisions} />
        <Field label="To" value={to} onChange={setTo} options={revisions} />
      </div>
      <div className="mt-6">
        <DiffViewerSection workflowId={workflowId} from={from} to={to} />
      </div>
    </PageWrapper>
  )
}

function Field({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value?: number
  onChange: (v?: number) => void
  options: Array<{ version: number }>
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-muted-foreground">
      {label}
      <select
        className="h-9 rounded-md border bg-background px-2 text-sm"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
      >
        <option value="">—</option>
        {options.map((r) => (
          <option key={r.version} value={r.version}>
            v{r.version}
          </option>
        ))}
      </select>
    </label>
  )
}

function DiffViewerSection({ workflowId, from, to }: { workflowId: number; from?: number; to?: number }) {
  const diff = useDiff(workflowId, from, to)
  if (!from || !to) return <p className="text-sm text-muted-foreground">Select two revisions to compare.</p>
  if (diff.isLoading) return <Skeleton className="h-32" />
  if (diff.isError) return <p className="text-sm text-destructive">Could not compute diff.</p>
  return <DiffViewer changes={diff.data?.changes ?? []} from={from} to={to} />
}

/** Schedule calendar — upcoming publication schedules. */
export function ScheduleCalendarPage() {
  const schedules = useSchedules()
  return (
    <PageWrapper title="Schedule Calendar" description="Publication schedules.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(schedules.data ?? []).map((schedule) => (
          <Card key={schedule.id}>
            <CardContent className="space-y-2 p-4">
              <Badge
                variant={
                  schedule.status === "published" ? "default" : schedule.status === "cancelled" ? "destructive" : "secondary"
                }
              >
                {schedule.status}
              </Badge>
              <div className="text-sm font-medium">{new Date(schedule.scheduled_for).toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">by {schedule.scheduled_by?.username ?? "—"}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageWrapper>
  )
}