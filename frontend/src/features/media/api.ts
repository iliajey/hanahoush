import { apiClient, toApiError } from "@/shared/api/axiosClient"
import type { ApiEnvelope, PaginatedResponse } from "@/shared/types/api"

import { mediaAnalytics } from "../analytics/domains"
import type { MediaFile, MediaListParams, MediaListResult, MediaMetadata } from "./types"

export { mediaAnalytics } from "../analytics/domains"

/**
 * Staff media library API client (authenticated). All endpoints require a
 * valid admin session — the shared axios client attaches the JWT.
 */

export async function listMedia(params: MediaListParams): Promise<MediaListResult> {
  const query: Record<string, unknown> = { page_size: params.pageSize ?? 24 }
  if (params.page != null) query.page = params.page
  if (params.q) query.q = params.q
  if (params.mime_type) query.mime_type = params.mime_type
  if (params.is_image != null) query.is_image = String(params.is_image)
  if (params.ordering) query.ordering = params.ordering

  const { data } = await apiClient.get<PaginatedResponse<MediaFile>>("/media/", { params: query })
  return { items: data.data ?? [], pagination: data.pagination }
}

export interface UploadResult {
  ok: boolean
  media?: MediaFile
  message?: string
  errors?: unknown
}

export async function uploadMedia(
  file: File,
  metadata: MediaMetadata = {},
  onProgress?: (percent: number) => void,
): Promise<UploadResult> {
  const form = new FormData()
  form.append("file", file)
  form.append("title_fa", metadata.title_fa ?? "")
  form.append("title_en", metadata.title_en ?? "")
  form.append("title_ar", metadata.title_ar ?? "")
  form.append("alt_text_fa", metadata.alt_text_fa ?? "")
  form.append("alt_text_en", metadata.alt_text_en ?? "")
  form.append("alt_text_ar", metadata.alt_text_ar ?? "")
  form.append("caption_fa", metadata.caption_fa ?? "")
  form.append("caption_en", metadata.caption_en ?? "")
  form.append("caption_ar", metadata.caption_ar ?? "")
  form.append("is_public", String(metadata.is_public ?? true))

  try {
    const response = await apiClient.post<ApiEnvelope<MediaFile>>("/media/", form, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (event) => {
        if (event.total) onProgress?.(Math.round((event.loaded / event.total) * 100))
      },
    })
    mediaAnalytics.upload(true)
    return { ok: true, media: response.data.data }
  } catch (error) {
    mediaAnalytics.upload(false)
    const apiError = toApiError(error)
    return { ok: false, message: apiError.message, errors: apiError.errors }
  }
}

export async function updateMedia(id: number, metadata: MediaMetadata): Promise<MediaFile> {
  const { data } = await apiClient.patch<ApiEnvelope<MediaFile>>(`/media/${id}/`, metadata)
  return data.data
}

/** Soft-delete (safe): the row is hidden but restorable. */
export async function softDeleteMedia(id: number): Promise<void> {
  await apiClient.delete(`/media/${id}/`)
}