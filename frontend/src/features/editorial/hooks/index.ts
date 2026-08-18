import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { invalidateCmsCache } from "@/features/cms/cache/invalidate"

import {
  acquireLock,
  addComment,
  archiveWorkflow,
  decideApproval,
  fetchApprovals,
  fetchAuditEvents,
  fetchComments,
  fetchDiff,
  fetchLocks,
  fetchRevisions,
  fetchSchedules,
  fetchWorkflow,
  fetchWorkflows,
  publishWorkflow,
  releaseLock,
  reopenWorkflow,
  resolveComment,
  rollbackRevision,
  scheduleWorkflow,
  submitForReview,
  transitionWorkflow,
} from "../api"
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

export const editorialKeys = {
  all: ["editorial"] as const,
  workflows: ["editorial", "workflows"] as const,
  workflow: (id: number) => ["editorial", "workflow", id] as const,
  revisions: (id: number) => ["editorial", "workflow", id, "revisions"] as const,
  diff: (id: number, from: number, to: number) => ["editorial", "workflow", id, "diff", from, to] as const,
  approvals: (id: number) => ["editorial", "workflow", id, "approvals"] as const,
  comments: (id: number) => ["editorial", "workflow", id, "comments"] as const,
  audit: ["editorial", "audit"] as const,
  schedules: ["editorial", "schedules"] as const,
  locks: ["editorial", "locks"] as const,
}

// -- reads ----------------------------------------------------------------
export function useWorkflows(params: WorkflowListParams = {}) {
  return useQuery<Workflow[]>({
    queryKey: [...editorialKeys.workflows, params],
    queryFn: ({ signal }) => fetchWorkflows(params, signal),
  })
}

export function useWorkflow(id: number) {
  return useQuery<WorkflowDetail>({
    queryKey: editorialKeys.workflow(id),
    queryFn: ({ signal }) => fetchWorkflow(id, signal),
  })
}

export function useRevisions(workflowId: number) {
  return useQuery<Revision[]>({
    queryKey: editorialKeys.revisions(workflowId),
    queryFn: ({ signal }) => fetchRevisions(workflowId, signal),
  })
}

export function useDiff(workflowId: number, from?: number, to?: number) {
  return useQuery<DiffResult>({
    queryKey: editorialKeys.diff(workflowId, from ?? 0, to ?? 0),
    queryFn: ({ signal }) => fetchDiff(workflowId, from as number, to as number, signal),
    enabled: from != null && to != null,
  })
}

export function useApprovals(workflowId: number) {
  return useQuery<Approval[]>({
    queryKey: editorialKeys.approvals(workflowId),
    queryFn: ({ signal }) => fetchApprovals(workflowId, signal),
  })
}

export function useComments(workflowId: number) {
  return useQuery<ReviewComment[]>({
    queryKey: editorialKeys.comments(workflowId),
    queryFn: ({ signal }) => fetchComments(workflowId, signal),
  })
}

export function useAuditEvents(params: Record<string, unknown> = {}) {
  return useQuery<AuditEvent[]>({
    queryKey: [...editorialKeys.audit, params],
    queryFn: ({ signal }) => fetchAuditEvents(params, signal),
  })
}

export function useSchedules() {
  return useQuery<PublicationSchedule[]>({
    queryKey: editorialKeys.schedules,
    queryFn: ({ signal }) => fetchSchedules(signal),
  })
}

export function useLocks() {
  return useQuery<ContentLock[]>({
    queryKey: editorialKeys.locks,
    queryFn: ({ signal }) => fetchLocks(signal),
  })
}

// -- mutations ------------------------------------------------------------
function useInvalidateWorkflow(id: number) {
  const queryClient = useQueryClient()
  const invalidate = (workflowId: number = id) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: editorialKeys.workflow(workflowId) }),
      queryClient.invalidateQueries({ queryKey: editorialKeys.workflows }),
      queryClient.invalidateQueries({ queryKey: editorialKeys.audit }),
    ])
  return invalidate
}

/**
 * Content-affecting transitions (publish/unpublish/archive/reopen/rollback)
 * must refresh the public CMS + page-builder caches so the site never serves
 * stale content after a workflow change (Phase 8H cache-invalidation rule).
 */
function useInvalidatePublicContent() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      invalidateCmsCache(queryClient),
      queryClient.invalidateQueries({ queryKey: ["page-builder"] }),
    ])
}

export function useTransitionMutation(workflowId: number) {
  const invalidate = useInvalidateWorkflow(workflowId)
  return useMutation<WorkflowDetail, Error, { toStage: string; comment?: string; assigneeId?: number }>({
    mutationFn: ({ toStage, comment, assigneeId }) => transitionWorkflow(workflowId, toStage, comment, assigneeId),
    onSuccess: (data) => void invalidate(data.id),
  })
}

