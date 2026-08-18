import { useCallback, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"

import i18n from "../../i18n"

import {
  DEFAULT_LANGUAGE,
  LANGUAGES,
  LANGUAGE_KEY,
  LanguageProviderContext,
  getLanguageDirection,
  type LanguageCode,
} from "./language.types"

export { LanguageProviderContext, getLanguageDirection, DEFAULT_LANGUAGE, LANGUAGES, LANGUAGE_KEY }
export type { LanguageCode, Direction } from "./language.types"

function getInitialLanguage(): LanguageCode {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE
  try {
    const stored = window.localStorage.getItem(LANGUAGE_KEY)
    if (stored === "fa" || stored === "en" || stored === "ar") return stored
  } catch {
    /* ignore storage errors */
  }
  return (i18n.language?.slice(0, 2) as LanguageCode) || DEFAULT_LANGUAGE
}

export default function LanguageProvider({ children }: { readonly children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(getInitialLanguage)
  const direction = getLanguageDirection(language)

  // Keep i18n + document direction/lang in sync.
  useEffect(() => {
    void i18n.changeLanguage(language)
    const root = document.documentElement
    root.dir = direction
    root.lang = language
  }, [language, direction])

  const setLanguage = useCallback((next: LanguageCode) => {
    setLanguageState(next)
    try {
      window.localStorage.setItem(LANGUAGE_KEY, next)
    } catch {
      /* ignore storage errors */
    }
  }, [])

  const value = useMemo(() => ({ language, direction, setLanguage }), [language, direction, setLanguage])

  return <LanguageProviderContext.Provider value={value}>{children}</LanguageProviderContext.Provider>
}
