import { useTranslation } from "react-i18next"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUser } from "@/features/auth/hooks/useUser"
import { UserAvatar } from "@/features/auth/components/UserAvatar"
import { getDisplayName } from "@/features/auth/utils"
import { getRoleDefinition } from "@/features/auth/role-config"

import { ProfileForm } from "../components/ProfileForm"
import { ChangePasswordForm } from "../components/ChangePasswordForm"
import { PermissionViewer } from "../components/PermissionViewer"

export function ProfilePage() {
  const { t } = useTranslation()
  const { user } = useUser()

  if (!user) return null

  const role = getRoleDefinition(user.role?.codename ?? null)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <UserAvatar user={user} className="h-16 w-16" />
        <div>
          <h1 className="text-2xl font-bold">{getDisplayName(user)}</h1>
          <p className="text-muted-foreground">@{user.username}</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile">{t("auth.profile")}</TabsTrigger>
          <TabsTrigger value="password">{t("auth.changePassword")}</TabsTrigger>
          <TabsTrigger value="permissions">{t("auth.permissions")}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("auth.profile")}</CardTitle>
              <CardDescription>{t("auth.profileDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("auth.changePassword")}</CardTitle>
              <CardDescription>{t("auth.changePasswordDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <ChangePasswordForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("auth.permissions")}</CardTitle>
              <CardDescription>
                {role ? t(role.nameKey) : user.role?.name ?? t("auth.profile")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PermissionViewer />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
