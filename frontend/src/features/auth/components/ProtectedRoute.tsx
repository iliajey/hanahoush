import type { ReactNode } from "react"
import { Navigate, useLocation } from "react-router-dom"

import { Loading } from "@/components/ui/loading"

import { useUser } from "../hooks/useUser"

/**
 * Guards routes that require authentication.
 *
 * - loading: shows a full-screen loader
 * - session-expired: redirects to /session-expired
 * - guest: redirects to /login, remembering the original location
 * - authenticated: renders the protected content
 */
export function ProtectedRoute({ children }: { readonly children: ReactNode }) {
  const { status } = useUser()
  const location = useLocation()

  if (status === "loading") return <Loading fullScreen />

  if (status === "session-expired") {
    return <Navigate to="/session-expired" replace />
  }

  if (status !== "authenticated") {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}
