import type { ReactNode } from "react"

import { AuthorizationGate, type AuthorizationGateProps } from "./AuthorizationGate"

export interface RequireSuperAdminProps extends Omit<AuthorizationGateProps, "superAdminOnly" | "requiredRoles" | "anyOfPermissions" | "requiredPermissions"> {
  children: ReactNode
}

/** Requires authentication AND the backend's Super Admin rule (Django
 * superuser OR the SUPER_ADMIN primary role) — mirrors IsSuperAdmin. */
export function RequireSuperAdmin({ children, ...rest }: RequireSuperAdminProps) {
  return (
    <AuthorizationGate superAdminOnly {...rest}>
      {children}
    </AuthorizationGate>
  )
}
