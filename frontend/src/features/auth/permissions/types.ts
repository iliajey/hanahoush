/** Permission codenames — mirror of the backend permission catalog
 * (apps/accounts/seeders.py → PERMISSION_DEFINITIONS). The backend remains
 * the authoritative security boundary; these types/exports only centralize
 * the strings so UI code never scatters raw literals.
 */

export const PERMISSIONS = {
  // articles
  ARTICLES_VIEW: "articles.view",
  ARTICLES_CREATE: "articles.create",
  ARTICLES_UPDATE: "articles.update",
  ARTICLES_DELETE: "articles.delete",
  ARTICLES_PUBLISH: "articles.publish",
  // projects
  PROJECTS_VIEW: "projects.view",
  PROJECTS_CREATE: "projects.create",
  PROJECTS_UPDATE: "projects.update",
  PROJECTS_DELETE: "projects.delete",
  PROJECTS_PUBLISH: "projects.publish",
  // services
  SERVICES_VIEW: "services.view",
  SERVICES_CREATE: "services.create",
  SERVICES_UPDATE: "services.update",
  SERVICES_DELETE: "services.delete",
  // company
  COMPANY_VIEW: "company.view",
  COMPANY_UPDATE: "company.update",
  // media_library
  MEDIA_UPLOAD: "media.upload",
  MEDIA_MANAGE: "media.manage",
  // analytics
  ANALYTICS_VIEW: "analytics.view",
  // accounts
  USERS_MANAGE: "users.manage",
  ROLES_MANAGE: "roles.manage",
  // editorial
  EDITORIAL_VIEW: "editorial.view",
  EDITORIAL_MANAGE: "editorial.manage",
  EDITORIAL_APPROVE: "editorial.approve",
  EDITORIAL_REVIEW: "editorial.review",
  EDITORIAL_SCHEDULE: "editorial.schedule",
  // integration
  INTEGRATION_VIEW: "integration.view",
} as const

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

export const ALL_PERMISSIONS: readonly PermissionCode[] = Object.values(PERMISSIONS)

export const PERMISSION_MODULES: Record<string, readonly PermissionCode[]> = {
  articles: [
    PERMISSIONS.ARTICLES_VIEW,
    PERMISSIONS.ARTICLES_CREATE,
    PERMISSIONS.ARTICLES_UPDATE,
    PERMISSIONS.ARTICLES_DELETE,
    PERMISSIONS.ARTICLES_PUBLISH,
  ],
  projects: [
    PERMISSIONS.PROJECTS_VIEW,
    PERMISSIONS.PROJECTS_CREATE,
    PERMISSIONS.PROJECTS_UPDATE,
    PERMISSIONS.PROJECTS_DELETE,
    PERMISSIONS.PROJECTS_PUBLISH,
  ],
  services: [
    PERMISSIONS.SERVICES_VIEW,
    PERMISSIONS.SERVICES_CREATE,
    PERMISSIONS.SERVICES_UPDATE,
    PERMISSIONS.SERVICES_DELETE,
  ],
  company: [PERMISSIONS.COMPANY_VIEW, PERMISSIONS.COMPANY_UPDATE],
  media: [PERMISSIONS.MEDIA_UPLOAD, PERMISSIONS.MEDIA_MANAGE],
  analytics: [PERMISSIONS.ANALYTICS_VIEW],
  accounts: [PERMISSIONS.USERS_MANAGE, PERMISSIONS.ROLES_MANAGE],
  editorial: [
    PERMISSIONS.EDITORIAL_VIEW,
    PERMISSIONS.EDITORIAL_MANAGE,
    PERMISSIONS.EDITORIAL_APPROVE,
    PERMISSIONS.EDITORIAL_REVIEW,
    PERMISSIONS.EDITORIAL_SCHEDULE,
  ],
  integration: [PERMISSIONS.INTEGRATION_VIEW],
}