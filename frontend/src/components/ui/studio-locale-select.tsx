import { Check } from "lucide-react"
import { useTranslation } from "react-i18next"

import { LANGUAGES, type LanguageCode } from "@/app/language/language.types"
import { cn } from "@/shared/lib/cn"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"

export type StudioLocale = LanguageCode

/** Per-locale completeness hint shown inside the dropdown options. */
export interface LocaleCompleteness {
  fa: boolean
  en: boolean
  ar: boolean
}

function dotClass(complete: boolean): string {
  return complete ? "bg-green-500" : "bg-amber-500"
}

/** Editing-language selector for the content studios (Phase 15).

 * A proper dropdown that shows one language's fields at a time, with a
 * subtle completeness dot per locale. Content is preserved on switch —
 * the parent keeps all three locales in state and only changes which one
 * is rendered. Keyboard: native Radix Select behaviour (arrows + type-ahead). */
export function StudioLocaleSelect({
  value,
  onChange,
  completeness,
  id = "studio-locale",
  label,
}: {
  value: StudioLocale
  onChange: (locale: StudioLocale) => void
  completeness?: LocaleCompleteness
  id?: string
  label?: string
}) {
  const { t } = useTranslation()
  const accessibleLabel = label ?? t("studio.common.editingLanguage")

  return (
    <div className="flex items-center gap-2">
      <Select value={value} onValueChange={(next) => onChange(next as StudioLocale)}>
        <SelectTrigger id={id} aria-label={accessibleLabel} className="w-auto min-w-36 gap-2">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LANGUAGES.map((item) => {
            const complete = completeness?.[item.code] ?? true
            return (
              <SelectItem key={item.code} value={item.code}>
                <span className="flex items-center gap-2">
                  <span
                    className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dotClass(complete))}
                    aria-hidden="true"
                  />
                  <span dir="auto">{item.nativeName}</span>
                  {value === item.code ? <Check className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> : null}
                </span>
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
    </div>
  )
}
