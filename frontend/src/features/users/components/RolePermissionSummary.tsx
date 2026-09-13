import { useTranslation } from "react-i18next"
import { Check, Minus, ShieldAlert } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { PERMISSION_MODULES } from "@/features/auth/permissions"

import type { RoleWithPermissions } from "../types"

/** Group a role's permission codenames by their dotted module prefix, using
 * the backend-supplied `module` field when present. */
export function groupRolePermissions(
  permissions: RoleWithPermissions["permissions"],
): Array<{ module: string; items: RoleWithPermissions["permissions"] }> {
  const buckets = new Map<string, RoleWithPermissions["permissions"]>()
  for (const permission of permissions) {
    const module = permission.module || (permission.codename.split(".")[0] ?? "other")
    const bucket = buckets.get(module) ?? []
    bucket.push(permission)
    buckets.set(module, bucket)
  }
  return Array.from(buckets.entries())
    .map(([module, items]) => ({ module, items }))
    .sort((a, b) => a.module.localeCompare(b.module))
}

/** Human-readable action label; the raw codename stays as secondary info. */
export function permissionLabel(codename: string): string {
  const [, action] = codename.split(".")
  return action ? action.replace(/_/g, " ") : codename
}

/** Backend `module` values vs the frontend PERMISSION_MODULES keys. */
function moduleAlias(uiModule: string): string {
  if (uiModule === "media") return "media_library"
  if (uiModule === "accounts") return "accounts"
  return uiModule
}

/** What the selected role grants — shown under the role selector on the
 * create/edit pages so SUPER_ADMIN assigns with full visibility: role
 * description + responsibilities, grouped human-readable permissions, and
 * explicit restrictions. The backend role model stays authoritative; this is
 * a read-only summary. */
export function RolePermissionSummary({
  roleCodename,
  roles,
}: {
  roleCodename: string
  roles: RoleWithPermissions[]
}) {
  const { t } = useTranslation()
  const role = roles.find((item) => item.codename === roleCodename) ?? null

  if (!role) {
    return (
      <p className="text-xs text-muted-foreground">{t("users.roleSummary.selectRole")}</p>
    )
  }

  const groups = groupRolePermissions(role.permissions)
  const isSuperAdmin = role.codename === "SUPER_ADMIN"
  const grantedModules = new Set(role.permissions.map((p) => p.module || (p.codename.split(".")[0] ?? "")))
  const denied = Object.keys(PERMISSION_MODULES).filter((module) => !grantedModules.has(moduleAlias(module)))

  return (
    <div className="rounded-md border bg-muted/30 p-3" aria-live="polite">
      <p className="text-sm font-semibold">
        {t(`roles.${role.codename}.name`, { defaultValue: role.name })}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {t(`roles.${role.codename}.description`, { defaultValue: role.description || "" })}
      </p>
      <p className="mt-1.5 text-xs text-muted-foreground">
        {t(`roles.${role.codename}.responsibilities`, { defaultValue: "" })}
      </p>
      {isSuperAdmin ? (
        <Alert variant="destructive" className="mt-2">
          <ShieldAlert className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>{t("users.roleSummary.superAdminWarning")}</AlertDescription>
        </Alert>
      ) : null}
      <div className="mt-2 flex flex-col gap-2">
        {groups.map((group) => (
          <div key={group.module} className="flex flex-col gap-1 rounded-md border bg-background/60 p-2">
            <p className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span className="capitalize">
                {t(`users.permissions.modules.${group.module}`, { defaultValue: group.module })}
              </span>
              <Badge variant="secondary" className="tabular-nums">{group.items.length}</Badge>
            </p>
            <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
              {group.items.map((permission) => (
                <li key={permission.codename} className="flex items-center gap-1.5 text-xs">
                  <Check className="h-3.5 w-3.5 shrink-0 text-green-600" aria-hidden="true" />
                  <span className="font-medium capitalize">{permissionLabel(permission.codename)}</span>
                  <span dir="ltr" className="truncate text-muted-foreground">{permission.codename}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {denied.length > 0 ? (
        <div className="mt-2 flex flex-col gap-1">
          <p className="text-xs font-semibold text-muted-foreground">{t("users.roleSummary.restrictions")}</p>
          <ul className="flex flex-col gap-1">
            {denied.map((module) => (
              <li key={module} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Minus className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="capitalize">{t(`users.permissions.modules.${module}`, { defaultValue: module })}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <p className="mt-2 text-xs text-muted-foreground">{t("users.roleSummary.roleAuthoritative")}</p>
    </div>
  )
}
