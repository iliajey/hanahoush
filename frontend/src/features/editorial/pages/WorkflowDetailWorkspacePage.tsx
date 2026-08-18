import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { useState } from "react"

import { PageWrapper } from "@/app/layouts/PageWrapper"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuthorization } from "@/features/auth/hooks/useAuthorization"
import { CAPABILITIES } from "@/features/auth/role-config"

import {
  useApproveMutation,
  useCommentMutation,
  useDiff,
  usePublishMutation,
  useResolveCommentMutation,
  useRollbackMutation,
  useScheduleMutation,
  useWorkflow,
} from "../hooks"
import {
  ApprovalStatus,
  AuditTimeline,
  CommentThread,
  DiffViewer,
  PublishButton,
  RevisionCard,
  WorkflowBadge,
} from "../components"

/**
 * Staff workflow detail (Part M): approval decisions, threaded comments,
 * publish/schedule, revision history + diff, and the audit trail. Every
 * action button is gated by the authenticated user's capabilities; the
 * backend enforces the same rules authoritatively.
 */
export function WorkflowDetailWorkspacePage() {
  const { t } = useTranslation()
  const { workflowId } = useParams<{ workflowId: string }>()
  const navigate = useNavigate()
  const id = Number(workflowId)
  const { data: workflow, isLoading, isError } = useWorkflow(id)

  if (isLoading) return <PageWrapper title="…"><Skeleton className="h-40" /></PageWrapper>
  if (isError || !workflow) {
    return <PageWrapper title={t("editorialWorkspace.errorTitle")}><p className="text-sm text-destructive">{t("editorialWorkspace.errorDescription")}</p></PageWrapper>
  }

  return (
    <PageWrapper
      title={workflow.content_label}
      description={`v${workflow.version} · ${workflow.stage.name}`}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button size="sm" variant="ghost" onClick={() => navigate("/dashboard/editorial")}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t("editorialWorkspace.back")}
        </Button>
        <WorkflowBadge stageCode={workflow.stage.code} stageName={workflow.stage.name} />
        <Badge variant="outline">v{workflow.version}</Badge>
      </div>

      <Tabs defaultValue="review">
        <TabsList className="flex-wrap">
          <TabsTrigger value="review">{t("editorialWorkspace.tab.review")}</TabsTrigger>
          <TabsTrigger value="revisions">{t("editorialWorkspace.tab.revisions")}</TabsTrigger>
          <TabsTrigger value="timeline">{t("editorialWorkspace.tab.timeline")}</TabsTrigger>
        </TabsList>
        <TabsContent value="review">
          <ReviewTab workflowId={id} />
        </TabsContent>
        <TabsContent value="revisions">
          <RevisionsTab workflowId={id} />
        </TabsContent>
        <TabsContent value="timeline">
          <TimelineTab workflowId={id} />
        </TabsContent>
      </Tabs>
    </PageWrapper>
  )
}

