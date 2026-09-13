/** Create/Edit user dialog for the Super Admin (Phase 11.5).
 *
 * Roles always come from the backend catalog (fetched from /admin/users/roles/);
 * the client never invents a role. Passwords appear only in the CREATE form as
 * a write-only pair — editing never shows or sends existing password material,
 * and password reset is a separate controlled action (see UserDetailDialog).
 */
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/features/auth/components/PasswordInput"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { toApiError } from "@/shared/api/axiosClient"

import { useCreateUser, useRoleCatalog, useUpdateUser } from "../hooks"
import { createUserFormSchema, editUserFormSchema } from "../schemas"
import type { ManagedUser, PreferredLanguage } from "../types"
import { RoleSelect } from "./RoleSelect"
import { RolePermissionSummary } from "./RolePermissionSummary"

interface UserFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Present → edit mode; absent → create mode. */
  user?: ManagedUser | null
  /** Signed-in Super Admin id — self-protection hints come from the backend. */
  currentUserId?: number
}

export function UserFormDialog({ open, onOpenChange, user, currentUserId }: UserFormDialogProps) {
  const { t } = useTranslation()
  const isEdit = Boolean(user)
  const roles = useRoleCatalog()
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()
  const isSelf = Boolean(user && currentUserId === user.id)

  const createSchema = useMemo(() => createUserFormSchema(t), [t])
  const editSchema = useMemo(() => editUserFormSchema(t), [t])

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(isEdit ? editSchema : createSchema),
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

  useEffect(() => {
    if (!open) return
    reset({
      username: user?.username ?? "",
      first_name: user?.first_name ?? "",
      last_name: user?.last_name ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
      preferred_language: user?.preferred_language ?? "fa",
      password: "",
      confirm_password: "",
      role: user?.role?.codename ?? "VIEWER",
      is_active: user?.is_active ?? true,
      is_staff: user?.is_staff ?? false,
    })
  }, [open, user, reset])

  const mutation = isEdit ? updateUser : createUser
  const serverError = mutation.isError ? toApiError(mutation.error) : null

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (isEdit && user) {
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
      } else {
        await createUser.mutateAsync({
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
      }
      onOpenChange(false)
    } catch (error) {
      // Map backend field errors (e.g. duplicate username) onto the form.
      const apiError = toApiError(error)
      const fieldErrors = apiError.errors
      if (fieldErrors && typeof fieldErrors === "object" && !Array.isArray(fieldErrors)) {
        for (const [field, messages] of Object.entries(fieldErrors)) {
          const message = Array.isArray(messages) ? messages[0] : String(messages)
          if (typeof message === "string" && message) {
            if (["username", "email", "phone", "role", "password", "confirm_password"].includes(field)) {
              setError(field as "username" | "email" | "phone" | "role" | "password" | "confirm_password", {
                type: "server",
                message,
              })
            }
          }
        }
      }
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("users.dialog.editTitle") : t("users.dialog.createTitle")}
          </DialogTitle>
        </DialogHeader>

        {serverError ? (
          <Alert variant="destructive">
            <AlertDescription>
              {serverError.message || t("users.messages.saveFailed")}
            </AlertDescription>
          </Alert>
        ) : null}

        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="user-username">{t("users.fields.username")} *</Label>
              <Input
                id="user-username"
                autoComplete="username"
                dir="ltr"
                error={Boolean(errors.username)}
                aria-describedby={errors.username ? "user-username-error" : undefined}
                {...register("username")}
              />
              {errors.username ? (
                <p id="user-username-error" className="text-xs text-destructive">
                  {errors.username.message}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="user-email">{t("users.fields.email")} *</Label>
              <Input
                id="user-email"
                type="email"
                autoComplete="email"
                dir="ltr"
                error={Boolean(errors.email)}
                aria-describedby={errors.email ? "user-email-error" : undefined}
                {...register("email")}
              />
              {errors.email ? (
                <p id="user-email-error" className="text-xs text-destructive">
                  {errors.email.message}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="user-first-name">{t("users.fields.firstName")}</Label>
              <Input
                id="user-first-name"
                autoComplete="given-name"
                error={Boolean(errors.first_name)}
                {...register("first_name")}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="user-last-name">{t("users.fields.lastName")}</Label>
              <Input
                id="user-last-name"
                autoComplete="family-name"
                error={Boolean(errors.last_name)}
                {...register("last_name")}
              />
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="user-phone">{t("users.fields.phone")}</Label>
              <Input
                id="user-phone"
                type="tel"
                autoComplete="tel"
                dir="ltr"
                error={Boolean(errors.phone)}
                aria-describedby={errors.phone ? "user-phone-error" : undefined}
                {...register("phone")}
              />
              {errors.phone ? (
                <p id="user-phone-error" className="text-xs text-destructive">
                  {errors.phone.message}
                </p>
              ) : null}
            </div>

            <div className="sm:col-span-2">
              <RoleSelect
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
              <Label htmlFor="user-language">{t("users.fields.language")}</Label>
              <Select
                value={languageValue}
                onValueChange={(value) =>
                  setValue("preferred_language", value as PreferredLanguage, { shouldValidate: true })
                }
              >
                <SelectTrigger id="user-language" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fa">فارسی</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ar">العربية</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!isEdit ? (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="user-password">{t("users.fields.password")} *</Label>
                  <PasswordInput
                    id="user-password"
                    autoComplete="new-password"
                    dir="ltr"
                    error={Boolean(errors.password)}
                    aria-describedby={errors.password ? "user-password-error" : undefined}
                    {...register("password")}
                  />
                  {errors.password ? (
                    <p id="user-password-error" className="text-xs text-destructive">
                      {errors.password.message}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="user-confirm-password">{t("users.fields.confirmPassword")} *</Label>
                  <PasswordInput
                    id="user-confirm-password"
                    autoComplete="new-password"
                    dir="ltr"
                    error={Boolean(errors.confirm_password)}
                    aria-describedby={errors.confirm_password ? "user-confirm-password-error" : undefined}
                    {...register("confirm_password")}
                  />
                  {errors.confirm_password ? (
                    <p id="user-confirm-password-error" className="text-xs text-destructive">
                      {errors.confirm_password.message}
                    </p>
                  ) : null}
                </div>
              </>
            ) : null}

            <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 sm:col-span-2">
              <div className="flex flex-col">
                <Label htmlFor="user-is-active" className="cursor-pointer">
                  {t("users.fields.active")}
                </Label>
                <p className="text-xs text-muted-foreground">{t("users.fields.activeHint")}</p>
              </div>
              <Switch
                id="user-is-active"
                checked={isActive}
                onCheckedChange={(checked) => setValue("is_active", checked)}
                disabled={isSelf}
                aria-disabled={isSelf || undefined}
              />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 sm:col-span-2">
              <div className="flex flex-col">
                <Label htmlFor="user-is-staff" className="cursor-pointer">
                  {t("users.fields.staff")}
                </Label>
                <p className="text-xs text-muted-foreground">{t("users.fields.staffHint")}</p>
              </div>
              <Switch
                id="user-is-staff"
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

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting || mutation.isPending}>
              {isSubmitting || mutation.isPending ? (
                <>
                  <Spinner size="sm" aria-hidden="true" />
                  {t("common.loading")}
                </>
              ) : isEdit ? (
                t("users.dialog.saveChanges")
              ) : (
                t("users.dialog.createUser")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
