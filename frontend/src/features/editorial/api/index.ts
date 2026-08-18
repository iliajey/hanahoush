import { apiClient } from "@/shared/api/axiosClient"
import type { ApiEnvelope } from "@/shared/types/api"

import type {
  Approval,
  AuditEvent,
  ContentLock,
  DiffResult,
  PublicationSchedule,
  ReviewComment,
  Revision,
  Workflow,
  WorkflowDetail,
  WorkflowListParams,
} from "../types"

const BASE = "/api/v1/editorial"

async function getEnvelope<T>(path: string, params?: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  const { data } = await apiClient.get<ApiEnvelope<T>>(path, { params, signal })
  return data.data
}

async function postEnvelope<T>(path: string, payload?: Record<string, unknown>): Promise<T> {
  const { data } = await apiClient.post<ApiEnvelope<T>>(path, payload ?? {})
  return data.data
}

// -- reads ----------------------------------------------------------------
export async function fetchWorkflows(params: WorkflowListParams = {}, signal?: AbortSignal): Promise<Workflow[]> {
  return getEnvelope<Workflow[]>(`${BASE}/workflows/`, { ...params }, signal)
}

/** Workflows attached to one content object (by content-type label + id). */
export async function fetchWorkflowForContent(
  contentType: string,
  objectId: number,
  signal?: AbortSignal,
): Promise<Workflow[]> {
  return fetchWorkflows({ content_type: contentType, object_id: objectId }, signal)
}

/** Return the workflow for a content object, creating it when absent
 * (staff workspace flow — backend: POST /editorial/workflows/ensure/). */
export async function ensureWorkflow(contentType: string, objectId: number): Promise<WorkflowDetail> {
  return postEnvelope<WorkflowDetail>(`${BASE}/workflows/ensure/`, {
    content_type: contentType,
    object_id: objectId,
  })
}

export async function fetchWorkflow(id: number, signal?: AbortSignal): Promise<WorkflowDetail> {
  return getEnvelope<WorkflowDetail>(`${BASE}/workflows/${id}/`, undefined, signal)
}

export async function fetchRevisions(workflowId: number, signal?: AbortSignal): Promise<Revision[]> {
  return getEnvelope<Revision[]>(`${BASE}/workflows/${workflowId}/revisions/`, undefined, signal)
}

export async function fetchDiff(workflowId: number, from: number, to: number, signal?: AbortSignal): Promise<DiffResult> {
  return getEnvelope<DiffResult>(`${BASE}/workflows/${workflowId}/diff/`, { from, to }, signal)
}

export async function fetchApprovals(workflowId: number, signal?: AbortSignal): Promise<Approval[]> {
  return getEnvelope<Approval[]>(`${BASE}/workflows/${workflowId}/approvals/`, undefined, signal)
}

export async function fetchComments(workflowId: number, signal?: AbortSignal): Promise<ReviewComment[]> {
  return getEnvelope<ReviewComment[]>(`${BASE}/workflows/${workflowId}/comments/`, undefined, signal)
}

export async function fetchAuditEvents(params: Record<string, unknown> = {}, signal?: AbortSignal): Promise<AuditEvent[]> {
  return getEnvelope<AuditEvent[]>(`${BASE}/audit/`, params, signal)
}

export async function fetchSchedules(signal?: AbortSignal): Promise<PublicationSchedule[]> {
  return getEnvelope<PublicationSchedule[]>(`${BASE}/schedules/`, undefined, signal)
}

export async function fetchLocks(signal?: AbortSignal): Promise<ContentLock[]> {
  return getEnvelope<ContentLock[]>(`${BASE}/locks/`, undefined, signal)
}

// -- mutations ------------------------------------------------------------
export async function submitForReview(workflowId: number, reviewerId?: number, comment?: string): Promise<WorkflowDetail> {
  return postEnvelope<WorkflowDetail>(`${BASE}/workflows/${workflowId}/submit-review/`, { reviewer_id: reviewerId, comment })
}

export async function transitionWorkflow(workflowId: number, toStage: string, comment?: string, assigneeId?: number): Promise<WorkflowDetail> {
  return postEnvelope<WorkflowDetail>(`${BASE}/workflows/${workflowId}/transition/`, { to_stage: toStage, comment, assignee_id: assigneeId })
}

export async function decideApproval(workflowId: number, approvalId: number, approved: boolean, comment?: string): Promise<Approval> {
  return postEnvelope<Approval>(`${BASE}/workflows/${workflowId}/approvals/${approvalId}/decide/`, { approved, comment })
}

export async function scheduleWorkflow(workflowId: number, scheduledFor: string): Promise<PublicationSchedule> {
  return postEnvelope<PublicationSchedule>(`${BASE}/workflows/${workflowId}/schedule/`, { scheduled_for: scheduledFor })
}

export async function publishWorkflow(workflowId: number, soft = false): Promise<WorkflowDetail> {
  return postEnvelope<WorkflowDetail>(`${BASE}/workflows/${workflowId}/publish/`, { soft })
}

export async function archiveWorkflow(workflowId: number): Promise<WorkflowDetail> {
  return postEnvelope<WorkflowDetail>(`${BASE}/workflows/${workflowId}/archive/`, {})
}

export async function reopenWorkflow(workflowId: number): Promise<WorkflowDetail> {
  return postEnvelope<WorkflowDetail>(`${BASE}/workflows/${workflowId}/reopen/`, {})
}

export async function rollbackRevision(workflowId: number, revisionId: number): Promise<WorkflowDetail> {
  return postEnvelope<WorkflowDetail>(`${BASE}/workflows/${workflowId}/revisions/${revisionId}/rollback/`, {})
}

export async function addComment(workflowId: number, body: string, mentions?: number[]): Promise<{ id: number }> {
  return postEnvelope<{ id: number }>(`${BASE}/workflows/${workflowId}/comments/`, { body, mentions })
}

export async function resolveComment(workflowId: number, commentId: number): Promise<{ id: number }> {
  return postEnvelope<{ id: number }>(`${BASE}/workflows/${workflowId}/comments/${commentId}/resolve/`, {})
}

export async function acquireLock(contentType: string, objectId: number, note?: string): Promise<ContentLock> {
  return postEnvelope<ContentLock>(`${BASE}/locks/`, { content_type: contentType, object_id: objectId, note })
}

export async function releaseLock(lockId: number): Promise<{ id: number }> {
  return postEnvelope<{ id: number }>(`${BASE}/locks/${lockId}/release/`, {})
}