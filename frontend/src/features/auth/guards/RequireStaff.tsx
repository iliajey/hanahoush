import type { ReactNode } from "react"

import { AuthorizationGate } from "./AuthorizationGate"

export interface RequireStaffProps {
  children: ReactNode
}

/** Requires authentication AND a staff flag (backend IsStaffOr* gate). */
export function RequireStaff({ children }: RequireStaffProps) {
  return <AuthorizationGate staffOnly>{children}</AuthorizationGate>
}