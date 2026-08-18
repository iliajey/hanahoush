import { useMemo } from "react"

import {
  hasAnyPermission,
  hasAnyRole,
  hasPermission,
  hasRole,
  isStaffUser,
} from "../permissions"
import { canUseCapability, grantedCapabilities, CAPABILITIES } from "../role-config"
import type { CapabilityKey } from "../role-config"
import { useUser } from "./useUser"

/**
 * Central authorization hook. All UI authorization questions (navigation,
 * route protection, action visibility) should go through this hook so raw
 * role/permission strings never leak into components.
 *
 * Security note: these helpers only control UX. Every protected backend
 * operation is still enforced server-side by the platform ACL.
 */
export function useAuthorization() {
  const { user } = useUser()

  return useMemo(
    () => ({
      user,
      hasRole: (codename: string) => hasRole(user, codename),
      hasAnyRole: (codenames: readonly string[]) => hasAnyRole(user, codenames),
      hasPermission: (permission: Parameters<typeof hasPermission>[1]) => hasPermission(user, permission),
      hasAnyPermission: (permissions: readonly Parameters<typeof hasAnyPermission>[1][number][]) =>
        hasAnyPermission(user, permissions),
      isStaff: isStaffUser(user),
      /** Capability-based check (see role-config/capabilities). */
      can: (capability: CapabilityKey) => canUseCapability(user, capability),
      capabilities: grantedCapabilities(user),
    }),
    [user],
  )
}

export { CAPABILITIES }
export type { CapabilityKey }