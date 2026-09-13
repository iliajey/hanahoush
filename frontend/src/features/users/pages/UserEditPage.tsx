/** Edit a user from a dedicated route (Phase 12, Part D).
 *
 * `GET /dashboard/users/:id/edit` — SUPER_ADMIN only (route guard). Same
 * serializers, guards and schemas as the modal flow; sensitive changes
 * surface the backend's refusal verbatim. Never the only security boundary.
 */
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Link, useNavigate, useParams } from "react-router-dom"

import { PageWrapper } from "@/app/layouts/PageWrapper"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { useUser } from "@/features/auth/hooks/useUser"
import { toApiError } from "@/shared/api/axiosClient"

import { useRoleCatalog, useUpdateUser, useUserDetail } from "../hooks"
import { editUserFormSchema } from "../schemas"
import type { PreferredLanguage } from "../types"
import { RoleSelect } from "../components/RoleSelect"
import { RolePermissionSummary } from "../components/RolePermissionSummary"

export function UserEditPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user: currentUser } = useUser()
  const userId = id ? Number(id) : null

  const { data: user, isLoading, isError } = useUserDetail(
    Number.isFinite(userId) ? userId : null,
  )
  const roles = useRoleCatalog()
  const updateUser = useUpdateUser()

  const schema = useMemo(() => editUserFormSchema(t), [t])
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      username: "",
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      preferred_language: "fa" as PreferredLanguage,
      role: "VIEWER",
      is_active: true,
      is_staff: false,
    },
  })

  useEffect(() => {
    if (!user) return
    reset({
      username: user.username,
      first_name: user.first_name ?? "",
      last_name: user.last_name ?? "",
      email: user.email ?? "",
      phone: user.phone ?? "",
      preferred_language: user.preferred_language ?? "fa",
      role: user.role?.codename ?? "VIEWER",
      is_active: user.is_active,
      is_staff: user.is_staff,
    })
  }, [user, reset])

  const roleValue = watch("role")
  const languageValue = watch("preferred_language")
  const isActive = watch("is_active")
  const isStaff = watch("is_staff")
  const isSelf = Boolean(user && currentUser?.id === user.id)
  const serverError = updateUser.isError ? toApiError(updateUser.error) : null

  const onSubmit = handleSubmit(async (values) => {
    if (!user) return
    try {
      await updateUser.mutateAsync({
        id: user.id,
        payload: {
          username: values.username,
          first_name: values.first_name ?? "",
          last_name: values.last_name ?? "",
          email: values.email,
          phone: values.phone ?? "",
          preferred_language: values.preferred_language,
          role: values.role,
          is_active: values.is_active,
          is_staff: values.is_staff,
        },
      })
      navigate(`/dashboard/users/${user.id}`)
    } catch (error) {
      const apiError = toApiError(error)
      const fieldErrors = apiError.errors
      if (fieldErrors && typeof fieldErrors === "object" && !Array.isArray(fieldErrors)) {
        for (const [field, messages] of Object.entries(fieldErrors)) {
          const message = Array.isArray(messages) ? messages[0] : String(messages)
          if (typeof message === "string" && message) {
            if (["username", "email", "phone", "role", "is_active", "is_staff"].includes(field)) {
              setError(
                field as "username" | "email" | "phone" | "role" | "is_active" | "is_staff",
                { type: "server", message },
              )
            }
          }
        }
      }
    }
  })

  return (
    <PageWrapper
      title={user ? t("users.dialog.editTitle") : t("users.detail.title")}
      description={t("users.page.description")}
    >
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to={user ? `/dashboard/users/${user.id}` : "/dashboard/users"}>
            {t("common.back")}
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2" role="status" aria-live="polite">
          <Skeleton className="h-10" />
          <Skeleton className="h-40" />
        </div>
      ) : isError || !user ? (
        <EmptyState
          title={t("users.detail.notFoundTitle")}
          description={t("users.detail.notFoundDescription")}
        />
      ) : (
        <Card>
          <CardContent className="pt-6">
            {serverError ? (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>
                  {serverError.message || t("users.messages.saveFailed")}
                </AlertDescription>
              </Alert>
            ) : null}

            <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="edit-username">{t("users.fields.username")} *</Label>
                  <Input
                    id="edit-username"
                    autoComplete="username"
                    dir="ltr"
                    error={Boolean(errors.username)}
                    {...register("username")}
                  />
                  {errors.username ? (
                    <p className="text-xs text-destructive">{errors.username.message}</p>
                  ) : null}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="edit-email">{t("users.fields.email")} *</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    autoComplete="email"
                    dir="ltr"
                    error={Boolean(errors.email)}
                    {...register("email")}
                  />
                  {errors.email ? (
                    <p className="text-xs text-destructive">{errors.email.message}</p>
                  ) : null}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="edit-first-name">{t("users.fields.firstName")}</Label>
                  <Input id="edit-first-name" autoComplete="given-name" {...register("first_name")} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="edit-last-name">{t("users.fields.lastName")}</Label>
                  <Input id="edit-last-name" autoComplete="family-name" {...register("last_name")} />
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <Label htmlFor="edit-phone">{t("users.fields.phone")}</Label>
                  <Input
                    id="edit-phone"
                    type="tel"
                    autoComplete="tel"
                    dir="ltr"
                    error={Boolean(errors.phone)}
                    {...register("phone")}
                  />
                  {errors.phone ? (
                    <p className="text-xs text-destructive">{errors.phone.message}</p>
                  ) : null}
                </div>
                <div className="sm:col-span-2">
                  <RoleSelect
                    id="edit-role"
                    value={roleValue}
                    onChange={(value) => setValue("role", value, { shouldValidate: true })}
                    roles={roles.data ?? []}
                    invalid={Boolean(errors.role)}
                    error={errors.role?.message}
                  />
                </div>
                <div className="sm:col-span-2">
                  <RolePermissionSummary roleCodename={roleValue} roles={roles.data ?? []} />
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <Label htmlFor="edit-language">{t("users.fields.language")}</Label>
                  <Select
                    value={languageValue}
                    onValueChange={(value) =>
                      setValue("preferred_language", value as PreferredLanguage, {
                        shouldValidate: true,
                      })
                    }
                  >
                    <SelectTrigger id="edit-language" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fa">فارسی</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ar">العربية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 sm:col-span-2">
                  <div className="flex flex-col">
                    <Label htmlFor="edit-is-active" className="cursor-pointer">
                      {t("users.fields.active")}
                    </Label>
                    <p className="text-xs text-muted-foreground">{t("users.fields.activeHint")}</p>
                  </div>
                  <Switch
                    id="edit-is-active"
                    checked={isActive}
                    onCheckedChange={(checked) => setValue("is_active", checked)}
                    disabled={isSelf}
                    aria-disabled={isSelf || undefined}
                  />
                </div>
                <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 sm:col-span-2">
                  <div className="flex flex-col">
                    <Label htmlFor="edit-is-staff" className="cursor-pointer">
                      {t("users.fields.staff")}
                    </Label>
                    <p className="text-xs text-muted-foreground">{t("users.fields.staffHint")}</p>
                  </div>
                  <Switch
                    id="edit-is-staff"
                    checked={isStaff}
                    onCheckedChange={(checked) => setValue("is_staff", checked)}
                    disabled={isSelf}
                    aria-disabled={isSelf || undefined}
                  />
                </div>
                {isSelf ? (
                  <p className="text-xs text-muted-foreground sm:col-span-2">
                    {t("users.messages.selfEditNote")}
                  </p>
                ) : null}
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" asChild>
                  <Link to={`/dashboard/users/${user.id}`}>{t("common.cancel")}</Link>
                </Button>
                <Button type="submit" disabled={isSubmitting || updateUser.isPending}>
                  {isSubmitting || updateUser.isPending ? (
                    <>
                      <Spinner size="sm" aria-hidden="true" />
                      {t("common.loading")}
                    </>
                  ) : (
                    t("users.dialog.saveChanges")
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </PageWrapper>
  )
}
