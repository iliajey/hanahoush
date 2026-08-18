/** Editorial workflow domain types (mirror the editorial API). */

export interface UserBrief {
  id: number
  username: string
}

export interface WorkflowStageBrief {
  code: string
  name: string
  order: number
  requires_approval: boolean
  allowed_transitions: string[]
}

export interface Workflow {
  id: number
  content_type: number
  object_id: number
  content_label: string
  stage: WorkflowStageBrief
  version: number
  is_soft_published: boolean
  pending_approvals_count?: number
  created_at: string
  updated_at: string
}

export interface Revision {
  id: number
  version: number
  summary: string
  data?: Record<string, unknown>
  created_by: UserBrief | null
  created_at: string
}

export interface ReviewComment {
  id: number
  parent: number | null
  body: string
  resolved: boolean
  resolved_by: UserBrief | null
  resolved_at: string | null
  mentions: number[]
  created_by: UserBrief | null
  created_at: string
  replies?: ReviewComment[]
}

export interface Approval {
  id: number
  stage: WorkflowStageBrief
  status: "pending" | "approved" | "rejected"
  approver: UserBrief | null
  requested_by: UserBrief | null
  comment: string
  decided_at: string | null
  order: number
  created_at: string
}

export interface PublicationSchedule {
  id: number
  scheduled_for: string
  published_at: string | null
  status: "scheduled" | "publishing" | "published" | "cancelled"
  scheduled_by: UserBrief | null
  cancelled_by: UserBrief | null
  created_at: string
}

export interface AuditEvent {
  id: number
  action: string
  actor: UserBrief | null
  old_value: unknown
  new_value: unknown
  details: string
  ip_address: string | null
  created_at: string
}

export interface ContentLock {
  id: number
  content_label: string
  locked_by: UserBrief
  expires_at: string
  note: string
  created_at: string
}

export interface WorkflowDetail extends Workflow {
  stages: WorkflowStageBrief[]
  revisions: Revision[]
  approvals: Approval[]
  schedules: PublicationSchedule[]
  comments: ReviewComment[]
  audit: AuditEvent[]
  lock: ContentLock | null
}

export interface DiffChange {
  field: string
  kind: "added" | "removed" | "changed"
  old: unknown
  new: unknown
}

export interface DiffResult {
  from: number
  to: number
  changes: DiffChange[]
}

export interface WorkflowListParams {
  stage?: string
  content_type?: string
  object_id?: number
  page?: number
  pageSize?: number
}
