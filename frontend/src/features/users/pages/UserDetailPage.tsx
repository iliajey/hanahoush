/** Admin user detail (Phase 12, Part G).
 *
 * `GET /dashboard/users/:id` — SUPER_ADMIN only (route guard). Facts, the
 * effective permission summary and actions (edit, set password,
 * activate/deactivate with confirmation). Never shows secrets.
 */
import { zodResolver } from "@hookform/resolvers/zod"
import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Check, KeyRound, X } from "lucide-react"
import { Link, useParams } from "react-router-dom"

import { PageWrapper } from "@/app/layouts/PageWrapper"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { PasswordInput } from "@/features/auth/components/PasswordInput"
import { Spinner } from "@/components/ui/spinner"
import { UserAvatar } from "@/features/auth/components/UserAvatar"
import { useUser } from "@/features/auth/hooks/useUser"
import { toApiError } from "@/shared/api/axiosClient"

import {
  useActivateUser,
  useDeactivateUser,
  useSetUserPassword,
  useUserDetail,
} from "../hooks"
import { setPasswordFormSchema } from "../schemas"
import { ConfirmActionDialog, type ConfirmActionKind } from "../components/ConfirmActionDialog"

const LANGUAGE_NAMES: Record<string, string> = { fa: "فارسی", en: "English", ar: "العربية" }

function groupByModule(codenames: string[]): Array<[string, string[]]> {
  const grouped = new Map<string, string[]>()
  for (const codename of codenames) {
    const module = codename.split(".")[0] ?? "other"
    const bucket = grouped.get(module) ?? []
    bucket.push(codename)
    grouped.set(module, bucket)
  }
  return Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b))
}

