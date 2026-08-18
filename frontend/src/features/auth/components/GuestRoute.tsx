import type { ReactNode } from "react"
import { Navigate } from "react-router-dom"

import { Loading } from "@/components/ui/loading"

import { useUser } from "../hooks/useUser"

/**
 * Guards routes for guests (login, forgot/reset password).
 *
 * - loading: shows a full-screen loader
 * - authenticated: redirects to /dashboard
 * - otherwise: renders the guest content
 */
export function GuestRoute({ children }: { readonly children: ReactNode }) {
  const { status } = useUser()

  if (status === "loading") return <Loading fullScreen />

  if (status === "authenticated") {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
