import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { invalidateCmsCache } from "@/features/cms/cache/invalidate"

import {
  createStaffService,
  fetchServiceSectionsStaff,
  fetchStaffService,
  listStaffServices,
  updateStaffService,
  type StaffServiceListParams,
  type StaffServicePayload,
} from "../api/staff"

export const staffServiceKeys = {
  all: ["services", "workspace"] as const,
  list: (params: StaffServiceListParams) => ["services", "workspace", "list", params] as const,
  detail: (id: number) => ["services", "workspace", "detail", id] as const,
  sections: ["services", "workspace", "sections"] as const,
}

export function useStaffServices(params: StaffServiceListParams) {
  return useQuery({
    queryKey: staffServiceKeys.list(params),
    queryFn: () => listStaffServices(params),
  })
}

export function useStaffService(id: number | undefined) {
  return useQuery({
    queryKey: staffServiceKeys.detail(id ?? 0),
    queryFn: () => fetchStaffService(id as number),
    enabled: id != null,
  })
}

export function useServiceSectionsStaff() {
  return useQuery({
    queryKey: staffServiceKeys.sections,
    queryFn: () => fetchServiceSectionsStaff(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateStaffService() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: StaffServicePayload) => createStaffService(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffServiceKeys.all })
      void invalidateCmsCache(queryClient)
    },
  })
}

export function useUpdateStaffService(id: number | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: StaffServicePayload) => updateStaffService(id as number, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffServiceKeys.all })
      queryClient.invalidateQueries({ queryKey: staffServiceKeys.detail(id ?? 0) })
      void invalidateCmsCache(queryClient)
    },
  })
}
