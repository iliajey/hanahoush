import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"

import type { ApiError } from "../types/api"

import { apiClient, onApiError, onLoading, toApiError } from "./axiosClient"

interface AxiosProviderState {
  /** Shared axios instance (request helper: `apiClient.request`). */
  client: typeof apiClient
  /** True while at least one request is in flight. */
  isLoading: boolean
  /** Last normalized error (cleared on the next successful request). */
  error: ApiError | null
  /** Clear the stored error. */
  clearError: () => void
}

const AxiosProviderContext = createContext<AxiosProviderState>({
  client: apiClient,
  isLoading: false,
  error: null,
  clearError: () => undefined,
})

export function useAxios() {
  const context = useContext(AxiosProviderContext)
  if (!context) {
    throw new Error("useAxios must be used within an AxiosProvider")
  }
  return context
}

export default function AxiosProvider({ children }: { readonly children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  useEffect(() => {
    const unsubscribeLoading = onLoading((active) => setIsLoading(active))
    const unsubscribeError = onApiError((err) => setError(err))
    return () => {
      unsubscribeLoading()
      unsubscribeError()
    }
  }, [])

  const clearError = useCallback(() => setError(null), [])

  const value = useMemo(
    () => ({ client: apiClient, isLoading, error, clearError }),
    [isLoading, error, clearError],
  )

  return <AxiosProviderContext.Provider value={value}>{children}</AxiosProviderContext.Provider>
}

export { toApiError }
