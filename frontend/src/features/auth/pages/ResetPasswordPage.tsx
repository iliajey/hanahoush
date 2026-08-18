import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useMemo } from "react"
import { Link, useSearchParams } from "react-router-dom"

import { confirmPasswordReset } from "../api/authApi"
import { createResetPasswordSchema, type ResetPasswordFormValues } from "../schemas"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"

import { useLanguage } from "@/app/language/useLanguage"
import { useSeoMeta } from "@/features/cms/seo"
import { PasswordInput } from "../components/PasswordInput"
import { AuthShell } from "./AuthShell"

export function ResetPasswordPage() {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const [searchParams] = useSearchParams()
  const uid = searchParams.get("uid") ?? ""
  const token = searchParams.get("token") ?? ""
  const validLink = Boolean(uid && token)
  const resetPasswordSchema = useMemo(() => createResetPasswordSchema(t), [t])

  useSeoMeta({ title: t("auth.resetPassword"), robots: "noindex,follow" }, language)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { new_password: "", confirm_password: "" },
  })

  const mutation = useMutation({
    mutationFn: (values: ResetPasswordFormValues) =>
      confirmPasswordReset({ uid, token, new_password: values.new_password }),
  })

  const onSubmit = handleSubmit((values) => mutation.mutate(values))

  return (
    <AuthShell title={t("auth.resetPassword")} description={t("auth.resetPasswordDescription")}>
      {!validLink ? (
        <Alert variant="destructive">
          <AlertTitle>{t("auth.invalidResetLink")}</AlertTitle>
          <AlertDescription>
            <Link to="/forgot-password" className="underline">
              {t("auth.requestNewLink")}
            </Link>
          </AlertDescription>
        </Alert>
      ) : mutation.isSuccess ? (
        <Alert variant="success">
          <AlertTitle>{t("auth.passwordResetSuccess")}</AlertTitle>
          <AlertDescription>
            <Link to="/login" className="underline">
              {t("auth.goToLogin")}
            </Link>
          </AlertDescription>
        </Alert>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {mutation.isError ? (
            <Alert variant="destructive">
              <AlertTitle>{t("auth.resetFailed")}</AlertTitle>
              <AlertDescription>{t("errors.unexpected")}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new_password">{t("auth.newPassword")}</Label>
            <PasswordInput id="new_password" error={Boolean(errors.new_password)} {...register("new_password")} />
            {errors.new_password ? <p className="text-xs text-destructive">{errors.new_password.message}</p> : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirm_password">{t("auth.confirmPassword")}</Label>
            <PasswordInput
              id="confirm_password"
              error={Boolean(errors.confirm_password)}
              {...register("confirm_password")}
            />
            {errors.confirm_password ? (
              <p className="text-xs text-destructive">{errors.confirm_password.message}</p>
            ) : null}
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Spinner size="sm" />
                {t("common.loading")}
              </>
            ) : (
              t("auth.resetPassword")
            )}
          </Button>
        </form>
      )}
    </AuthShell>
  )
}
