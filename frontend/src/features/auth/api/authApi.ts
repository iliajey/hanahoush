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
  TokenRefreshResponse,
  UserProfile,
} from "../types"

export function login(payload: LoginPayload): Promise<ApiEnvelope<LoginResponse>> {
  return apiRequest<LoginResponse>({ method: "POST", url: "/api/v1/auth/login/", data: payload })
}

export function logout(refreshToken: string): Promise<ApiEnvelope<null>> {
  return apiRequest<null>({ method: "POST", url: "/api/v1/auth/logout/", data: { refresh: refreshToken } })
}

export function refreshToken(refresh: string): Promise<ApiEnvelope<TokenRefreshResponse>> {
  return apiRequest<TokenRefreshResponse>({ method: "POST", url: "/api/v1/auth/refresh/", data: { refresh } })
}

export function fetchMe(): Promise<ApiEnvelope<UserProfile>> {
  return apiRequest<UserProfile>({ method: "GET", url: "/api/v1/auth/me/" })
}

export function updateProfile(payload: ProfilePayload): Promise<ApiEnvelope<UserProfile>> {
  return apiRequest<UserProfile>({ method: "PATCH", url: "/api/v1/auth/profile/", data: payload })
}

export function changePassword(payload: ChangePasswordPayload): Promise<ApiEnvelope<null>> {
  return apiRequest<null>({ method: "POST", url: "/api/v1/auth/change-password/", data: payload })
}

export function requestPasswordReset(payload: PasswordResetRequestPayload): Promise<ApiEnvelope<null>> {
  return apiRequest<null>({ method: "POST", url: "/api/v1/auth/password-reset/", data: payload })
}

export function confirmPasswordReset(payload: PasswordResetConfirmPayload): Promise<ApiEnvelope<null>> {
  return apiRequest<null>({
    method: "POST",
    url: "/api/v1/auth/password-reset/confirm/",
    data: payload,
  })
}
