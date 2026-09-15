/** Staff service-management API (Phase 15.5). Reuses the existing service CMS
 * endpoints — no second service system. Writes are staff-only on the backend
 * (IsStaffOrReadOnly); the workspace is only reachable by staff roles. */
import { apiClient } from "@/shared/api/axiosClient"
import type { ApiEnvelope, PaginatedResponse } from "@/shared/types/api"

export type ServiceStatus = "draft" | "review" | "published" | "archived"

export interface StaffService {
  id: number
  title_fa: string
  title_en: string
  title_ar: string
  slug: string
  short_description_fa: string
  short_description_en: string
  short_description_ar: string
  status: ServiceStatus
  status_display: string
  is_published: boolean
  is_featured: boolean
  is_public: boolean
  published_at: string | null
  sort_order: number
  section: { id: number; title_fa: string; title_en: string; title_ar: string; slug: string } | null
  icon: string
  cover_image: { id: number; file: string; alt_text_en: string } | null
  created_at: string
  updated_at: string
}

export interface StaffServiceDetail extends StaffService {
  description_fa: string
  description_en: string
  description_ar: string
  meta_title: string
  meta_description: string
  meta_keywords: string
  canonical_url: string
  og_image?: { id: number; file: string } | null
}

export interface ServiceSectionSummary {
  id: number
  title_fa: string
  title_en: string
  title_ar: string
  slug: string
  services_count?: number
}

export interface StaffServiceListParams {
  page?: number
  pageSize?: number
  q?: string
  status?: ServiceStatus
  section?: number
  ordering?: string
  is_featured?: boolean
}

export interface StaffServicePayload {
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
  section?: number | null
  icon?: string
  cover_image?: number | null
  og_image?: number | null
  status?: ServiceStatus
  is_featured?: boolean
  is_public?: boolean
  published_at?: string | null
  sort_order?: number
  meta_title?: string
  meta_description?: string
  meta_keywords?: string
  canonical_url?: string
}

export interface StaffServiceListResult {
  items: StaffService[]
  pagination: PaginatedResponse<StaffService>["pagination"]
}

export async function listStaffServices(params: StaffServiceListParams = {}): Promise<StaffServiceListResult> {
  const query: Record<string, unknown> = { page_size: params.pageSize ?? 25 }
  if (params.page != null) query.page = params.page
  if (params.q) query.q = params.q
  if (params.status) query.status = params.status
  if (params.section != null) query.section = params.section
  if (params.ordering) query.ordering = params.ordering
  if (params.is_featured != null) query.is_featured = String(params.is_featured)

  const { data } = await apiClient.get<PaginatedResponse<StaffService>>("/services/", { params: query })
  return { items: data.data ?? [], pagination: data.pagination }
}

export async function fetchStaffService(id: number): Promise<StaffServiceDetail> {
  const { data } = await apiClient.get<ApiEnvelope<StaffServiceDetail>>(`/services/${id}/`)
  return data.data
}

export async function createStaffService(payload: StaffServicePayload): Promise<StaffService> {
  const { data } = await apiClient.post<ApiEnvelope<StaffService>>("/services/", payload)
  return data.data
}

export async function updateStaffService(id: number, payload: StaffServicePayload): Promise<StaffService> {
  const { data } = await apiClient.patch<ApiEnvelope<StaffService>>(`/services/${id}/`, payload)
  return data.data
}

export async function fetchServiceSectionsStaff(): Promise<ServiceSectionSummary[]> {
  const { data } = await apiClient.get<ApiEnvelope<ServiceSectionSummary[]>>("/service-sections/")
  return data.data ?? []
}
