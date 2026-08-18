import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useToast } from "@/components/ui/toast"
import i18n from "@/i18n"

import { listMedia, softDeleteMedia, updateMedia, uploadMedia, type UploadResult } from "../api"
import type { MediaListParams, MediaMetadata } from "../types"

export const mediaKeys = {
  all: ["media"] as const,
  list: (params: MediaListParams) => ["media", "list", params] as const,
}

export function useMediaList(params: MediaListParams) {
  return useQuery({
    queryKey: mediaKeys.list(params),
    queryFn: () => listMedia(params),
  })
}

export function useUploadMedia() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation<UploadResult, Error, { file: File; metadata: MediaMetadata }>({
    mutationFn: ({ file, metadata }) => uploadMedia(file, metadata),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: mediaKeys.all })
      if (result.ok) {
        toast({ title: i18n.t("mediaWorkspace.uploadSuccess"), variant: "success" })
      } else {
        toast({ title: i18n.t("mediaWorkspace.uploadFailed"), description: result.message, variant: "error" })
      }
    },
  })
}

export function useUpdateMediaMetadata() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation<unknown, Error, { id: number; metadata: MediaMetadata }>({
    mutationFn: ({ id, metadata }) => updateMedia(id, metadata),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaKeys.all })
      toast({ title: i18n.t("mediaWorkspace.metadataSaved"), variant: "success" })
    },
  })
}

export function useDeleteMedia() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation<unknown, Error, number>({
    mutationFn: (id) => softDeleteMedia(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaKeys.all })
      toast({ title: i18n.t("mediaWorkspace.deleted"), variant: "success" })
    },
  })
}
