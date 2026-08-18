/** Staff project-management API (Phase 9G). Reuses the existing project CMS
 * endpoints — no second project system. Writes are staff-only on the backend
 * (IsStaffOrReadOnly). */
import { apiClient } from "@/shared/api/axiosClient"
import type { ApiEnvelope, PaginatedResponse } from "@/shared/types/api"

export type ProjectStatus = "draft" | "review" | "published" | "archived"

export interface StaffProject {
  id: number
  title_fa: string
  title_en: string
  title_ar: string
  slug: string
  short_description_fa: string
  short_description_en: string
  short_description_ar: string
  client: string
  location: string
  live_url: string
  start_date: string | null
  end_date: string | null
  year: number | null
  status: ProjectStatus
  status_display: string
  is_published: boolean
  is_featured: boolean
  is_public: boolean
  category: { id: number; title_fa: string; title_en: string; slug: string } | null
  technologies: Array<{ id: number; title_en: string; slug: string }>
  cover_image: { id: number; file: string; alt_text_en: string } | null
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface StaffProjectDetail extends StaffProject {
  description_fa: string
  description_en: string
  description_ar: string
  meta_title: string
  meta_description: string
}

export interface StaffProjectListParams {
  page?: number
  pageSize?: number
  q?: string
  status?: ProjectStatus
  ordering?: string
}

export interface StaffProjectPayload {
  title_fa?: string
  title_en?: string
  title_ar?: string
  slug?: string
  short_description_fa?: string
  short_description_en?: string
  short_description_ar?: string
  description_fa?: string
  description_en?: string
  description_ar?: string
  client?: string
  location?: string
  start_date?: string | null
  end_date?: string | null
  live_url?: string
  status?: ProjectStatus
  is_featured?: boolean
  is_public?: boolean
  cover_image?: number | null
  published_at?: string | null
}

export interface StaffProjectListResult {
  items: StaffProject[]
  pagination: PaginatedResponse<StaffProject>["pagination"]
}

export async function listStaffProjects(params: StaffProjectListParams = {}): Promise<StaffProjectListResult> {
  const query: Record<string, unknown> = { page_size: params.pageSize ?? 25 }
  if (params.page != null) query.page = params.page
  if (params.q) query.q = params.q
  if (params.status) query.status = params.status
  if (params.ordering) query.ordering = params.ordering

  const { data } = await apiClient.get<PaginatedResponse<StaffProject>>("/api/v1/projects/", { params: query })
  return { items: data.data ?? [], pagination: data.pagination }
}

export async function fetchStaffProject(id: number): Promise<StaffProjectDetail> {
  const { data } = await apiClient.get<ApiEnvelope<StaffProjectDetail>>(`/api/v1/projects/${id}/`)
  return data.data
}

export async function createStaffProject(payload: StaffProjectPayload): Promise<StaffProject> {
  const { data } = await apiClient.post<ApiEnvelope<StaffProject>>("/api/v1/projects/", payload)
  return data.data
}

export async function updateStaffProject(id: number, payload: StaffProjectPayload): Promise<StaffProject> {
  const { data } = await apiClient.patch<ApiEnvelope<StaffProject>>(`/api/v1/projects/${id}/`, payload)
  return data.data
}