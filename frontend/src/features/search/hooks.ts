import { useEffect, useState } from "react"

import { useLanguage } from "@/app/language/useLanguage"
import { useCmsQuery } from "@/features/cms/hooks/useCmsQuery"

import { fetchSearch } from "./api"
import { SEARCH_MIN_LENGTH, type SearchParams, type SearchResponse } from "./types"

/** Debounce an arbitrary value (default 350ms like the rest of the app). */
export function useDebouncedValue<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

/**
 * Unified site search hook (locale-scoped, React Query cache). Disabled until
 * the query meets the minimum length so short queries never hit the API.
 */
export function useGlobalSearch(params: SearchParams): ReturnType<typeof useCmsQuery<SearchResponse>> {
  const { language } = useLanguage()
  const q = params.q?.trim() ?? ""
  const enabled = q.length >= SEARCH_MIN_LENGTH
  return useCmsQuery<SearchResponse>(
    ["search", language, params],
    () => fetchSearch({ ...params, locale: language }),
    { tier: "listings", description: "GET /api/v1/search/?q=" },
    { enabled },
  )
}