export function useSubmitForReviewMutation(workflowId: number) {
  const invalidate = useInvalidateWorkflow(workflowId)
  return useMutation<WorkflowDetail, Error, { reviewerId?: number; comment?: string }>({
    mutationFn: ({ reviewerId, comment }) => submitForReview(workflowId, reviewerId, comment),
    onSuccess: (data) => void invalidate(data.id),
  })
}

export function useApproveMutation(workflowId: number) {
  const queryClient = useQueryClient()
  const invalidate = useInvalidateWorkflow(workflowId)
  return useMutation<Approval, Error, { approvalId: number; approved: boolean; comment?: string }>({
    mutationFn: ({ approvalId, approved, comment }) => decideApproval(workflowId, approvalId, approved, comment),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: editorialKeys.approvals(workflowId) })
      void invalidate(workflowId)
    },
  })
}

export function useScheduleMutation(workflowId: number) {
  const invalidate = useInvalidateWorkflow(workflowId)
  const queryClient = useQueryClient()
  return useMutation<PublicationSchedule, Error, string>({
    mutationFn: (scheduledFor) => scheduleWorkflow(workflowId, scheduledFor),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: editorialKeys.schedules })
      void invalidate(workflowId)
    },
  })
}

export function usePublishMutation(workflowId: number) {
  const invalidate = useInvalidateWorkflow(workflowId)
  const invalidatePublic = useInvalidatePublicContent()
  return useMutation<WorkflowDetail, Error, { soft?: boolean }>({
    mutationFn: ({ soft }) => publishWorkflow(workflowId, Boolean(soft)),
    onSuccess: (data) => {
      void invalidate(data.id)
      void invalidatePublic()
    },
  })
}

export function useArchiveMutation(workflowId: number) {
  const invalidate = useInvalidateWorkflow(workflowId)
  const invalidatePublic = useInvalidatePublicContent()
  return useMutation<WorkflowDetail, Error>({
    mutationFn: () => archiveWorkflow(workflowId),
    onSuccess: (data) => {
      void invalidate(data.id)
      void invalidatePublic()
    },
  })
}

export function useReopenMutation(workflowId: number) {
  const invalidate = useInvalidateWorkflow(workflowId)
  const invalidatePublic = useInvalidatePublicContent()
  return useMutation<WorkflowDetail, Error>({
    mutationFn: () => reopenWorkflow(workflowId),
    onSuccess: (data) => {
      void invalidate(data.id)
      void invalidatePublic()
    },
  })
}

export function useRollbackMutation(workflowId: number) {
  const invalidate = useInvalidateWorkflow(workflowId)
  const invalidatePublic = useInvalidatePublicContent()
  const queryClient = useQueryClient()
  return useMutation<WorkflowDetail, Error, number>({
    mutationFn: (revisionId) => rollbackRevision(workflowId, revisionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: editorialKeys.revisions(workflowId) })
      void invalidate(workflowId)
      void invalidatePublic()
    },
  })
}

export function useCommentMutation(workflowId: number) {
  const invalidate = useInvalidateWorkflow(workflowId)
  const queryClient = useQueryClient()
  return useMutation<{ id: number }, Error, { body: string; mentions?: number[] }>({
    mutationFn: ({ body, mentions }) => addComment(workflowId, body, mentions),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: editorialKeys.comments(workflowId) })
      void invalidate(workflowId)
    },
  })
}

export function useResolveCommentMutation(workflowId: number) {
  const invalidate = useInvalidateWorkflow(workflowId)
  const queryClient = useQueryClient()
  return useMutation<{ id: number }, Error, number>({
    mutationFn: (commentId) => resolveComment(workflowId, commentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: editorialKeys.comments(workflowId) })
      void invalidate(workflowId)
    },
  })
}

export function useLockMutations() {
  const queryClient = useQueryClient()
  const refresh = () => void queryClient.invalidateQueries({ queryKey: editorialKeys.locks })
  const acquire = useMutation<ContentLock, Error, { contentType: string; objectId: number; note?: string }>({
    mutationFn: ({ contentType, objectId, note }) => acquireLock(contentType, objectId, note),
    onSuccess: refresh,
  })
  const release = useMutation<{ id: number }, Error, number>({
    mutationFn: (lockId) => releaseLock(lockId),
    onSuccess: refresh,
  })
  return { acquire, release }
}

export type { AuditEvent, ContentLock, DiffResult, PublicationSchedule, ReviewComment, Revision, Workflow, WorkflowDetail }