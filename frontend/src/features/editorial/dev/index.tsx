import { useState } from "react"

import { PageWrapper } from "@/app/layouts/PageWrapper"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { ApprovalStatus, AuditTimeline, LockIndicator, RevisionCard, WorkflowBadge } from "../components"
import { useRollbackMutation, useWorkflow, useWorkflows } from "../hooks"
import { useLockMutations } from "../hooks"

/** Development console — visualize workflow state, revision chain, approvals, locks. */
export function EditorialDevPage() {
  const workflows = useWorkflows()
  const [workflowId, setWorkflowId] = useState<number | null>(null)
  const firstId = workflowId ?? workflows.data?.[0]?.id ?? null
  const id = workflowId ?? firstId

  const workflow = useWorkflow(Number(id))
  const rollback = useRollbackMutation(Number(id))
  const locks = useLockMutations()

  return (
    <PageWrapper title="Editorial Console" description="Workflow state, revision chain, approval flow and locks.">
      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <span className="text-sm text-muted-foreground">Workflow</span>
            <Select value={id ? String(id) : ""} onValueChange={(value) => setWorkflowId(Number(value))}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select workflow" />
              </SelectTrigger>
              <SelectContent>
                {(workflows.data ?? []).map((wf) => (
                  <SelectItem key={wf.id} value={String(wf.id)}>
                    #{wf.id} — {wf.content_label} ({wf.stage.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {workflow.data ? (
              <div className="flex flex-wrap items-center gap-2">
                <WorkflowBadge stageCode={workflow.data.stage.code} stageName={workflow.data.stage.name} />
                <Badge variant="secondary">v{workflow.data.version}</Badge>
                <Badge variant={workflow.data.is_soft_published ? "default" : "outline"}>
                  {workflow.data.is_soft_published ? "soft-published" : (workflow.data.pending_approvals_count ?? 0) + " pending"}
                </Badge>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {!workflow.data ? (
          <p className="text-sm text-muted-foreground">No workflows yet — create one from a content object in the admin/API.</p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-6">
              <Card>
                <CardContent className="space-y-2 p-4">
                  <h3 className="text-sm font-semibold">Approval flow</h3>
                  {workflow.data.approvals.map((approval) => (
                    <div key={approval.id} className="flex items-center justify-between text-sm">
                      <span>{approval.stage.name}</span>
                      <ApprovalStatus status={approval.status} />
                    </div>
                  ))}
                  {workflow.data.approvals.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No approvals recorded.</p>
                  ) : null}
                </CardContent>
              </Card>
              <Card>
                <CardContent className="space-y-2 p-4">
                  <h3 className="text-sm font-semibold">Locks</h3>
                  <LockIndicator
                    lock={workflow.data.lock}
                    onRelease={() => workflow.data.lock && locks.release.mutate(workflow.data.lock.id)}
                  />
                  <button
                    type="button"
                    disabled={Boolean(workflow.data.lock)}
                    onClick={() => locks.acquire.mutate({ contentType: "articles.article", objectId: workflow.data.object_id })}
                    className="rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    Acquire lock
                  </button>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <h3 className="mb-2 text-sm font-semibold">Audit trail</h3>
                  <AuditTimeline events={workflow.data.audit} />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardContent className="space-y-2 p-4">
                  <h3 className="text-sm font-semibold">Revision chain</h3>
                  {workflow.data.revisions.map((revision) => (
                    <RevisionCard
                      key={revision.id}
                      revision={revision}
                      isLatest={revision.version === workflow.data.version}
                      onRollback={() => rollback.mutate(revision.id)}
                    />
                  ))}
                  {workflow.data.revisions.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No revisions yet.</p>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}