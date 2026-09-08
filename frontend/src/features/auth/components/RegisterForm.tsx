import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router-dom"

import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"

import { register as registerApi } from "../api/authApi"
import { createRegisterSchema, type RegisterFormValues } from "../schemas"
import { PasswordInput } from "./PasswordInput"

export function RegisterForm() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const registerSchema = useMemo(() => createRegisterSchema(t), [t])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      password: "",
      confirm_password: "",
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      await registerApi(values)
      navigate("/login", { replace: true })
    } catch {
      // Error handled by alert below
    }
  })

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Alert variant="destructive" className="hidden" id="register-error" />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="username">{t("auth.username")} *</Label>
        <Input id="username" autoComplete="username" error={Boolean(errors.username)} {...register("username")} />
        {errors.username ? <p className="text-xs text-destructive">{errors.username.message}</p> : null}
      </div>

      <div className="grid grid-cols-2 gap-3">
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

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">{t("auth.email")} *</Label>
        <Input id="email" type="email" autoComplete="email" error={Boolean(errors.email)} {...register("email")} />
        {errors.email ? <p className="text-xs text-destructive">{errors.email.message}</p> : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone">{t("auth.phone")}</Label>
        <Input id="phone" type="tel" autoComplete="tel" error={Boolean(errors.phone)} {...register("phone")} />
        {errors.phone ? <p className="text-xs text-destructive">{errors.phone.message}</p> : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">{t("auth.password")} *</Label>
        <PasswordInput id="password" autoComplete="new-password" error={Boolean(errors.password)} {...register("password")} />
        {errors.password ? <p className="text-xs text-destructive">{errors.password.message}</p> : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirm_password">{t("auth.confirmPassword")} *</Label>
        <PasswordInput
          id="confirm_password"
          autoComplete="new-password"
          error={Boolean(errors.confirm_password)}
          {...register("confirm_password")}
        />
        {errors.confirm_password ? <p className="text-xs text-destructive">{errors.confirm_password.message}</p> : null}
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          <>
            <Spinner size="sm" />
            {t("common.loading")}
          </>
        ) : (
          t("auth.register")
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t("auth.hasAccount")}{" "}
        <Link to="/login" className="text-primary hover:underline">
          {t("auth.login")}
        </Link>
      </p>
    </form>
  )
}
