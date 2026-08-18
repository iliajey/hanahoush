import type { Control, FieldValues, Path } from "react-hook-form"
import { Controller } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export interface RememberMeProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>
  name: Path<TFieldValues>
}

/** "Remember me" checkbox bound to a react-hook-form field. */
export function RememberMe<TFieldValues extends FieldValues>({
  control,
  name,
}: RememberMeProps<TFieldValues>) {
  const { t } = useTranslation()
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className="flex items-center gap-2">
          <Checkbox id="remember-me" checked={Boolean(field.value)} onCheckedChange={field.onChange} />
          <Label htmlFor="remember-me" className="text-sm font-normal">
            {t("auth.rememberMe")}
          </Label>
        </div>
      )}
    />
  )
}
