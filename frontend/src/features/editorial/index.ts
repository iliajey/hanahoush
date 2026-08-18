/**
 * Editorial — Enterprise Editorial Workflow feature.
 *
 * Workflow (draft → in_review → seo_review → approved → scheduled → published
 * → archived), version history + rollback + diff, approval chains, review
 * comments, content locking and a full audit trail — wired to the
 * /api/v1/editorial/* API.
 */
export * from "./api"
export * from "./hooks"
export * from "./components"
export * from "./pages"
export { EditorialDevPage } from "./dev"
export type {
  Workflow,
  WorkflowDetail,
  WorkflowStageBrief,
  Revision,
  ReviewComment,
  Approval,
  PublicationSchedule,
  AuditEvent,
  ContentLock,
  DiffChange,
  DiffResult,
  UserBrief,
} from "./types"