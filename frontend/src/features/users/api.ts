/** Super Admin user-management API client (Phase 11.5).
 *
 * Talks to the backend account-management surface (/api/v1/admin/users/)
 * which enforces IsSuperAdmin on every operation — the frontend never decides
 * authorization, it only mirrors the gate for navigation.
 */
import { apiClient } from "@/shared/api/axiosClient"
import type { ApiEnvelope, PaginatedResponse } from "@/shared/types/api"

import type {
  CreateUserPayload,
  ManagedUser,
  ManagedUserListParams,
  RoleWithPermissions,
  SetPasswordPayload,
  UpdateUserPayload,
} from "./types"

const BASE = "/admin/users/"

export interface ManagedUserListResult {
  items: ManagedUser[]
  pagination: PaginatedResponse<ManagedUser>["pagination"]
}

export async function listUsers(params: ManagedUserListParams = {}): Promise<ManagedUserListResult> {
  const query: Record<string, unknown> = { page_size: params.pageSize ?? 20 }
  if (params.page != null) query.page = params.page
  if (params.search) query.search = params.search
  if (params.role) query.role = params.role
  if (params.isActive != null) query.is_active = String(params.isActive)
  if (params.isStaff != null) query.is_staff = String(params.isStaff)
  if (params.ordering) query.ordering = params.ordering

  const { data } = await apiClient.get<PaginatedResponse<ManagedUser>>(BASE, { params: query })
  return { items: data.data ?? [], pagination: data.pagination }
}

export async function fetchUser(id: number): Promise<ManagedUser> {
  const { data } = await apiClient.get<ApiEnvelope<ManagedUser>>(`${BASE}${id}/`)
  return data.data
}

export async function createUser(payload: CreateUserPayload): Promise<ManagedUser> {
  const { data } = await apiClient.post<ApiEnvelope<ManagedUser>>(BASE, payload)
  return data.data
}

export async function updateUser(id: number, payload: UpdateUserPayload): Promise<ManagedUser> {
  const { data } = await apiClient.patch<ApiEnvelope<ManagedUser>>(`${BASE}${id}/`, payload)
  return data.data
}

/** Controlled password reset — write-only input, sessions revoked backend-side. */
export async function setUserPassword(id: number, payload: SetPasswordPayload): Promise<void> {
  await apiClient.post<ApiEnvelope<null>>(`${BASE}${id}/set-password/`, payload)
}

export async function activateUser(id: number): Promise<ManagedUser> {
  const { data } = await apiClient.post<ApiEnvelope<ManagedUser>>(`${BASE}${id}/activate/`)
  return data.data
}

export async function deactivateUser(id: number): Promise<ManagedUser> {
  const { data } = await apiClient.post<ApiEnvelope<ManagedUser>>(`${BASE}${id}/deactivate/`)
  return data.data
}

/** Role catalog with full permission lists — feeds the read-only permission
 * viewer. Roles always come from the backend; the frontend never invents one. */
export async function fetchRoleCatalog(): Promise<RoleWithPermissions[]> {
  const { data } = await apiClient.get<ApiEnvelope<RoleWithPermissions[]>>(`${BASE}roles/`)
  return data.data ?? []
}
