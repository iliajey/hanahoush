/** Operational dashboard payload (GET /api/v1/admin/dashboard/ — staff only). */

export interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy" | "unknown" | "restricted"
  details?: string
}

export interface MigrationsStatus {
  status: string
  pending: number | null
}

export interface ContactRequestBrief {
  id: number
  name: string
  email: string
  subject: string
  status: string
  created_at: string
}

export interface MediaUploadBrief {
  id: number
  original_name: string
  mime_type: string
  size: number
  created_at: string
}

export interface EditorialActivityBrief {
  id: number
  action: string
  details: string
  created_at: string
}

export interface AdminActionBrief {
  id: number
  action_flag: number
  change_message: string
  action_time: string
}

export interface DashboardContentSection {
  articles_published: number
  articles_drafts: number
  articles_awaiting_review: number
  articles_scheduled: number
  articles_missing_fa: number
  articles_missing_ar: number
  projects_published: number
  projects_drafts: number
  projects_awaiting_review: number
  projects_missing_fa: number
  projects_missing_ar: number
  services: number
}

export interface DashboardEditorialSection {
  pending_approvals: number
  rejected_approvals: number
  scheduled_publications: number
  active_locks: number
  recent_revisions: number
}

export interface DashboardEngagementSection {
  page_views: number
  page_views_30d: number
  article_views: number
  project_views: number
  contact_requests: number
  newsletter_subscriptions: number
  search_activity: number
}

export interface RecentContentBrief {
  id: number
  title_en: string
  slug: string
  status: string
  updated_at: string
}

export interface DashboardOperationsSection {
  recent_contact_requests: ContactRequestBrief[]
  recent_editorial_activity: EditorialActivityBrief[]
  recent_media_uploads: MediaUploadBrief[]
  recent_admin_actions: AdminActionBrief[]
  /** Present on backends with the Phase 14 dashboard extension; older
   * payloads omit them and the UI degrades to hiding the section. */
  recent_articles?: RecentContentBrief[]
  recent_projects?: RecentContentBrief[]
}

export interface DashboardSystemSection {
  database: HealthStatus
  cache: HealthStatus
  migrations: MigrationsStatus
  environment: string
  version: string
  debug: boolean
}

export interface OperationalDashboard {
  content: DashboardContentSection
  editorial: DashboardEditorialSection
  engagement: DashboardEngagementSection
  operations: DashboardOperationsSection
  system: DashboardSystemSection
  generated_at: string
}