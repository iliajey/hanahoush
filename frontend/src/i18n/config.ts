export const SUPPORTED_LOCALES = ["fa", "en", "ar"] as const
export type Locale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: Locale = "fa"

export function getInitialLocale(): Locale {
  const stored = getLocalStorageLocale()
  if (stored && SUPPORTED_LOCALES.includes(stored)) return stored

  const nav = (navigator.languages ?? []).find(
    (l): l is Locale => SUPPORTED_LOCALES.includes(l.slice(0, 2) as Locale),
  )
  return nav ?? DEFAULT_LOCALE
}

function getLocalStorageLocale(): Locale | null {
  try {
    const value = window.localStorage.getItem("hanahoush-language")
    if (value === "fa" || value === "en" || value === "ar") return value
  } catch {
    /* ignore storage errors */
  }
  return null
}
