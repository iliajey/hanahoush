import type { ReactNode } from "react"

import { AuthorizationGate, type AuthorizationGateProps } from "./AuthorizationGate"
import type { PermissionCode } from "../permissions"

export interface RequirePermissionProps extends Omit<AuthorizationGateProps, "anyOfPermissions"> {
  children: ReactNode
  permissions: readonly PermissionCode[]
}

/** Requires authentication AND all listed permissions. */
export function RequirePermission({ permissions, children, ...rest }: RequirePermissionProps) {
  return (
    <AuthorizationGate requiredPermissions={permissions} {...rest}>
      {children}
    </AuthorizationGate>
  )
}