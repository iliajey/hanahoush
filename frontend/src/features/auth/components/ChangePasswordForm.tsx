import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"

import { useChangePassword } from "../hooks/useChangePassword"
import { createChangePasswordSchema, type ChangePasswordFormValues } from "../schemas"
import { PasswordInput } from "./PasswordInput"

export function ChangePasswordForm() {
  const { t } = useTranslation()
  const changePasswordSchema = useMemo(() => createChangePasswordSchema(t), [t])
  const [success, setSuccess] = useState(false)
  const changePassword = useChangePassword()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      old_password: "",
      new_password: "",
      confirm_password: "",
    },
  })

  const onSubmit = handleSubmit((values) => {
    setSuccess(false)
    changePassword.mutate(values, {
      onSuccess: () => {
        setSuccess(true)
        reset()
      },
    })
  })

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {success ? (
        <Alert>
          <AlertDescription>{t("auth.passwordChanged")}</AlertDescription>
        </Alert>
      ) : null}

      {changePassword.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{t("auth.resetFailed")}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="old_password">{t("auth.currentPassword")}</Label>
        <PasswordInput
          id="old_password"
          autoComplete="current-password"
          error={Boolean(errors.old_password)}
          {...register("old_password")}
        />
        {errors.old_password ? <p className="text-xs text-destructive">{errors.old_password.message}</p> : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="new_password">{t("auth.newPassword")}</Label>
        <PasswordInput
          id="new_password"
          autoComplete="new-password"
          error={Boolean(errors.new_password)}
          {...register("new_password")}
        />
        {errors.new_password ? <p className="text-xs text-destructive">{errors.new_password.message}</p> : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirm_password">{t("auth.confirmPassword")}</Label>
        <PasswordInput
          id="confirm_password"
          autoComplete="new-password"
          error={Boolean(errors.confirm_password)}
          {...register("confirm_password")}
        />
        {errors.confirm_password ? <p className="text-xs text-destructive">{errors.confirm_password.message}</p> : null}
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? (
          <>
            <Spinner size="sm" />
            {t("common.loading")}
          </>
        ) : (
          t("auth.changePassword")
        )}
      </Button>
    </form>
  )
}
