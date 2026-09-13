/** Create a user from a dedicated route (Phase 12, Part C).
 *
 * `GET /dashboard/users/new` — SUPER_ADMIN only (route guard). Same backend
 * API, schemas and role catalog as the modal flow; navigates to the new
 * account's detail page on success.
 */
import { zodResolver } from "@hookform/resolvers/zod"
import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router-dom"

import { PageWrapper } from "@/app/layouts/PageWrapper"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/features/auth/components/PasswordInput"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { toApiError } from "@/shared/api/axiosClient"

import { useCreateUser, useRoleCatalog } from "../hooks"
import { createUserFormSchema } from "../schemas"
import type { PreferredLanguage } from "../types"
import { RoleSelect } from "../components/RoleSelect"
import { RolePermissionSummary } from "../components/RolePermissionSummary"

export function UserCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const roles = useRoleCatalog()
  const createUser = useCreateUser()

  const schema = useMemo(() => createUserFormSchema(t), [t])
  const {
    register,
    handleSubmit,
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
      password: "",
      confirm_password: "",
      role: "VIEWER",
      is_active: true,
      is_staff: false,
    },
  })

  const roleValue = watch("role")
  const languageValue = watch("preferred_language")
  const isActive = watch("is_active")
  const isStaff = watch("is_staff")
  const serverError = createUser.isError ? toApiError(createUser.error) : null

  const onSubmit = handleSubmit(async (values) => {
    try {
      const created = await createUser.mutateAsync({
        username: values.username,
        first_name: values.first_name ?? "",
        last_name: values.last_name ?? "",
        email: values.email,
        phone: values.phone ?? "",
        preferred_language: values.preferred_language,
        password: values.password,
        confirm_password: values.confirm_password,
        role: values.role,
        is_active: values.is_active,
        is_staff: values.is_staff,
      })
      navigate(`/dashboard/users/${created.id}`, { replace: true })
    } catch (error) {
      const apiError = toApiError(error)
      const fieldErrors = apiError.errors
      if (fieldErrors && typeof fieldErrors === "object" && !Array.isArray(fieldErrors)) {
        for (const [field, messages] of Object.entries(fieldErrors)) {
          const message = Array.isArray(messages) ? messages[0] : String(messages)
          if (typeof message === "string" && message) {
            if (
              ["username", "email", "phone", "role", "password", "confirm_password"].includes(
                field,
              )
            ) {
              setError(
                field as
                  | "username"
                  | "email"
                  | "phone"
                  | "role"
                  | "password"
                  | "confirm_password",
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
      title={t("users.dialog.createTitle")}
      description={t("users.page.description")}
    >
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/dashboard/users">{t("users.actions.backToUsers")}</Link>
        </Button>
      </div>
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
                <Label htmlFor="new-username">{t("users.fields.username")} *</Label>
                <Input
                  id="new-username"
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
                <Label htmlFor="new-email">{t("users.fields.email")} *</Label>
                <Input
                  id="new-email"
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
                <Label htmlFor="new-first-name">{t("users.fields.firstName")}</Label>
                <Input id="new-first-name" autoComplete="given-name" {...register("first_name")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="new-last-name">{t("users.fields.lastName")}</Label>
                <Input id="new-last-name" autoComplete="family-name" {...register("last_name")} />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="new-phone">{t("users.fields.phone")}</Label>
                <Input
                  id="new-phone"
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
                  id="new-role"
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
                <Label htmlFor="new-language">{t("users.fields.language")}</Label>
                <Select
                  value={languageValue}
                  onValueChange={(value) =>
                    setValue("preferred_language", value as PreferredLanguage, {
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger id="new-language" className="w-full">
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
                <Label htmlFor="new-password">{t("users.fields.password")} *</Label>
                <PasswordInput
                  id="new-password"
                  autoComplete="new-password"
                  dir="ltr"
                  error={Boolean(errors.password)}
                  {...register("password")}
                />
                {errors.password ? (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                ) : null}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="new-confirm-password">{t("users.fields.confirmPassword")} *</Label>
                <PasswordInput
                  id="new-confirm-password"
                  autoComplete="new-password"
                  dir="ltr"
                  error={Boolean(errors.confirm_password)}
                  {...register("confirm_password")}
                />
                {errors.confirm_password ? (
                  <p className="text-xs text-destructive">{errors.confirm_password.message}</p>
                ) : null}
              </div>
              <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 sm:col-span-2">
                <div className="flex flex-col">
                  <Label htmlFor="new-is-active" className="cursor-pointer">
                    {t("users.fields.active")}
                  </Label>
                  <p className="text-xs text-muted-foreground">{t("users.fields.activeHint")}</p>
                </div>
                <Switch
                  id="new-is-active"
                  checked={isActive}
                  onCheckedChange={(checked) => setValue("is_active", checked)}
                />
              </div>
              <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 sm:col-span-2">
                <div className="flex flex-col">
                  <Label htmlFor="new-is-staff" className="cursor-pointer">
                    {t("users.fields.staff")}
                  </Label>
                  <p className="text-xs text-muted-foreground">{t("users.fields.staffHint")}</p>
                </div>
                <Switch
                  id="new-is-staff"
                  checked={isStaff}
                  onCheckedChange={(checked) => setValue("is_staff", checked)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" asChild>
                <Link to="/dashboard/users">{t("common.cancel")}</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting || createUser.isPending}>
                {isSubmitting || createUser.isPending ? (
                  <>
                    <Spinner size="sm" aria-hidden="true" />
                    {t("common.loading")}
                  </>
                ) : (
                  t("users.dialog.createUser")
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageWrapper>
  )
}
