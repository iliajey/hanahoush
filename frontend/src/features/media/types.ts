import type { PaginationMeta } from "@/shared/types/api"

/** Media file record (staff media library API). */
export interface MediaFile {
  id: number
  file: string
  preview_url: string | null
  original_name: string
  title_fa: string
  title_en: string
  title_ar: string
  alt_text_fa: string
  alt_text_en: string
  alt_text_ar: string
  caption_fa: string
  caption_en: string
  caption_ar: string
  mime_type: string
  size: number
  width: number | null
  height: number | null
  sha256: string
  is_public: boolean
  uploader: string
  reference_count: number
  created_at: string
  updated_at: string
}

/** Multilingual metadata editable from the picker. */
export interface MediaMetadata {
  title_fa?: string
  title_en?: string
  title_ar?: string
  alt_text_fa?: string
  alt_text_en?: string
  alt_text_ar?: string
  caption_fa?: string
  caption_en?: string
  caption_ar?: string
  is_public?: boolean
}

export interface MediaListParams {
  page?: number
  pageSize?: number
  q?: string
  mime_type?: string
  is_image?: boolean
  ordering?: string
}

export interface MediaListResult {
  items: MediaFile[]
  pagination?: PaginationMeta
}

export function formatMediaSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${bytes} B`
}