/** Authentication & authorization domain types. */

export interface RoleBrief {
  id: number
  name: string
  codename: string
}

export interface UserProfile {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  phone: string
  preferred_language: "fa" | "en" | "ar"
  is_active: boolean
  is_staff: boolean
  role: RoleBrief | null
  permissions: string[]
  date_joined: string
}

export interface LoginResponse {
  access: string
  refresh: string
  user: UserProfile
}

export interface TokenRefreshResponse {
  access: string
  refresh?: string
}

export interface LoginPayload {
  username: string
  password: string
  remember_me?: boolean
}

export interface ChangePasswordPayload {
  old_password: string
  new_password: string
  confirm_password: string
}

export interface ProfilePayload {
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  preferred_language?: "fa" | "en" | "ar"
}

export interface PasswordResetRequestPayload {
  email: string
}

export interface PasswordResetConfirmPayload {
  uid: string
  token: string
  new_password: string
}

export interface Role {
  id: number
  name: string
  codename: string
  description: string
  is_system: boolean
  permission_count: number
}

export interface Permission {
  id: number
  name: string
  codename: string
  module: string
  description: string
}

export type AuthStatus = "loading" | "authenticated" | "guest" | "session-expired"
