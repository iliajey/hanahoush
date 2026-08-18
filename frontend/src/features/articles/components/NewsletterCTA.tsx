import { useEffect, useRef, useState } from "react"
import type { FormEvent } from "react"
import { CheckCircle2, Mail, Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useLanguage } from "@/app/language/useLanguage"
import { newsletterAnalytics } from "@/features/analytics/domains"
import { subscribeNewsletter } from "../api"
import type { NewsletterState } from "../types"

/** Premium newsletter CTA (single subscription system). */
export function NewsletterCTA({
  source,
  title,
  description,
  className,
}: {
  source: string
  title: string
  description?: string
  className?: string
}) {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const [email, setEmail] = useState("")
  const [state, setState] = useState<NewsletterState>({ kind: "idle" })
  const submitting = useRef(false)

  useEffect(() => {
    newsletterAnalytics.view()
  }, [])

  const submit = async (event?: FormEvent) => {
    event?.preventDefault()
    if (!email.trim() || submitting.current) return
    submitting.current = true
    setState({ kind: "loading" })
    newsletterAnalytics.submit(source)
    try {
      const result = await subscribeNewsletter(email.trim(), language, source)
      if (result.ok) {
        newsletterAnalytics.success()
        setState({ kind: "success" })
        setEmail("")
      } else if (result.status === 409) {
        newsletterAnalytics.duplicate()
        setState({ kind: "duplicate" })
      } else {
        newsletterAnalytics.error()
        setState({ kind: "error", message: result.message })
      }
    } finally {
      submitting.current = false
    }
  }

  return (
    <div className={`rounded-3xl border bg-card p-8 sm:p-10 ${className ?? ""}`}>
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
          <Mail className="h-6 w-6" />
        </div>
        <h3 className="text-2xl font-bold">{title}</h3>
        {description ? <p className="text-muted-foreground">{description}</p> : null}

        {state.kind === "success" ? (
          <p className="inline-flex items-center gap-2 font-medium text-emerald-600">
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" /> {t("newsletter.success")}
          </p>
        ) : (
          <form
            className="flex w-full max-w-sm gap-2"
            aria-label={t("newsletter.title")}
            onSubmit={(event) => void submit(event)}
          >
            <Input
              type="email"
              placeholder={t("newsletter.emailPlaceholder")}
              className="h-10"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={state.kind === "loading"}
              aria-label={t("contact.email")}
            />
            <Button type="submit" className="h-10" disabled={state.kind === "loading" || !email.trim()}>
              {state.kind === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : t("newsletter.subscribe")}
            </Button>
          </form>
        )}

        <div aria-live="polite" className="flex flex-col items-center gap-2">
          {state.kind === "duplicate" ? (
            <p className="text-sm text-amber-600">{t("newsletter.duplicate")}</p>
          ) : null}
          {state.kind === "error" ? (
            <p className="text-sm text-destructive">{t("newsletter.error")}</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}