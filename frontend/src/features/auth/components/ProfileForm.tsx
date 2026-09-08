import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { useUser } from "@/features/auth/hooks/useUser"
import { createProfileSchema, type ProfileFormValues } from "../schemas"
import { updateProfile } from "../api/authApi"
import { useQueryClient } from "@tanstack/react-query"

export function ProfileForm() {
  const { t } = useTranslation()
  const { user, refreshUser } = useUser()
  const queryClient = useQueryClient()
  const profileSchema = useMemo(() => createProfileSchema(t), [t])
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: user?.first_name ?? "",
      last_name: user?.last_name ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
      preferred_language: user?.preferred_language ?? "fa",
    },
  })

  const preferredLanguage = watch("preferred_language")

  const onSubmit = handleSubmit(async (values) => {
    setSuccess(false)
    try {
      await updateProfile(values)
      await refreshUser()
      queryClient.invalidateQueries({ queryKey: ["auth"] })
      setSuccess(true)
    } catch {
      // Error handled by form state
    }
  })

  if (!user) return null

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {success ? (
        <Alert>
          <AlertDescription>{t("auth.profileUpdated")}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="username">{t("auth.username")}</Label>
          <Input id="username" value={user.username} disabled />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">{t("auth.email")}</Label>
          <Input id="email" type="email" autoComplete="email" error={Boolean(errors.email)} {...register("email")} />
          {errors.email ? <p className="text-xs text-destructive">{errors.email.message}</p> : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="first_name">{t("auth.firstName")}</Label>
          <Input id="first_name" autoComplete="given-name" error={Boolean(errors.first_name)} {...register("first_name")} />
          {errors.first_name ? <p className="text-xs text-destructive">{errors.first_name.message}</p> : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="last_name">{t("auth.lastName")}</Label>
          <Input id="last_name" autoComplete="family-name" error={Boolean(errors.last_name)} {...register("last_name")} />
          {errors.last_name ? <p className="text-xs text-destructive">{errors.last_name.message}</p> : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phone">{t("auth.phone")}</Label>
          <Input id="phone" type="tel" autoComplete="tel" error={Boolean(errors.phone)} {...register("phone")} />
          {errors.phone ? <p className="text-xs text-destructive">{errors.phone.message}</p> : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>{t("auth.profile")}</Label>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{t("dashboard.role")}:</span>
            <span className="font-medium">{user.role?.name ?? "-"}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>{t("app.toggleLanguage")}</Label>
        <Select
          value={preferredLanguage}
          onValueChange={(value) => setValue("preferred_language", value as "fa" | "en" | "ar")}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fa">فارسی</SelectItem>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="ar">العربية</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>{t("auth.staffStatus")}</Label>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">{t("auth.active")}:</span>
          <span className={user.is_active ? "text-green-600" : "text-red-600"}>
            {user.is_active ? t("auth.active") : t("auth.inactive")}
          </span>
          {user.is_staff ? (
            <>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">{t("auth.staff")}:</span>
              <span className="text-green-600">{t("auth.active")}</span>
            </>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>{t("auth.memberSince")}</Label>
        <p className="text-sm text-muted-foreground">
          {new Date(user.date_joined).toLocaleDateString()}
        </p>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? (
          <>
            <Spinner size="sm" />
            {t("common.loading")}
          </>
        ) : (
          t("common.save")
        )}
      </Button>
    </form>
  )
}
