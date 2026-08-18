/** Frontend capability catalogue (Phase 9G).
 *
 * Capabilities abstract "can this user perform X in the UI" away from raw
 * permission strings. Each entry is derived from the BACKEND permission
 * catalog + the is_staff flag — nothing here grants access by itself. The
 * backend remains the authoritative security boundary; a capability only
 * drives navigation, route protection and button visibility.
 */
import type { UserProfile } from "../types"
import { hasAnyPermission, hasAllPermissions, isStaffUser, type PermissionCode } from "../permissions"
import { PERMISSIONS } from "../permissions"

export const CAPABILITIES = {
  /** Open the staff workspace dashboard (role-aware landing). */
  DASHBOARD: "workspace.dashboard",
  /** Content management surfaces (articles/projects) — staff-only writes on
   * the backend (IsStaffOrReadOnly), so these require staff too. */
  CONTENT_ARTICLES: "content.articles",
  CONTENT_PROJECTS: "content.projects",
  CONTENT_ARTICLES_WRITE: "content.articles.write",
  CONTENT_PROJECTS_WRITE: "content.projects.write",
  /** Editorial pipeline reads (editorial.view). */
  EDITORIAL: "editorial.workspace",
  EDITORIAL_REVIEW: "editorial.review",
  EDITORIAL_MANAGE: "editorial.manage",
  EDITORIAL_APPROVE: "editorial.approve",
  EDITORIAL_SCHEDULE: "editorial.schedule",
  /** Media library — staff-only (DRF IsAdminUser). */
  MEDIA_LIBRARY: "media.library",
  MEDIA_UPLOAD: "media.upload",
  MEDIA_MANAGE: "media.manage",
  /** Communication — staff-only admin endpoints (no dedicated codename). */
  CONTACT_MANAGE: "communication.contact",
  NEWSLETTER_MANAGE: "communication.newsletter",
  /** Analytics summary — analytics.view. */
  ANALYTICS: "analytics.view",
  /** Operational system surface — staff roles only. */
  SYSTEM: "system.operations",
} as const

export type CapabilityKey = (typeof CAPABILITIES)[keyof typeof CAPABILITIES]

export interface CapabilityDefinition {
  /** All listed permissions must be granted. */
  requiresAll?: readonly PermissionCode[]
  /** Any listed permission grants the capability. */
  requiresAny?: readonly PermissionCode[]
  /** Backend gate: DRF IsStaffOrReadOnly / IsAdminUser surfaces. */
  staffOnly?: boolean
}

export const CAPABILITY_DEFINITIONS: Record<CapabilityKey, CapabilityDefinition> = {
  [CAPABILITIES.DASHBOARD]: {},
  [CAPABILITIES.CONTENT_ARTICLES]: {
    requiresAny: [PERMISSIONS.ARTICLES_VIEW],
    staffOnly: true,
  },
  [CAPABILITIES.CONTENT_PROJECTS]: {
    requiresAny: [PERMISSIONS.PROJECTS_VIEW],
    staffOnly: true,
  },
  [CAPABILITIES.CONTENT_ARTICLES_WRITE]: {
    requiresAll: [PERMISSIONS.ARTICLES_UPDATE],
    staffOnly: true,
  },
  [CAPABILITIES.CONTENT_PROJECTS_WRITE]: {
    requiresAll: [PERMISSIONS.PROJECTS_UPDATE],
    staffOnly: true,
  },
  [CAPABILITIES.EDITORIAL]: {
    requiresAll: [PERMISSIONS.EDITORIAL_VIEW],
  },
  [CAPABILITIES.EDITORIAL_REVIEW]: {
    requiresAll: [PERMISSIONS.EDITORIAL_REVIEW],
  },
  [CAPABILITIES.EDITORIAL_MANAGE]: {
    requiresAll: [PERMISSIONS.EDITORIAL_MANAGE],
  },
  [CAPABILITIES.EDITORIAL_APPROVE]: {
    requiresAll: [PERMISSIONS.EDITORIAL_APPROVE],
  },
  [CAPABILITIES.EDITORIAL_SCHEDULE]: {
    requiresAny: [PERMISSIONS.EDITORIAL_SCHEDULE, PERMISSIONS.EDITORIAL_MANAGE],
  },
  [CAPABILITIES.MEDIA_LIBRARY]: {
    requiresAny: [PERMISSIONS.MEDIA_UPLOAD, PERMISSIONS.MEDIA_MANAGE],
    staffOnly: true,
  },
  [CAPABILITIES.MEDIA_UPLOAD]: {
    requiresAll: [PERMISSIONS.MEDIA_UPLOAD],
    staffOnly: true,
  },
  [CAPABILITIES.MEDIA_MANAGE]: {
    requiresAll: [PERMISSIONS.MEDIA_MANAGE],
    staffOnly: true,
  },
  [CAPABILITIES.CONTACT_MANAGE]: { staffOnly: true },
  [CAPABILITIES.NEWSLETTER_MANAGE]: { staffOnly: true },
  [CAPABILITIES.ANALYTICS]: {
    requiresAll: [PERMISSIONS.ANALYTICS_VIEW],
  },
  [CAPABILITIES.SYSTEM]: { staffOnly: true },
}

/** True when the user has the capability (permissions AND staff gate). */
export function canUseCapability(user: UserProfile | null | undefined, capability: CapabilityKey): boolean {
  if (!user) return false
  const definition = CAPABILITY_DEFINITIONS[capability]
  if (!definition) return false
  if (definition.staffOnly && !isStaffUser(user)) return false
  if (definition.requiresAll && !hasAllPermissions(user, definition.requiresAll)) return false
  if (definition.requiresAny && !hasAnyPermission(user, definition.requiresAny)) return false
  return true
}

/** All capabilities granted to a user (stable ordering). */
export function grantedCapabilities(user: UserProfile | null | undefined): CapabilityKey[] {
  const keys = Object.values(CAPABILITIES)
  return keys.filter((key) => canUseCapability(user, key))
}