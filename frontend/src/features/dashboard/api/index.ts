import { apiClient } from "@/shared/api/axiosClient"
import type { ApiEnvelope } from "@/shared/types/api"

import type { OperationalDashboard } from "../types"

/** Fetch the operational dashboard (staff-only endpoint). */
export async function fetchOperationalDashboard(signal?: AbortSignal): Promise<OperationalDashboard> {
  const { data } = await apiClient.get<ApiEnvelope<OperationalDashboard>>("/api/v1/admin/dashboard/", {
    signal,
  })
  return data.data
}