export function UserDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const { user: currentUser } = useUser()
  const userId = id ? Number(id) : null

  const { data: user, isLoading, isError } = useUserDetail(
    Number.isFinite(userId) ? userId : null,
  )
  const setPassword = useSetUserPassword()
  const activate = useActivateUser()
  const deactivate = useDeactivateUser()

  const [confirm, setConfirm] = useState<ConfirmActionKind | null>(null)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwordChanged, setPasswordChanged] = useState(false)

  const passwordSchema = useMemo(() => setPasswordFormSchema(t), [t])
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<{ new_password: string; confirm_password: string }>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { new_password: "", confirm_password: "" },
  })

  const isSelf = Boolean(user && currentUser?.id === user.id)
  const lifecycleError = activate.isError
    ? toApiError(activate.error)
    : deactivate.isError
      ? toApiError(deactivate.error)
      : null
  const passwordError = setPassword.isError ? toApiError(setPassword.error) : null
  const confirmPending =
    confirm === "activate"
      ? activate.isPending
      : confirm === "deactivate"
        ? deactivate.isPending
        : false
  const confirmError =
    confirm === "activate" || confirm === "deactivate" ? lifecycleError?.message : null

  const onSubmitPassword = handleSubmit(async (values) => {
    if (!user) return
    try {
      await setPassword.mutateAsync({ id: user.id, payload: values })
      setPasswordChanged(true)
      setShowPasswordForm(false)
      reset()
    } catch {
      // surfaced via passwordError alert
    }
  })

  const runConfirmed = () => {
    if (!user) return
    if (confirm === "activate") {
      activate.mutate(user.id, { onSuccess: () => setConfirm(null) })
    } else if (confirm === "deactivate") {
      deactivate.mutate(user.id, { onSuccess: () => setConfirm(null) })
    }
  }

  return (
    <PageWrapper
      title={user ? user.username : t("users.detail.title")}
      description={t("users.page.description")}
    >
      <div className="mb-4 flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/dashboard/users">{t("users.actions.backToUsers")}</Link>
        </Button>
        {user && !isSelf ? (
          <Button variant="outline" size="sm" asChild>
            <Link to={`/dashboard/users/${user.id}/edit`}>{t("users.actions.edit")}</Link>
          </Button>
        ) : null}
      </div>

      {isLoading ? (
        <div className="space-y-2" role="status" aria-live="polite">
          <Skeleton className="h-24" />
          <Skeleton className="h-40" />
        </div>
      ) : isError || !user ? (
        <EmptyState
          title={t("users.detail.notFoundTitle")}
          description={t("users.detail.notFoundDescription")}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <Card>
            <CardContent className="flex flex-col gap-5 pt-6 text-sm">
              <div className="flex items-center gap-4">
                <UserAvatar
                  user={{
                    first_name: user.first_name,
                    last_name: user.last_name,
                    username: user.username,
                  }}
                  className="h-16 w-16"
                />
                <div>
                  <p className="text-lg font-semibold">
                    {[user.first_name, user.last_name].filter(Boolean).join(" ") ||
                      user.username}
                  </p>
                  <p className="text-muted-foreground" dir="ltr">
                    @{user.username}
                  </p>
                </div>
                {user.is_superuser ? (
                  <Badge variant="outline" className="ms-auto">
                    {t("users.status.superuser")}
                  </Badge>
                ) : null}
              </div>

              <dl className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
                <div className="flex flex-col">
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    {t("users.fields.email")}
                  </dt>
                  <dd dir="ltr" className="break-all">
                    {user.email || "—"}
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    {t("users.fields.phone")}
                  </dt>
                  <dd dir="ltr">{user.phone || "—"}</dd>
                </div>
                <div className="flex flex-col">
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    {t("users.fields.language")}
                  </dt>
                  <dd>{LANGUAGE_NAMES[user.preferred_language] ?? user.preferred_language}</dd>
                </div>
                <div className="flex flex-col">
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    {t("users.fields.role")}
                  </dt>
                  <dd>
                    {user.role ? (
                      <Badge variant="secondary">
                        {t(`roles.${user.role.codename}.name`, { defaultValue: user.role.name })}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </dd>
                  {user.role ? (
                    <dd className="mt-1 text-xs text-muted-foreground">
                      {t(`roles.${user.role.codename}.description`, { defaultValue: "" })}
                      {t(`roles.${user.role.codename}.responsibilities`, { defaultValue: "" })
                        ? ` ${t(`roles.${user.role.codename}.responsibilities`, { defaultValue: "" })}`
                        : ""}
                    </dd>
                  ) : null}
                </div>
                <div className="flex flex-col">
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    {t("users.fields.staff")}
                  </dt>
                  <dd>{user.is_staff ? t("users.status.yes") : t("users.status.no")}</dd>
                </div>
                <div className="flex flex-col">
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    {t("users.fields.active")}
                  </dt>
                  <dd>
                    <Badge variant={user.is_active ? "success" : "destructive"}>
                      {user.is_active ? t("users.status.active") : t("users.status.inactive")}
                    </Badge>
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    {t("users.fields.lastLogin")}
                  </dt>
                  <dd dir="ltr">
                    {user.last_login
                      ? new Date(user.last_login).toLocaleString()
                      : t("users.status.never")}
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    {t("users.fields.dateJoined")}
                  </dt>
                  <dd dir="ltr">{new Date(user.date_joined).toLocaleDateString()}</dd>
                </div>
              </dl>

              {lifecycleError ? (
                <Alert variant="destructive">
                  <AlertDescription>
                    {lifecycleError.message || t("users.messages.saveFailed")}
                  </AlertDescription>
                </Alert>
              ) : null}

              {isSelf ? (
                <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                  {t("users.messages.selfDetailNote")}
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={user.is_active ? "destructive" : "default"}
                    onClick={() => setConfirm(user.is_active ? "deactivate" : "activate")}
                    disabled={activate.isPending || deactivate.isPending}
                  >
                    {user.is_active ? t("users.actions.deactivate") : t("users.actions.activate")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setPasswordChanged(false)
                      setShowPasswordForm((prev) => !prev)
                    }}
                    aria-expanded={showPasswordForm}
                  >
                    <KeyRound className="h-4 w-4" aria-hidden="true" />
                    {t("users.actions.setPassword")}
                  </Button>
                </div>
              )}

              {showPasswordForm && !isSelf ? (
                <div className="rounded-md border p-4">
                  <p className="mb-3 text-xs text-muted-foreground">
                    {t("users.confirm.setPasswordBody", { username: user.username })}
                  </p>
                  <form onSubmit={onSubmitPassword} className="flex flex-col gap-3" noValidate>
                    {passwordError ? (
                      <Alert variant="destructive">
                        <AlertDescription>
                          {passwordError.message || t("users.messages.saveFailed")}
                        </AlertDescription>
                      </Alert>
                    ) : null}
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="detail-password-new">{t("users.fields.newPassword")} *</Label>
                      <PasswordInput
                        id="detail-password-new"
                        autoComplete="new-password"
                        dir="ltr"
                        error={Boolean(errors.new_password)}
                        {...register("new_password")}
                      />
                      {errors.new_password ? (
                        <p className="text-xs text-destructive">{errors.new_password.message}</p>
                      ) : null}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="detail-password-confirm">
                        {t("users.fields.confirmPassword")} *
                      </Label>
                      <PasswordInput
                        id="detail-password-confirm"
                        autoComplete="new-password"
                        dir="ltr"
                        error={Boolean(errors.confirm_password)}
                        {...register("confirm_password")}
                      />
                      {errors.confirm_password ? (
                        <p className="text-xs text-destructive">
                          {errors.confirm_password.message}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" disabled={isSubmitting || setPassword.isPending}>
                        {isSubmitting || setPassword.isPending ? (
                          <Spinner size="sm" aria-hidden="true" />
                        ) : (
                          t("users.actions.savePassword")
                        )}
                      </Button>
                      <Button type="button" variant="ghost" onClick={() => setShowPasswordForm(false)}>
                        {t("common.cancel")}
                      </Button>
                    </div>
                  </form>
                </div>
              ) : null}

              {passwordChanged ? (
                <Alert variant="success" aria-live="polite">
                  <AlertDescription>{t("users.messages.passwordChanged")}</AlertDescription>
                </Alert>
              ) : null}

              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold">{t("users.permissions.title")}</h3>
                {user.permissions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">{t("users.permissions.empty")}</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {groupByModule(user.permissions).map(([module, codenames]) => (
                      <div key={module} className="flex flex-col gap-1">
                        <h4 className="text-xs font-semibold capitalize text-muted-foreground">
                          {t(`users.permissions.modules.${module}`, { defaultValue: module })}
                        </h4>
                        <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                          {codenames.map((codename) => (
                            <li key={codename} className="flex items-center gap-2 text-sm">
                              <Check className="h-3.5 w-3.5 shrink-0 text-green-600" aria-hidden="true" />
                              <span dir="ltr" className="text-xs">
                                {codename}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <X className="h-3 w-3" aria-hidden="true" />
                  {t("users.permissions.readOnlyNote")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <ConfirmActionDialog
        open={confirm === "activate" || confirm === "deactivate"}
        onOpenChange={(open) => {
          if (!open) setConfirm(null)
        }}
        kind={confirm ?? "activate"}
        username={user?.username ?? ""}
        pending={confirmPending}
        error={confirmError}
        onConfirm={runConfirmed}
      />
    </PageWrapper>
  )
}
