import { useTranslation } from "react-i18next"

import { useLanguage } from "@/app/language/useLanguage"
import { useSeoMeta } from "@/features/cms/seo"
import { LoginForm } from "../components/LoginForm"

import { AuthShell } from "./AuthShell"

export function LoginPage() {
  const { t } = useTranslation()
  const { language } = useLanguage()

  useSeoMeta({ title: t("auth.login"), robots: "noindex,follow" }, language)

  return (
    <AuthShell
      title={t("auth.login")}
      description={t("auth.loginDescription")}
      footer={t("nav.home")}
    >
      <LoginForm />
    </AuthShell>
  )
}
