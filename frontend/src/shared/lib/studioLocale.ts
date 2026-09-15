import type { LanguageCode } from "@/app/language/language.types"

const STUDIO_LOCALES: ReadonlyArray<LanguageCode> = ["fa", "en", "ar"]

/** Parse `?locale=` into a studio locale; invalid values fall back. */
export function studioLocaleFromSearchParams(
  search: URLSearchParams,
  fallback: LanguageCode,
): LanguageCode {
  const raw = (search.get("locale") ?? "").toLowerCase()
  if (raw === "fa" || raw === "en" || raw === "ar") return raw
  return fallback
}

/** Studio deep link with locale preselect: `/dashboard/articles/7/edit?locale=fa`. */
export function studioPathWithLocale(path: string, locale: LanguageCode): string {
  return `${path}?locale=${locale}`
}

export { STUDIO_LOCALES }
