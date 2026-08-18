import type { ReactNode } from "react"
import { Navigate, useLocation } from "react-router-dom"

import { Loading } from "@/components/ui/loading"
import { hasAnyRole } from "../permissions"
import type { PermissionCode } from "../permissions"
import { useUser } from "../hooks/useUser"

export interface AuthorizationGateProps {
  children: ReactNode
  /** All of these permissions are required. */
  requiredPermissions?: readonly PermissionCode[]
  /** Any of these permissions is sufficient. Mutually exclusive with
   * requiredPermissions. */
  anyOfPermissions?: readonly PermissionCode[]
  /** User must hold one of these primary role codenames. */
  requiredRoles?: readonly string[]
  /** Backend keeps writable CMS/media/admin surfaces staff-only; mirror that
   * gate so non-staff roles are not invited into read-only dead ends. */
  staffOnly?: boolean
}

/**
 * Reusable authorization gate shared by every workspace guard.
 *
 * - loading        → full-screen loader
 * - guest          → /login, remembering the requested path
 * - session-expired→ /session-expired
 * - authenticated but not authorized → /unauthorized (403-style UX)
 * - authorized     → children
 *
 * Avoids redirect loops: the fallback routes (/login, /unauthorized,
 * /session-expired) are themselves unguarded.
 */
export function AuthorizationGate({
  children,
  requiredPermissions,
  anyOfPermissions,
  requiredRoles,
  staffOnly,
}: AuthorizationGateProps) {
  const { status, user } = useUser()
  const location = useLocation()

  if (status === "loading") return <Loading fullScreen />

  if (status === "session-expired") {
    return <Navigate to="/session-expired" replace />
  }

  if (status !== "authenticated" || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  const allowed =
    (!requiredPermissions || requiredPermissions.every((permission) => user.permissions.includes(permission))) &&
    (!anyOfPermissions || anyOfPermissions.some((permission) => user.permissions.includes(permission))) &&
    (!requiredRoles || hasAnyRole(user, requiredRoles)) &&
    (!staffOnly || Boolean(user.is_staff))

  if (!allowed) {
    return <Navigate to="/unauthorized" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}