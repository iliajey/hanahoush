/** Super Admin user-management domain types (Phase 11.5).
 *
 * Mirror of the backend payload (apps/accounts/api/admin_users.py). No
 * password material of any kind appears here — the backend never returns it.
 */
import type { RoleBrief } from "@/features/auth/types"

export interface ManagedUser {
  id: number
  username: string
  first_name: string
  last_name: string
  email: string
  phone: string
  role: RoleBrief | null
  permissions: string[]
  is_active: boolean
  is_staff: boolean
  is_superuser: boolean
  last_login: string | null
  date_joined: string
}

export interface RoleWithPermissions {
  id: number
  name: string
  codename: string
  description: string
  is_system: boolean
  permissions: Array<{ codename: string; name: string; module: string }>
}

export interface ManagedUserListParams {
  page?: number
  pageSize?: number
  search?: string
  role?: string
  isActive?: boolean
  isStaff?: boolean
  ordering?: string
}

/** Write payload for creating a user (password pair required). */
export interface CreateUserPayload {
  username: string
  first_name?: string
  last_name?: string
  email: string
  phone?: string
  password: string
  confirm_password: string
  role?: string | null
  is_active?: boolean
  is_staff?: boolean
}

/** Write payload for editing a user (no password material — use
 * `setUserPassword` for the controlled reset action). */
export interface UpdateUserPayload {
  username?: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  role?: string | null
  is_active?: boolean
  is_staff?: boolean
}

export interface SetPasswordPayload {
  new_password: string
  confirm_password: string
}
