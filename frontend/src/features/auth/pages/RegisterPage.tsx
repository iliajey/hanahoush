import { useTranslation } from "react-i18next"

import { AuthShell } from "./AuthShell"
import { RegisterForm } from "../components/RegisterForm"

export function RegisterPage() {
  const { t } = useTranslation()

  return (
    <AuthShell title={t("auth.register")} description={t("auth.registerDescription")}>
      <RegisterForm />
      <p className="mt-4 text-center text-sm text-muted-foreground">
        {t("auth.hasAccount")}{" "}
        <a href="/login" className="text-primary hover:underline">
          {t("auth.login")}
        </a>
      </p>
    </AuthShell>
  )
}
