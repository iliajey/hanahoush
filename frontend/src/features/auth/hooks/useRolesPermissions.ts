import { useQuery } from "@tanstack/react-query"

import { apiRequest } from "@/shared/api/axiosClient"

import type { Permission, Role } from "../types"

export function useRoles() {
  return useQuery({
    queryKey: ["auth", "roles"],
    queryFn: () => apiRequest<Role[]>({ method: "GET", url: "/auth/roles/" }),
    select: (data) => data.data,
    staleTime: 1000 * 60 * 5,
  })
}

export function usePermissions() {
  return useQuery({
    queryKey: ["auth", "permissions"],
    queryFn: () => apiRequest<Permission[]>({ method: "GET", url: "/auth/permissions/" }),
    select: (data) => data.data,
    staleTime: 1000 * 60 * 5,
  })
}
