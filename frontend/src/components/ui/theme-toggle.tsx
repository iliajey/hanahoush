import { Moon, Sun, Monitor } from "lucide-react"
import { useTranslation } from "react-i18next"

import { useTheme } from "@/shared/hooks"
import { Theme } from "@/app/theme/theme.types"

import { cn } from "@/shared/lib/cn"
import { Button } from "./button"

const OPTIONS = [
  { value: Theme.LIGHT, icon: Sun, labelKey: "app.theme.light" },
  { value: Theme.DARK, icon: Moon, labelKey: "app.theme.dark" },
  { value: Theme.SYSTEM, icon: Monitor, labelKey: "app.theme.system" },
] as const

/** Light / Dark / System segmented switch. */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const { t } = useTranslation()

  return (
    <div
      role="group"
      aria-label={t("app.toggleTheme")}
      className={cn("inline-flex items-center rounded-md border bg-muted/50 p-0.5", className)}
    >
      {OPTIONS.map(({ value, icon: Icon, labelKey }) => (
        <Button
          key={value}
          type="button"
          size="icon"
          variant="ghost"
          aria-label={t(labelKey)}
          aria-pressed={theme === value}
          title={t(labelKey)}
          onClick={() => setTheme(value)}
          className={cn("h-7 w-7 rounded-sm", theme === value && "bg-background text-foreground shadow-sm")}
        >
          <Icon className="h-4 w-4" />
        </Button>
      ))}
    </div>
  )
}
