import type { ReactNode } from "react"

import { AuthorizationGate, type AuthorizationGateProps } from "./AuthorizationGate"

export interface RequireRoleProps extends Omit<AuthorizationGateProps, "requiredRoles" | "anyOfPermissions"> {
  children: ReactNode
  roles: readonly string[]
}

/** Requires authentication AND membership in one of the role codenames. */
export function RequireRole({ roles, children, ...rest }: RequireRoleProps) {
  return (
    <AuthorizationGate requiredRoles={roles} {...rest}>
      {children}
    </AuthorizationGate>
  )
}