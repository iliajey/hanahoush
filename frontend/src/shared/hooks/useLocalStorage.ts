import { useCallback, useState } from "react"

/**
 * React state synced with localStorage.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const readValue = useCallback((): T => {
    if (typeof window === "undefined") return initialValue
    try {
      const item = window.localStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : initialValue
    } catch {
      return initialValue
    }
  }, [key, initialValue])

  const [storedValue, setStoredValue] = useState<T>(readValue)

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next = typeof value === "function" ? (value as (p: T) => T)(prev) : value
        try {
          window.localStorage.setItem(key, JSON.stringify(next))
        } catch {
          /* ignore storage errors */
        }
        return next
      })
    },
    [key],
  )

  const removeValue = useCallback(() => {
    setStoredValue(initialValue)
    try {
      window.localStorage.removeItem(key)
    } catch {
      /* ignore storage errors */
    }
  }, [key, initialValue])

  return [storedValue, setValue, removeValue] as const
}
