import { apiClient } from "@/shared/api/axiosClient"
import type { ApiEnvelope, PaginatedResponse } from "@/shared/types/api"

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

const BASE = "/editorial"

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

export interface ScheduleListParams {
  bucket?: string
  page?: number
  pageSize?: number
  status?: string
  workflow?: number
  ordering?: string
}

export interface ScheduleListResult {
  items: PublicationSchedule[]
  pagination: PaginatedResponse<PublicationSchedule>["pagination"] | null
}

export interface ScheduleCounts {
  total: number
  scheduled: number
  upcoming: number
  overdue: number
  today: number
  attention: number
  published: number
  cancelled: number
  failed: number
}

export async function fetchSchedules(
  bucket?: string,
  signal?: AbortSignal,
): Promise<PublicationSchedule[]>
export async function fetchSchedules(params: ScheduleListParams, signal?: AbortSignal): Promise<ScheduleListResult>
export async function fetchSchedules(
  bucketOrParams?: string | ScheduleListParams,
  signal?: AbortSignal,
): Promise<PublicationSchedule[] | ScheduleListResult> {
  const params: Record<string, unknown> =
    typeof bucketOrParams === "string"
      ? bucketOrParams ? { bucket: bucketOrParams } : {}
      : {
          ...(bucketOrParams?.bucket ? { bucket: bucketOrParams.bucket } : {}),
          ...(bucketOrParams?.page != null ? { page: bucketOrParams.page } : {}),
          ...(bucketOrParams?.pageSize != null ? { page_size: bucketOrParams.pageSize } : {}),
          ...(bucketOrParams?.status ? { status: bucketOrParams.status } : {}),
          ...(bucketOrParams?.workflow != null ? { workflow: bucketOrParams.workflow } : {}),
          ...(bucketOrParams?.ordering ? { ordering: bucketOrParams.ordering } : {}),
        }
  const { data } = await apiClient.get<PaginatedResponse<PublicationSchedule>>(`${BASE}/schedules/`, {
    params,
    signal,
  })
  if (typeof bucketOrParams === "string" || bucketOrParams === undefined) {
    return data.data ?? []
  }
  return { items: data.data ?? [], pagination: data.pagination ?? null }
}

export async function fetchScheduleCounts(signal?: AbortSignal): Promise<ScheduleCounts> {
  return getEnvelope<ScheduleCounts>(`${BASE}/schedules/counts/`, undefined, signal)
}

/** Blocking issues + human message from a schedule/publish mutation error.
 * The API error shape is `{ success:false, message, errors:{ blocking:[...] } }`
 * delivered via axios rejection (not toApiError-normalized), so read both. */
export function scheduleActionError(error: unknown): {
  blocking: Array<{ field: string; locale: string | null; message: string }>
  message: string | null
} {
  const raw = error as {
    response?: { data?: { errors?: { blocking?: unknown }; message?: string } }
    errors?: { blocking?: unknown }
    message?: string
  } | null
  const body = raw?.response?.data ?? raw
  const blocking = (body?.errors as { blocking?: unknown } | undefined)?.blocking
  const list = Array.isArray(blocking)
    ? blocking.filter(
        (b): b is { field: string; locale: string | null; message: string } =>
          typeof b === "object" && b !== null && typeof (b as { message?: unknown }).message === "string",
      )
    : []
  // When structured blockers render, suppress the generic message (the panel
  // shows the per-locale list instead). Otherwise surface message verbatim.
  const message = list.length > 0 ? null : typeof body?.message === "string" && body.message.length > 0 ? body.message : null
  return { blocking: list, message }
}

export async function cancelSchedule(scheduleId: number): Promise<PublicationSchedule> {
  return postEnvelope<PublicationSchedule>(`${BASE}/schedules/${scheduleId}/cancel/`, {})
}

export async function rescheduleSchedule(scheduleId: number, scheduledFor: string): Promise<PublicationSchedule> {
  return postEnvelope<PublicationSchedule>(`${BASE}/schedules/${scheduleId}/reschedule/`, { scheduled_for: scheduledFor })
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