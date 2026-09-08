import { useTranslation } from "react-i18next"
import { Check, X } from "lucide-react"

import { useUser } from "../hooks/useUser"
import { PERMISSION_MODULES } from "../permissions"
import { groupPermissionsByModule } from "../permissions"
import { cn } from "@/shared/lib/cn"

export function PermissionViewer() {
  const { t } = useTranslation()
  const { user } = useUser()

  if (!user) return null

  const grouped = groupPermissionsByModule(user)

  const moduleEntries = Object.entries(PERMISSION_MODULES).map(([module, codes]) => ({
    module,
    permissions: codes.map((code) => ({
      codename: code,
      granted: grouped[module]?.includes(code) ?? false,
      label: code.split(".")[1],
    })),
  }))

  const totalGranted = user.permissions.length
  const totalAvailable = Object.values(PERMISSION_MODULES).flat().length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {totalGranted} / {totalAvailable} {t("auth.permissions").toLowerCase()}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {moduleEntries.map(({ module, permissions }) => (
          <div key={module} className="flex flex-col gap-1.5">
            <h3 className="text-sm font-semibold capitalize">{module}</h3>
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
              {permissions.map(({ codename, granted, label }) => (
                <div
                  key={codename}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-1 text-sm",
                    granted ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {granted ? (
                    <Check className="h-4 w-4 text-green-600 shrink-0" aria-hidden="true" />
                  ) : (
                    <X className="h-4 w-4 text-red-500 shrink-0" aria-hidden="true" />
                  )}
                  <span className="capitalize">{label}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
