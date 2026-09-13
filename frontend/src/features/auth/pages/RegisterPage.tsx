import { useTranslation } from "react-i18next"

import { AuthShell } from "./AuthShell"
import { RegisterForm } from "../components/RegisterForm"

export function RegisterPage() {
  const { t } = useTranslation()

  return (
    <AuthShell title={t("auth.register")} description={t("auth.registerDescription")}>
      <RegisterForm />
    </AuthShell>
  )
}
