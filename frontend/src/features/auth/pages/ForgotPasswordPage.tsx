import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useMemo, useState } from "react"

import { requestPasswordReset } from "../api/authApi"
import { createForgotPasswordSchema, type ForgotPasswordFormValues } from "../schemas"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"

import { useLanguage } from "@/app/language/useLanguage"
import { useSeoMeta } from "@/features/cms/seo"
import { AuthShell } from "./AuthShell"

export function ForgotPasswordPage() {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const [sent, setSent] = useState(false)
  const forgotPasswordSchema = useMemo(() => createForgotPasswordSchema(t), [t])

  useSeoMeta({ title: t("auth.forgotPassword"), robots: "noindex,follow" }, language)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  })

  const mutation = useMutation({
    mutationFn: requestPasswordReset,
    onSuccess: () => setSent(true),
  })

  const onSubmit = handleSubmit((values) => {
    mutation.mutate(values)
  })

  return (
    <AuthShell title={t("auth.forgotPassword")} description={t("auth.forgotPasswordDescription")}>
      {sent ? (
        <Alert variant="success">
          <AlertTitle>{t("auth.resetLinkSent")}</AlertTitle>
          <AlertDescription>{t("auth.checkEmail")}</AlertDescription>
        </Alert>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {mutation.isError ? (
            <Alert variant="destructive">
              <AlertTitle>{t("errors.unexpected")}</AlertTitle>
              <AlertDescription>{t("auth.resetLinkError")}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">{t("auth.email")}</Label>
            <Input id="email" type="email" autoComplete="email" error={Boolean(errors.email)} {...register("email")} />
            {errors.email ? <p className="text-xs text-destructive">{errors.email.message}</p> : null}
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Spinner size="sm" />
                {t("common.loading")}
              </>
            ) : (
              t("auth.sendResetLink")
            )}
          </Button>
        </form>
      )}
    </AuthShell>
  )
}
