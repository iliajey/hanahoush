import axios from "axios"
import type {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios"

import type { ApiEnvelope, ApiError, TokenRefreshEnvelope } from "../types/api"

import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "./tokenStorage"

export type LoadingListener = (active: boolean) => void
export type ErrorListener = (error: ApiError) => void
export type AuthFailureListener = () => void

interface RefreshableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

/** Auth requests whose 401 is a credentials/validation failure, not an
 * expired access token — they must never trigger the refresh flow. */
const NO_REFRESH_URLS = new Set([
  "/api/v1/auth/login/",
  "/api/v1/auth/refresh/",
  "/api/v1/auth/password-reset/",
  "/api/v1/auth/password-reset/confirm/",
])

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
})

/** Normalize any axios error into the standard ApiError envelope. */
export function toApiError(error: unknown): ApiError {
  const axiosError = error as AxiosError<ApiError | { detail?: unknown }>
  const body = axiosError?.response?.data
  if (body && typeof body === "object" && "success" in body) {
    return body as ApiError
  }
  return {
    success: false,
    message:
      axiosError?.response?.status === 401
        ? "Unauthorized"
        : axiosError?.message || "Network error",
    data: null,
    errors: null,
  }
}

// ---------------------------------------------------------------------------
// Event bus (consumed by AxiosProvider + AuthProvider)
// ---------------------------------------------------------------------------
let pending = 0
const loadingListeners = new Set<LoadingListener>()
const errorListeners = new Set<ErrorListener>()
const authFailureListeners = new Set<AuthFailureListener>()

function notifyLoading(active: boolean) {
  loadingListeners.forEach((listener) => listener(active))
}

export function onLoading(listener: LoadingListener): () => void {
  loadingListeners.add(listener)
  return () => loadingListeners.delete(listener)
}

export function onApiError(listener: ErrorListener): () => void {
  errorListeners.add(listener)
  return () => errorListeners.delete(listener)
}

/** Called when a token refresh fails and the session must end. */
export function onAuthFailure(listener: AuthFailureListener): () => void {
  authFailureListeners.add(listener)
  return () => authFailureListeners.delete(listener)
}

function notifyAuthFailure() {
  clearTokens()
  authFailureListeners.forEach((listener) => listener())
}

// ---------------------------------------------------------------------------
// Request interceptor: attach the access token
// ---------------------------------------------------------------------------
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  pending += 1
  notifyLoading(true)

  const token = getAccessToken()
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`)
  }
  return config
})

// ---------------------------------------------------------------------------
// Response interceptor: error normalization + transparent token refresh
// ---------------------------------------------------------------------------
let isRefreshing = false
let pendingQueue: Array<() => void> = []

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    pending = Math.max(0, pending - 1)
    notifyLoading(false)
    return response
  },
  async (error: AxiosError) => {
    pending = Math.max(0, pending - 1)
    notifyLoading(false)

    const config = error.config as RefreshableConfig | undefined
    const status = error.response?.status

    // Transparent refresh: retry the request once with a new access token.
    const refreshable = config && !config._retry && getRefreshToken() && !NO_REFRESH_URLS.has(config.url ?? "")
    if (status === 401 && refreshable) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push(() => {
            apiClient(config).then(resolve).catch(reject)
          })
        })
      }

      config._retry = true
      isRefreshing = true
      try {
        const { data } = await apiClient.post<ApiEnvelope<TokenRefreshEnvelope>>(
          "/api/v1/auth/refresh/",
          { refresh: getRefreshToken() },
          { _retry: true } as RefreshableConfig,
        )
        const tokenData = data?.data
        if (!tokenData?.access) {
          throw new Error("Refresh response missing access token")
        }
        setTokens(tokenData.access, tokenData.refresh ?? (getRefreshToken() ?? ""))

        pendingQueue.forEach((flush) => flush())
        pendingQueue = []
        return apiClient(config)
      } catch (refreshError) {
        notifyAuthFailure()
        pendingQueue = []
        errorListeners.forEach((listener) => listener(toApiError(refreshError)))
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    const normalized = toApiError(error)
    errorListeners.forEach((listener) => listener(normalized))
    return Promise.reject(error)
  },
)

/** Request helper typed against the standard envelope. */
export async function apiRequest<T>(config: AxiosRequestConfig): Promise<ApiEnvelope<T>> {
  try {
    const response = await apiClient.request<ApiEnvelope<T>>(config)
    return response.data
  } catch (error) {
    throw toApiError(error)
  }
}
