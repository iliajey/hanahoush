import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SERVICE_ICON_KEYS, sectionIcon } from "@/features/page-builder/registry/sections/common"
import { cn } from "@/shared/lib/cn"

export function ServiceIconPicker({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  const { t } = useTranslation()
  const normalized = value.trim().toLowerCase()
  const Preview = sectionIcon(normalized || undefined, 0)
  return (
    <div className="grid gap-2">
      <Label htmlFor="service-icon">{t("serviceWorkspace.form.icon")}</Label>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-muted/40",
            !normalized && "text-muted-foreground",
          )}
          aria-hidden="true"
        >
          <Preview className="h-4 w-4" />
        </span>
        <Select value={normalized || "none"} onValueChange={(next) => onChange(next === "none" ? "" : next)}>
          <SelectTrigger id="service-icon" dir="ltr">
            <SelectValue placeholder="code" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t("serviceWorkspace.form.noIcon")}</SelectItem>
            {SERVICE_ICON_KEYS.map((key) => (
              <SelectItem key={key} value={key}>
                {key}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {normalized ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
            {t("common.clear")}
          </Button>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">{t("serviceWorkspace.form.iconHint")}</p>
    </div>
  )
}
