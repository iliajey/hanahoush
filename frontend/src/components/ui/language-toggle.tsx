import { Languages } from "lucide-react"
import { useTranslation } from "react-i18next"

import { useLanguage } from "@/shared/hooks"
import { LANGUAGES } from "@/app/language/language.types"

import { cn } from "@/shared/lib/cn"
import { Button } from "./button"

/** Cycles through fa → en → ar and updates the document direction. */
export function LanguageToggle({ className }: { className?: string }) {
  const { language, setLanguage } = useLanguage()
  const { t } = useTranslation()

  const cycle = () => {
    const index = LANGUAGES.findIndex((l) => l.code === language)
    const next = LANGUAGES[(index + 1) % LANGUAGES.length]
    setLanguage(next.code)
  }

  const label = t("app.toggleLanguage")

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={cycle}
      aria-label={label}
      title={label}
      className={cn("gap-1.5", className)}
    >
      <Languages className="h-4 w-4" />
      <span className="text-xs font-medium uppercase">{language}</span>
    </Button>
  )
}
