import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router-dom"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"

import { createLoginSchema, type LoginFormValues } from "../schemas"
import { useLogin } from "../hooks/useLogin"

import { PasswordInput } from "./PasswordInput"
import { RememberMe } from "./RememberMe"

export function LoginForm() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const login = useLogin()
  const loginSchema = useMemo(() => createLoginSchema(t), [t])

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "", remember_me: false },
  })

  const onSubmit = handleSubmit((values) => {
    login.mutate(values, {
      onSuccess: () => navigate("/dashboard", { replace: true }),
    })
  })

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {login.isError ? (
        <Alert variant="destructive">
          <AlertTitle>{t("auth.loginFailed")}</AlertTitle>
          <AlertDescription>{t("auth.loginFailedDescription")}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="username">{t("auth.username")}</Label>
        <Input id="username" autoComplete="username" error={Boolean(errors.username)} {...register("username")} />
        {errors.username ? <p className="text-xs text-destructive">{errors.username.message}</p> : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">{t("auth.password")}</Label>
        <PasswordInput
          id="password"
          autoComplete="current-password"
          error={Boolean(errors.password)}
          {...register("password")}
        />
        {errors.password ? <p className="text-xs text-destructive">{errors.password.message}</p> : null}
      </div>

      <div className="flex items-center justify-between">
        <RememberMe control={control} name="remember_me" />
        <Link to="/forgot-password" className="text-sm text-primary hover:underline">
          {t("auth.forgotPassword")}
        </Link>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          <>
            <Spinner size="sm" />
            {t("common.loading")}
          </>
        ) : (
          t("auth.login")
        )}
      </Button>
    </form>
  )
}
