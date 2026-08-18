import { useQuery } from "@tanstack/react-query"

import { useUser } from "@/features/auth/hooks/useUser"

import { fetchOperationalDashboard } from "../api"
import type { OperationalDashboard } from "../types"

export const dashboardKeys = {
  all: ["dashboard"] as const,
  operational: ["dashboard", "operational"] as const,
}

/**
 * Operational dashboard data. Only fetched for staff users — the endpoint is
 * staff-only and we must not expose its payload to non-staff roles. Editor and
 * Viewer fall back to the role-aware overview rendered by DashboardPage.
 */
export function useOperationalDashboard() {
  const { user } = useUser()
  return useQuery<OperationalDashboard>({
    queryKey: dashboardKeys.operational,
    queryFn: ({ signal }) => fetchOperationalDashboard(signal),
    enabled: Boolean(user?.is_staff),
    staleTime: 1000 * 30,
  })
}