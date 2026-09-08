/** Auth API functions — thin typed wrappers over the axios client. */
import { apiRequest } from "@/shared/api/axiosClient"
import type { ApiEnvelope } from "@/shared/types/api"

import type {
  ChangePasswordPayload,
  LoginPayload,
  LoginResponse,
  PasswordResetConfirmPayload,
  PasswordResetRequestPayload,
  ProfilePayload,
  RegisterPayload,
  RegisterResponse,
  TokenRefreshResponse,
  UserProfile,
} from "../types"

export function register(payload: RegisterPayload): Promise<ApiEnvelope<RegisterResponse>> {
  return apiRequest<RegisterResponse>({ method: "POST", url: "/auth/register/", data: payload })
}

export function login(payload: LoginPayload): Promise<ApiEnvelope<LoginResponse>> {
  return apiRequest<LoginResponse>({ method: "POST", url: "/auth/login/", data: payload })
}

export function logout(refreshToken: string): Promise<ApiEnvelope<null>> {
  return apiRequest<null>({ method: "POST", url: "/auth/logout/", data: { refresh: refreshToken } })
}

export function refreshToken(refresh: string): Promise<ApiEnvelope<TokenRefreshResponse>> {
  return apiRequest<TokenRefreshResponse>({ method: "POST", url: "/auth/refresh/", data: { refresh } })
}

export function fetchMe(): Promise<ApiEnvelope<UserProfile>> {
  return apiRequest<UserProfile>({ method: "GET", url: "/auth/me/" })
}

export function updateProfile(payload: ProfilePayload): Promise<ApiEnvelope<UserProfile>> {
  return apiRequest<UserProfile>({ method: "PATCH", url: "/auth/profile/", data: payload })
}

export function changePassword(payload: ChangePasswordPayload): Promise<ApiEnvelope<null>> {
  return apiRequest<null>({ method: "POST", url: "/auth/change-password/", data: payload })
}

export function requestPasswordReset(payload: PasswordResetRequestPayload): Promise<ApiEnvelope<null>> {
  return apiRequest<null>({ method: "POST", url: "/auth/password-reset/", data: payload })
}

export function confirmPasswordReset(payload: PasswordResetConfirmPayload): Promise<ApiEnvelope<null>> {
  return apiRequest<null>({
    method: "POST",
    url: "/auth/password-reset/confirm/",
    data: payload,
  })
}
