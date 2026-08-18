import { useCallback, useRef, useState } from "react"

import type { ApiEnvelope, ApiError } from "../types/api"

import { apiRequest, toApiError } from "./axiosClient"
import { useAxios } from "./AxiosProvider"

interface UseApiResult<T> {
  data: T | null
  isLoading: boolean
  error: ApiError | null
  request: (config: Parameters<typeof apiRequest<T>>[0]) => Promise<T>
  reset: () => void
}

/**
 * Imperative API hook: executes an axios request and tracks loading/error.
 *
 * Prefer @tanstack/react-query for server-state reads; this hook is for
 * one-off actions (e.g. form submissions, manual triggers).
 */
export function useApi<T = unknown>(): UseApiResult<T> {
  const { clearError } = useAxios()
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  const mounted = useRef(true)

  const request = useCallback(
    async (config: Parameters<typeof apiRequest<T>>[0]): Promise<T> => {
      setIsLoading(true)
      setError(null)
      clearError()
      try {
        const envelope: ApiEnvelope<T> = await apiRequest<T>(config)
        if (!mounted.current) return envelope.data
        setData(envelope.data)
        return envelope.data
      } catch (err) {
        const normalized = toApiError(err)
        if (mounted.current) setError(normalized)
        throw normalized
      } finally {
        if (mounted.current) setIsLoading(false)
      }
    },
    [clearError],
  )

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setIsLoading(false)
  }, [])

  return { data, isLoading, error, request, reset }
}
