import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useUser } from "@/features/auth/hooks/useUser"
import { useLogout } from "@/features/auth/hooks/useLogout"
import { UserAvatar } from "@/features/auth/components/UserAvatar"
import { getDisplayName } from "@/features/auth/utils"
import { getRoleDefinition } from "@/features/auth/role-config"
import { groupPermissionsByModule } from "@/features/auth/permissions"
import { PERMISSION_MODULES } from "@/features/auth/permissions"

/** Authenticated user area (Part O): identity, role, permission summary,
 * session status and logout. Never exposes tokens or security internals. */
export function ProfileCard() {
  const { t } = useTranslation()
  const { user } = useUser()
  const { mutate: logout } = useLogout()
  const navigate = useNavigate()

  if (!user) return null

  const role = getRoleDefinition(user.role?.codename ?? null)
  const grouped = groupPermissionsByModule(user)
  const modules = Object.entries(PERMISSION_MODULES).filter(([, codes]) =>
    codes.some((code) => grouped[code.split(".")[0]]?.includes(code)),
  )

  return (
    <Card className="h-fit">
      <CardHeader className="flex flex-row items-center gap-4">
        <UserAvatar user={user} className="h-12 w-12" />
        <div className="min-w-0">
          <CardTitle className="truncate">{getDisplayName(user)}</CardTitle>
          <p className="truncate text-xs text-muted-foreground">
            @{user.username}
            {user.email ? ` · ${user.email}` : ""}
          </p>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">{t("dashboard.role")}</span>
          <Badge variant="secondary">{role ? t(role.nameKey) : t("dashboard.profile.noRole")}</Badge>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">{t("dashboard.session")}</span>
          <Badge variant="success">{t("dashboard.sessionActive")}</Badge>
        </div>
        <div className="flex flex-wrap gap-1.5 border-t pt-3">
          {modules.length > 0 ? (
            <>
              <span className="w-full text-xs font-semibold text-muted-foreground">{t("dashboard.profile.permsTitle")}</span>
              {modules.map(([module]) => (
                <Badge key={module} variant="outline">
                  {module}
                </Badge>
              ))}
            </>
          ) : (
            <span className="text-xs text-muted-foreground">{t("dashboard.profile.noPermissions")}</span>
          )}
        </div>
        <div className="mt-1 flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => logout(undefined, { onSettled: () => navigate("/login") })}
          >
            {t("navWorkspace.logout")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}