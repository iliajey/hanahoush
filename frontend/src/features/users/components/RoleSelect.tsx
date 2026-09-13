/** Role-aware selector for user management (Phase 12, Part F).
 *
 * Roles always come from the backend catalog (`GET /admin/users/roles/`);
 * the frontend never invents a role. Each option shows the localized name,
 * the human-readable description and the permission count so SUPER_ADMIN
 * can judge the blast radius before assigning.
 */
import { useTranslation } from "react-i18next"

import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import type { RoleWithPermissions } from "../types"

interface RoleSelectProps {
  id?: string
  value: string
  onChange: (value: string) => void
  roles: RoleWithPermissions[]
  invalid?: boolean
  error?: string | null
}

export function RoleSelect({
  id = "user-role",
  value,
  onChange,
  roles,
  invalid,
  error,
}: RoleSelectProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{t("users.fields.role")} *</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-full" aria-invalid={invalid || undefined}>
          <SelectValue placeholder={t("users.fields.rolePlaceholder")} />
        </SelectTrigger>
        <SelectContent>
          {roles.map((role) => (
            <SelectItem key={role.id} value={role.codename}>
              <span className="flex flex-col items-start gap-0.5">
                <span>
                  {t(`roles.${role.codename}.name`, { defaultValue: role.name })}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t(`roles.${role.codename}.description`, {
                    defaultValue: role.description || "",
                  })}
                  {" · "}
                  {t("users.roleSelect.permissionCount", {
                    count: role.permissions.length,
                  })}
                </span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}
