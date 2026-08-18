import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { invalidateCmsCache } from "@/features/cms/cache/invalidate"

import {
  createStaffArticle,
  fetchStaffArticle,
  listStaffArticles,
  updateStaffArticle,
  type StaffArticleListParams,
  type StaffArticlePayload,
} from "../api/staff"

export const staffArticleKeys = {
  all: ["articles", "workspace"] as const,
  list: (params: StaffArticleListParams) => ["articles", "workspace", "list", params] as const,
  detail: (id: number) => ["articles", "workspace", "detail", id] as const,
}

export function useStaffArticles(params: StaffArticleListParams) {
  return useQuery({
    queryKey: staffArticleKeys.list(params),
    queryFn: () => listStaffArticles(params),
  })
}

export function useStaffArticle(id: number | undefined) {
  return useQuery({
    queryKey: staffArticleKeys.detail(id ?? 0),
    queryFn: () => fetchStaffArticle(id as number),
    enabled: id != null,
  })
}

export function useCreateStaffArticle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: StaffArticlePayload) => createStaffArticle(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffArticleKeys.all })
      void invalidateCmsCache(queryClient)
    },
  })
}

export function useUpdateStaffArticle(id: number | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: StaffArticlePayload) => updateStaffArticle(id as number, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffArticleKeys.all })
      queryClient.invalidateQueries({ queryKey: staffArticleKeys.detail(id ?? 0) })
      void invalidateCmsCache(queryClient)
    },
  })
}