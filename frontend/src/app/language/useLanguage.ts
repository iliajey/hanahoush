import { useContext } from "react"

import { LanguageProviderContext } from "./language.types"

/** Hook for components to read/write the active language + text direction. */
export function useLanguage() {
  const context = useContext(LanguageProviderContext)
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
