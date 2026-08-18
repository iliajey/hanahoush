import type { UserProfile } from "../types"

import type { PermissionCode } from "./types"

export type { PermissionCode, PERMISSIONS, ALL_PERMISSIONS, PERMISSION_MODULES } from "./types"

/** Is the user a platform staff member (backend IsStaffOrReadOnly gate)? */
export function isStaffUser(user: UserProfile | null | undefined): boolean {
  return Boolean(user && user.is_staff)
}

/** Does the user have the given permission codename? Superusers receive the
 * full catalog from the backend, so a plain membership check is enough. */
export function hasPermission(user: UserProfile | null | undefined, permission: PermissionCode): boolean {
  if (!user) return false
  return user.permissions.includes(permission)
}

/** Does the user have ANY of the given permission codenames? */
export function hasAnyPermission(
  user: UserProfile | null | undefined,
  permissions: readonly PermissionCode[],
): boolean {
  if (!permissions.length) return false
  return permissions.some((permission) => hasPermission(user, permission))
}

/** Does the user have ALL of the given permission codenames? */
export function hasAllPermissions(
  user: UserProfile | null | undefined,
  permissions: readonly PermissionCode[],
): boolean {
  return permissions.every((permission) => hasPermission(user, permission))
}

/** Does the user have the given primary role? */
export function hasRole(user: UserProfile | null | undefined, codename: string): boolean {
  return Boolean(user?.role && user.role.codename === codename)
}

/** Does the user have any of the given primary roles? */
export function hasAnyRole(user: UserProfile | null | undefined, codenames: readonly string[]): boolean {
  return codenames.some((codename) => hasRole(user, codename))
}

/** Group the user's granted permission codenames by module. */
export function groupPermissionsByModule(user: UserProfile | null | undefined): Record<string, string[]> {
  if (!user) return {}
  const grouped: Record<string, string[]> = {}
  for (const code of user.permissions) {
    const module = code.split(".")[0] ?? "other"
    ;(grouped[module] ??= []).push(code)
  }
  return grouped
}