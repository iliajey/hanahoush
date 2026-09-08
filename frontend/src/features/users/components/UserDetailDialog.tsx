/** User detail dialog (Phase 11.5): account facts, the user's effective
 * permissions grouped by module (read-only) and the controlled password
 * reset action. Existing passwords/hashes are never displayed or fetched.
 */
import { zodResolver } from "@hookform/resolvers/zod"
import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Check, KeyRound, X } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/features/auth/components/PasswordInput"
import { Spinner } from "@/components/ui/spinner"
import { toApiError } from "@/shared/api/axiosClient"
import { cn } from "@/shared/lib/cn"

import { useActivateUser, useDeactivateUser, useSetUserPassword } from "../hooks"
import { setPasswordFormSchema } from "../schemas"
import type { ManagedUser } from "../types"

interface UserDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: ManagedUser | null
  /** Signed-in Super Admin — self-protection rules are enforced by the
   * backend; the UI only disables the obviously unsafe controls. */
  currentUserId?: number
}

/** Module buckets used to group a user's effective permission codenames. */
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

export function UserDetailDialog({ open, onOpenChange, user, currentUserId }: UserDetailDialogProps) {
  const { t } = useTranslation()
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwordChanged, setPasswordChanged] = useState(false)
  const setPassword = useSetUserPassword()
  const activate = useActivateUser()
  const deactivate = useDeactivateUser()

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

  const isSelf = Boolean(user && currentUserId === user.id)
  const lifecycleError = activate.isError
    ? toApiError(activate.error)
    : deactivate.isError
      ? toApiError(deactivate.error)
      : null
  const passwordError = setPassword.isError ? toApiError(setPassword.error) : null

  const close = () => {
    setShowPasswordForm(false)
    setPasswordChanged(false)
    reset()
    onOpenChange(false)
  }

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

  const toggleActive = () => {
    if (!user) return
    if (user.is_active) {
      deactivate.mutate(user.id)
    } else {
      activate.mutate(user.id)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? undefined : close())}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{user ? user.username : ""}</DialogTitle>
        </DialogHeader>

        {user ? (
          <div className="flex flex-col gap-5 text-sm">
            <dl className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
              <div className="flex flex-col">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">{t("users.fields.name")}</dt>
                <dd>{[user.first_name, user.last_name].filter(Boolean).join(" ") || "—"}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">{t("users.fields.email")}</dt>
                <dd dir="ltr" className="break-all">{user.email || "—"}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">{t("users.fields.phone")}</dt>
                <dd dir="ltr">{user.phone || "—"}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">{t("users.fields.role")}</dt>
                <dd>
                  {user.role ? (
                    <Badge variant="secondary">
                      {t(`roles.${user.role.codename}.name`, { defaultValue: user.role.name })}
                    </Badge>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">{t("users.fields.staff")}</dt>
                <dd>{user.is_staff ? t("users.status.yes") : t("users.status.no")}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">{t("users.fields.active")}</dt>
                <dd>
                  <Badge variant={user.is_active ? "success" : "destructive"}>
                    {user.is_active ? t("users.status.active") : t("users.status.inactive")}
                  </Badge>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">{t("users.fields.lastLogin")}</dt>
                <dd dir="ltr">
                  {user.last_login ? new Date(user.last_login).toLocaleString() : t("users.status.never")}
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">{t("users.fields.dateJoined")}</dt>
                <dd dir="ltr">{new Date(user.date_joined).toLocaleDateString()}</dd>
              </div>
            </dl>

            {lifecycleError ? (
              <Alert variant="destructive">
                <AlertDescription>{lifecycleError.message || t("users.messages.saveFailed")}</AlertDescription>
              </Alert>
            ) : null}

            {isSelf ? (
              <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                {t("users.messages.selfDetailNote")}
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant={user.is_active ? "destructive" : "default"} onClick={toggleActive} disabled={activate.isPending || deactivate.isPending}>
                  {activate.isPending || deactivate.isPending ? (
                    <Spinner size="sm" aria-hidden="true" />
                  ) : user.is_active ? (
                    t("users.actions.deactivate")
                  ) : (
                    t("users.actions.activate")
                  )}
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

            {showPasswordForm ? (
              <form onSubmit={onSubmitPassword} className="flex flex-col gap-3 rounded-md border p-4" noValidate>
                {passwordError ? (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {passwordError.message || t("users.messages.saveFailed")}
                    </AlertDescription>
                  </Alert>
                ) : null}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="set-password-new">{t("users.fields.newPassword")} *</Label>
                  <PasswordInput
                    id="set-password-new"
                    autoComplete="new-password"
                    dir="ltr"
                    error={Boolean(errors.new_password)}
                    aria-describedby={errors.new_password ? "set-password-new-error" : undefined}
                    {...register("new_password")}
                  />
                  {errors.new_password ? (
                    <p id="set-password-new-error" className="text-xs text-destructive">
                      {errors.new_password.message}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="set-password-confirm">{t("users.fields.confirmPassword")} *</Label>
                  <PasswordInput
                    id="set-password-confirm"
                    autoComplete="new-password"
                    dir="ltr"
                    error={Boolean(errors.confirm_password)}
                    aria-describedby={errors.confirm_password ? "set-password-confirm-error" : undefined}
                    {...register("confirm_password")}
                  />
                  {errors.confirm_password ? (
                    <p id="set-password-confirm-error" className="text-xs text-destructive">
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
            ) : null}

            {passwordChanged ? (
              <Alert variant="success" aria-live="polite">
                <AlertDescription>{t("users.messages.passwordChanged")}</AlertDescription>
              </Alert>
            ) : null}

            {/* Read-only permission viewer grouped by module. */}
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
                            <span dir="ltr" className="text-xs">{codename}</span>
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
          </div>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={close}>
            {t("common.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Role catalog permission viewer — read-only, grouped by module. */
export function RolePermissionsDialog({
  open,
  onOpenChange,
  roles,
  isLoading,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  roles: Array<{
    id: number
    name: string
    codename: string
    permissions: Array<{ codename: string; name: string; module: string }>
  }>
  isLoading?: boolean
}) {
  const { t } = useTranslation()
  const [selected, setSelected] = useState<string | null>(null)

  const current = roles.find((role) => role.codename === selected) ?? roles[0] ?? null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{t("users.rolesDialog.title")}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Spinner size="sm" aria-hidden="true" />
            {t("common.loading")}
          </div>
        ) : current ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2" role="tablist" aria-label={t("users.rolesDialog.title")}>
              {roles.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  role="tab"
                  aria-selected={(current?.codename ?? null) === role.codename}
                  onClick={() => setSelected(role.codename)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition-colors",
                    (current?.codename ?? null) === role.codename
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:bg-muted",
                  )}
                >
                  {t(`roles.${role.codename}.name`, { defaultValue: role.name })}
                </button>
              ))}
            </div>

            {current.permissions.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t("users.permissions.empty")}</p>
            ) : (
              <ul className="flex flex-col gap-1" aria-live="polite">
                {current.permissions.map((permission) => (
                  <li key={permission.codename} className="flex items-center gap-2 text-sm">
                    <Check className="h-3.5 w-3.5 shrink-0 text-green-600" aria-hidden="true" />
                    <span>{t(`users.permissions.modules.${permission.module}`, { defaultValue: permission.module })}</span>
                    <span className="text-muted-foreground">·</span>
                    <span dir="ltr" className="text-xs text-muted-foreground">{permission.codename}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-muted-foreground">{t("users.permissions.readOnlyNote")}</p>
          </div>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            {t("common.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
