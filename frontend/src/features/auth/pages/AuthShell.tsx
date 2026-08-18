import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"

import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"

export interface AuthShellProps {
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
}

/** Centered card shell shared by the authentication pages. */
export function AuthShell({ title, description, children, footer }: AuthShellProps) {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-lg font-black text-white">
            ه
          </span>
          <span className="text-xl font-bold">{t("app.title")}</span>
        </div>
        <Card>
          <CardHeader>
            <h1 className="text-xl font-semibold leading-none tracking-tight">{title}</h1>
            {description ? <CardDescription>{description}</CardDescription> : null}
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
        {footer ? (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Link to="/" className="text-primary hover:underline">
              {footer}
            </Link>
          </p>
        ) : null}
      </div>
    </div>
  )
}
