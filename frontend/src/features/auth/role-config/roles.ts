/** Role codes & catalog — mirror of the backend role catalog
 * (apps/accounts/seeders.py → ROLE_DEFINITIONS + DEMO_USERS).
 *
 * The role codenames themselves exist only for role-aware UX (workspace
 * titles, labels). Authorization decisions are derived from the permission
 * catalog (see ../permissions), never from a hardcoded role comparison in
 * UI code. Backend roles remain the source of truth.
 */

export const ROLE_CODES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  COMPANY_ADMIN: "COMPANY_ADMIN",
  CONTENT_MANAGER: "CONTENT_MANAGER",
  PROJECT_MANAGER: "PROJECT_MANAGER",
  EDITOR: "EDITOR",
  VIEWER: "VIEWER",
} as const

export type RoleCode = (typeof ROLE_CODES)[keyof typeof ROLE_CODES]

export const ALL_ROLE_CODES: readonly RoleCode[] = Object.values(ROLE_CODES)

export type RoleCategory = "operations" | "content" | "editorial" | "readonly"

export interface RoleDefinition {
  codename: RoleCode
  /** i18n keys resolving to the role name / description. */
  nameKey: string
  descriptionKey: string
  /** Role-aware dashboard/workspace title key (see dashboard.host.role.*). */
  workspaceTitleKey: string
  workspaceDescriptionKey: string
  category: RoleCategory
}

export const ROLE_CATALOG: Record<RoleCode, RoleDefinition> = {
  [ROLE_CODES.SUPER_ADMIN]: {
    codename: "SUPER_ADMIN",
    nameKey: "roles.SUPER_ADMIN.name",
    descriptionKey: "roles.SUPER_ADMIN.description",
    workspaceTitleKey: "dashboard.host.role.SUPER_ADMIN.title",
    workspaceDescriptionKey: "dashboard.host.role.SUPER_ADMIN.description",
    category: "operations",
  },
  [ROLE_CODES.COMPANY_ADMIN]: {
    codename: "COMPANY_ADMIN",
    nameKey: "roles.COMPANY_ADMIN.name",
    descriptionKey: "roles.COMPANY_ADMIN.description",
    workspaceTitleKey: "dashboard.host.role.COMPANY_ADMIN.title",
    workspaceDescriptionKey: "dashboard.host.role.COMPANY_ADMIN.description",
    category: "operations",
  },
  [ROLE_CODES.CONTENT_MANAGER]: {
    codename: "CONTENT_MANAGER",
    nameKey: "roles.CONTENT_MANAGER.name",
    descriptionKey: "roles.CONTENT_MANAGER.description",
    workspaceTitleKey: "dashboard.host.role.CONTENT_MANAGER.title",
    workspaceDescriptionKey: "dashboard.host.role.CONTENT_MANAGER.description",
    category: "content",
  },
  [ROLE_CODES.PROJECT_MANAGER]: {
    codename: "PROJECT_MANAGER",
    nameKey: "roles.PROJECT_MANAGER.name",
    descriptionKey: "roles.PROJECT_MANAGER.description",
    workspaceTitleKey: "dashboard.host.role.PROJECT_MANAGER.title",
    workspaceDescriptionKey: "dashboard.host.role.PROJECT_MANAGER.description",
    category: "content",
  },
  [ROLE_CODES.EDITOR]: {
    codename: "EDITOR",
    nameKey: "roles.EDITOR.name",
    descriptionKey: "roles.EDITOR.description",
    workspaceTitleKey: "dashboard.host.role.EDITOR.title",
    workspaceDescriptionKey: "dashboard.host.role.EDITOR.description",
    category: "editorial",
  },
  [ROLE_CODES.VIEWER]: {
    codename: "VIEWER",
    nameKey: "roles.VIEWER.name",
    descriptionKey: "roles.VIEWER.description",
    workspaceTitleKey: "dashboard.host.role.VIEWER.title",
    workspaceDescriptionKey: "dashboard.host.role.VIEWER.description",
    category: "readonly",
  },
}

/** Look up the role definition for an arbitrary codename (e.g. a custom
 * backend role created later). Falls back to a neutral definition. */
export function getRoleDefinition(codename: string | null | undefined): RoleDefinition | null {
  if (!codename) return null
  const known = ROLE_CATALOG[codename as RoleCode]
  if (known) return known
  return {
    codename: codename as RoleCode,
    nameKey: "roles.custom.name",
    descriptionKey: "roles.custom.description",
    workspaceTitleKey: "dashboard.host.role.CUSTOM.title",
    workspaceDescriptionKey: "dashboard.host.role.CUSTOM.description",
    category: "readonly",
  }
}