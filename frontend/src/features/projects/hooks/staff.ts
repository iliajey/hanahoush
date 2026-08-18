import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { invalidateCmsCache } from "@/features/cms/cache/invalidate"

import {
  createStaffProject,
  fetchStaffProject,
  listStaffProjects,
  updateStaffProject,
  type StaffProjectListParams,
  type StaffProjectPayload,
} from "../api/staff"

export const staffProjectKeys = {
  all: ["projects", "workspace"] as const,
  list: (params: StaffProjectListParams) => ["projects", "workspace", "list", params] as const,
  detail: (id: number) => ["projects", "workspace", "detail", id] as const,
}

export function useStaffProjects(params: StaffProjectListParams) {
  return useQuery({
    queryKey: staffProjectKeys.list(params),
    queryFn: () => listStaffProjects(params),
  })
}

export function useStaffProject(id: number | undefined) {
  return useQuery({
    queryKey: staffProjectKeys.detail(id ?? 0),
    queryFn: () => fetchStaffProject(id as number),
    enabled: id != null,
  })
}

export function useCreateStaffProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: StaffProjectPayload) => createStaffProject(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffProjectKeys.all })
      void invalidateCmsCache(queryClient)
    },
  })
}

export function useUpdateStaffProject(id: number | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: StaffProjectPayload) => updateStaffProject(id as number, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffProjectKeys.all })
      queryClient.invalidateQueries({ queryKey: staffProjectKeys.detail(id ?? 0) })
      void invalidateCmsCache(queryClient)
    },
  })
}