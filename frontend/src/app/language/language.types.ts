import { createContext } from "react"

export type LanguageCode = "fa" | "en" | "ar"
export type Direction = "rtl" | "ltr"

export const LANGUAGES: ReadonlyArray<{
  code: LanguageCode
  label: string
  nativeName: string
  direction: Direction
}> = [
  { code: "fa", label: "Persian", nativeName: "فارسی", direction: "rtl" },
  { code: "en", label: "English", nativeName: "English", direction: "ltr" },
  { code: "ar", label: "Arabic", nativeName: "العربية", direction: "rtl" },
]

export const LANGUAGE_KEY = "hanahoush-language"
export const DEFAULT_LANGUAGE: LanguageCode = "fa"

export function getLanguageDirection(code: LanguageCode): Direction {
  return code === "en" ? "ltr" : "rtl"
}

export interface LanguageProviderState {
  language: LanguageCode
  direction: Direction
  setLanguage: (language: LanguageCode) => void
}

export const LanguageProviderContext = createContext<LanguageProviderState>({
  language: DEFAULT_LANGUAGE,
  direction: getLanguageDirection(DEFAULT_LANGUAGE),
  setLanguage: () => undefined,
})
