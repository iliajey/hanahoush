/** Staff contact-request management API (Phase 8G / 9G). Reads and lifecycle
 * updates go through the staff-only endpoint (/api/v1/admin/contact/); the
 * public submit API remains untouched. */
import { apiClient } from "@/shared/api/axiosClient"
import type { ApiEnvelope, PaginatedResponse } from "@/shared/types/api"

export type ContactStatus = "new" | "in_progress" | "resolved" | "closed" | "spam"

export interface AdminContact {
  id: number
  request_id: string
  name: string
  email: string
  phone: string
  company: string
  subject: string
  service_category: string
  project_type: string
  budget_range: string
  preferred_contact: string
  message: string
  consent: boolean
  locale: string
  source: string
  status: ContactStatus
  handled_by: string | null
  handled_at: string | null
  created_at: string
}

export interface ContactListParams {
  page?: number
  pageSize?: number
  q?: string
  status?: ContactStatus
  source?: string
  locale?: string
  ordering?: string
}

export interface ContactListResult {
  items: AdminContact[]
  pagination: PaginatedResponse<AdminContact>["pagination"]
}

export async function listContacts(params: ContactListParams = {}): Promise<ContactListResult> {
  const query: Record<string, unknown> = { page_size: params.pageSize ?? 25 }
  if (params.page != null) query.page = params.page
  if (params.q) query.q = params.q
  if (params.status) query.status = params.status
  if (params.source) query.source = params.source
  if (params.locale) query.locale = params.locale
  if (params.ordering) query.ordering = params.ordering

  const { data } = await apiClient.get<PaginatedResponse<AdminContact>>("/api/v1/admin/contact/", { params: query })
  return { items: data.data ?? [], pagination: data.pagination }
}

export async function updateContactStatus(id: number, status: ContactStatus): Promise<AdminContact> {
  const { data } = await apiClient.patch<ApiEnvelope<AdminContact>>(`/api/v1/admin/contact/${id}/`, { status })
  return data.data
}

export async function markContactHandled(id: number): Promise<{ id: number }> {
  const { data } = await apiClient.post<ApiEnvelope<{ id: number }>>(`/api/v1/admin/contact/${id}/mark-handled/`)
  return data.data
}