function ReviewTab({ workflowId }: { workflowId: number }) {
  const { t } = useTranslation()
  const { can } = useAuthorization()
  const canApprove = can(CAPABILITIES.EDITORIAL_APPROVE)
  const canManage = can(CAPABILITIES.EDITORIAL_MANAGE)
  const canReview = can(CAPABILITIES.EDITORIAL_REVIEW)
  const canSchedule = can(CAPABILITIES.EDITORIAL_SCHEDULE)
  const canComment = canReview || canManage

  const { data: workflow, isLoading, isError } = useWorkflow(workflowId)
  const approve = useApproveMutation(workflowId)
  const publish = usePublishMutation(workflowId)
  const schedule = useScheduleMutation(workflowId)
  const addComment = useCommentMutation(workflowId)
  const resolveComment = useResolveCommentMutation(workflowId)

  if (isLoading) return <Skeleton className="h-40" />
  if (isError || !workflow) return <p className="text-sm text-destructive">{t("editorialWorkspace.errorDescription")}</p>

  const availableForPublishing = workflow.stage.code === "approved" || workflow.stage.code === "scheduled"

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardContent className="space-y-3 p-4">
          <h3 className="text-sm font-semibold text-muted-foreground">{t("editorialWorkspace.approvals")}</h3>
          {workflow.approvals.length ? (
            workflow.approvals.map((approval) => (
              <div key={approval.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                <div>
                  <div className="text-sm font-medium">{approval.stage.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {t("editorialWorkspace.by")} {approval.approver?.username ?? t("editorialWorkspace.unassigned")}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ApprovalStatus status={approval.status} />
                  {approval.status === "pending" && canApprove ? (
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => approve.mutate({ approvalId: approval.id, approved: true })}>
                        {t("editorialWorkspace.approve")}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => approve.mutate({ approvalId: approval.id, approved: false })}>
                        {t("editorialWorkspace.reject")}
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">{t("editorialWorkspace.noApprovals")}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-4">
          <h3 className="text-sm font-semibold text-muted-foreground">{t("editorialWorkspace.comments")}</h3>
          {canComment ? (
            <CommentThread
              comments={workflow.comments}
              onCompose={(body) => addComment.mutate({ body })}
              onResolve={(comment) => resolveComment.mutate(comment.id)}
            />
          ) : (
            <p className="text-sm text-muted-foreground">{t("editorialWorkspace.commentsDenied")}</p>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardContent className="space-y-3 p-4">
          <h3 className="text-sm font-semibold text-muted-foreground">{t("editorialWorkspace.publishing")}</h3>
          {availableForPublishing && (canManage || canSchedule) ? (
            <PublishButton
              canPublish={canManage}
              canSchedule={canSchedule}
              onPublish={(soft) => publish.mutate({ soft })}
              onSchedule={(when) => schedule.mutate(when)}
            />
          ) : (
            <p className="text-sm text-muted-foreground">{t("editorialWorkspace.publishingDenied")}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function RevisionsTab({ workflowId }: { workflowId: number }) {
  const { t } = useTranslation()
  const { can } = useAuthorization()
  const canManage = can(CAPABILITIES.EDITORIAL_MANAGE)
  const { data: workflow, isLoading } = useWorkflow(workflowId)
  const rollback = useRollbackMutation(workflowId)
  const [from, setFrom] = useState<number | undefined>()
  const [to, setTo] = useState<number | undefined>()
  const diff = useDiff(workflowId, from ?? 0, to ?? 0)

  if (isLoading || !workflow) return <Skeleton className="h-40" />
  const revisions = workflow.revisions

  if (!revisions.length) {
    return <p className="text-sm text-muted-foreground">{t("editorialWorkspace.emptyRevisions")}</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          {t("editorialWorkspace.from")}
          <select
            className="h-9 rounded-md border bg-background px-2 text-sm"
            value={from ?? ""}
            onChange={(event) => setFrom(event.target.value ? Number(event.target.value) : undefined)}
          >
            <option value="">—</option>
            {revisions.map((revision) => (
              <option key={revision.id} value={revision.version}>v{revision.version}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          {t("editorialWorkspace.to")}
          <select
            className="h-9 rounded-md border bg-background px-2 text-sm"
            value={to ?? ""}
            onChange={(event) => setTo(event.target.value ? Number(event.target.value) : undefined)}
          >
            <option value="">—</option>
            {revisions.map((revision) => (
              <option key={revision.id} value={revision.version}>v{revision.version}</option>
            ))}
          </select>
        </label>
      </div>

      {from && to && diff.data ? (
        <DiffViewer changes={diff.data.changes} from={from} to={to} />
      ) : null}

      <div className="space-y-3">
        {revisions.map((revision) => (
          <RevisionCard
            key={revision.id}
            revision={revision}
            isLatest={revision.version === workflow.version}
            onRollback={canManage ? () => rollback.mutate(revision.id) : undefined}
          />
        ))}
      </div>
    </div>
  )
}

function TimelineTab({ workflowId }: { workflowId: number }) {
  const { t } = useTranslation()
  const { data: workflow, isLoading } = useWorkflow(workflowId)
  if (isLoading || !workflow) return <Skeleton className="h-40" />

  const stages = workflow.stages
  const currentIndex = Math.max(0, stages.findIndex((stage) => stage.code === workflow.stage.code))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {stages.map((stage, index) => (
          <div key={stage.code} className="flex items-center gap-2">
            <Badge variant={index === currentIndex ? "default" : index < currentIndex ? "secondary" : "outline"}>
              {stage.name}
            </Badge>
            {index < stages.length - 1 ? <span className="text-muted-foreground">→</span> : null}
          </div>
        ))}
      </div>
      <div>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground">{t("editorialWorkspace.auditTrail")}</h3>
        <AuditTimeline events={workflow.audit} />
      </div>
    </div>
  )
}