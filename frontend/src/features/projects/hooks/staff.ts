import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { invalidateCmsCache } from "@/features/cms/cache/invalidate"

import {
  addProjectGalleryImage,
  createStaffProject,
  fetchStaffProject,
  listProjectGallery,
  listStaffProjects,
  removeProjectGalleryImage,
  reorderProjectGallery,
  updateProjectGalleryImage,
  updateStaffProject,
  type ProjectGalleryPayload,
  type StaffProjectListParams,
  type StaffProjectPayload,
} from "../api/staff"

export const staffProjectKeys = {
  all: ["projects", "workspace"] as const,
  list: (params: StaffProjectListParams) => ["projects", "workspace", "list", params] as const,
  detail: (id: number) => ["projects", "workspace", "detail", id] as const,
  gallery: (id: number) => ["projects", "workspace", "gallery", id] as const,
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

/** Gallery rows for one project (normalized ProjectImage model). */
export function useProjectGallery(projectId: number | undefined) {
  return useQuery({
    queryKey: staffProjectKeys.gallery(projectId ?? 0),
    queryFn: () => listProjectGallery(projectId as number),
    enabled: projectId != null,
  })
}

function invalidateGallery(queryClient: ReturnType<typeof useQueryClient>, projectId: number | undefined) {
  queryClient.invalidateQueries({ queryKey: staffProjectKeys.gallery(projectId ?? 0) })
  queryClient.invalidateQueries({ queryKey: staffProjectKeys.detail(projectId ?? 0) })
  void invalidateCmsCache(queryClient)
}

export function useAddProjectGalleryImage(projectId: number | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ProjectGalleryPayload) => addProjectGalleryImage(projectId as number, payload),
    onSuccess: () => invalidateGallery(queryClient, projectId),
  })
}

export function useUpdateProjectGalleryImage(projectId: number | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ rowId, payload }: { rowId: number; payload: Partial<ProjectGalleryPayload> }) =>
      updateProjectGalleryImage(projectId as number, rowId, payload),
    onSuccess: () => invalidateGallery(queryClient, projectId),
  })
}

export function useRemoveProjectGalleryImage(projectId: number | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (rowId: number) => removeProjectGalleryImage(projectId as number, rowId),
    onSuccess: () => invalidateGallery(queryClient, projectId),
  })
}

export function useReorderProjectGallery(projectId: number | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (order: number[]) => reorderProjectGallery(projectId as number, order),
    onSuccess: () => invalidateGallery(queryClient, projectId),
  })
}