import type { ReactNode } from "react"

import { AuthorizationGate, type AuthorizationGateProps } from "./AuthorizationGate"
import type { PermissionCode } from "../permissions"

export interface RequireAnyPermissionProps extends Omit<AuthorizationGateProps, "requiredPermissions"> {
  children: ReactNode
  permissions: readonly PermissionCode[]
}

/** Requires authentication AND at least one of the listed permissions. */
export function RequireAnyPermission({ permissions, children, ...rest }: RequireAnyPermissionProps) {
  return (
    <AuthorizationGate anyOfPermissions={permissions} {...rest}>
      {children}
    </AuthorizationGate>
  )
}