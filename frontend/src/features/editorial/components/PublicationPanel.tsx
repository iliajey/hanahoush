import { useContext, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { CalendarClock, CheckCircle2, Loader2, Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ToastContext } from "@/components/ui/toast"

export interface BlockingIssue {
  field: string
  locale: string | null
  message: string
}

export interface LocaleCompleteness {
  fa: boolean
  en: boolean
  ar: boolean
}

export function PublicationPanel({
  status,
  workflowStage,
  scheduledFor,
  publishedAt,
  canSubmit,
  canSchedule,
  canPublish,
  pending,
  blocking,
  actionError,
  localeCompleteness,
  onSubmit,
  onSchedule,
  onPublish,
}: {
  status: string
  workflowStage: string
  scheduledFor?: string | null
  publishedAt?: string | null
  canSubmit: boolean
  canSchedule: boolean
  canPublish: boolean
  pending?: boolean
  /** Backend-authoritative blockers (from failed schedule/publish attempts). */
  blocking?: BlockingIssue[]
  actionError?: string | null
  /** Per-locale content completeness (from the studio form state). */
  localeCompleteness?: LocaleCompleteness
  onSubmit?: () => void
  onSchedule?: (when: string) => void
  onPublish?: (soft: boolean) => void
}) {
  const [when, setWhen] = useState("")
  const { t } = useTranslation()
  // Toast is best-effort here so studio unit tests can render the panel
  // without a provider; in the app the ToastProvider is always present.
  const toastCtx = useContext(ToastContext)
  const notify = toastCtx?.toast ?? (() => "")
  const ready = workflowStage === "approved" || workflowStage === "scheduled"
  const blocked = (blocking ?? []).length > 0
  const [justPublished, setJustPublished] = useState(false)
  const [justScheduled, setJustScheduled] = useState(false)

  const awaitingRef = useRef<"publish" | "schedule" | null>(null)

  const handlePublish = () => {
    setJustPublished(false)
    setJustScheduled(false)
    awaitingRef.current = "publish"
    onPublish?.(false)
  }
  const handleSchedule = () => {
    if (!when) return
    setJustPublished(false)
    setJustScheduled(false)
    awaitingRef.current = "schedule"
    onSchedule?.(new Date(when).toISOString())
  }

  // Success feedback only after the mutation settles without blockers/errors.
  const failed = blocked || Boolean(actionError)
  useEffect(() => {
    if (awaitingRef.current && !pending) {
      const kind = awaitingRef.current
      awaitingRef.current = null
      if (!failed) {
        if (kind === "publish") {
          setJustPublished(true)
          notify({ title: t("publication.publishedOk"), variant: "success" })
        } else {
          setJustScheduled(true)
          notify({ title: t("publication.scheduledOk"), variant: "success" })
        }
      }
    }
  }, [pending, failed, notify, t])
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Publication</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground">Status:</span>
          <Badge variant="outline">{status}</Badge>
          <span className="text-muted-foreground">Workflow:</span>
          <Badge variant="secondary">{workflowStage}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Scheduled: {scheduledFor ? new Date(scheduledFor).toLocaleString() : "—"} · Published:{" "}
          {publishedAt ? new Date(publishedAt).toLocaleString() : "—"}
        </p>
        {localeCompleteness ? (
          <p className="flex flex-wrap items-center gap-1.5 text-xs" role="group" aria-label="Locale readiness">
            {(["en", "fa", "ar"] as const).map((locale) => {
              const ok = localeCompleteness[locale]
              return (
                <span
                  key={locale}
                  title={`${locale.toUpperCase()} — ${ok ? "complete" : "incomplete"}`}
                  aria-label={`${locale.toUpperCase()} — ${ok ? "complete" : "incomplete"}`}
                  className={`inline-flex items-center gap-0.5 font-medium tabular-nums ${ok ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}
                >
                  <span aria-hidden="true">{ok ? "●" : "○"}</span>
                  {locale.toUpperCase()}
                </span>
              )
            })}
          </p>
        ) : null}
        <div className="flex flex-col gap-2">
          {canSubmit ? (
            <Button type="button" variant="outline" size="sm" disabled={pending} onClick={onSubmit}>
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Send className="h-3.5 w-3.5" aria-hidden="true" />}
              Submit for review
            </Button>
          ) : null}
          {ready && canSchedule ? (
            <div className="flex items-center gap-1.5">
              <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="h-8 text-xs" aria-label="Schedule publish time" />
              <Button type="button" size="sm" variant="outline" className="h-8 px-2 active:scale-95 transition-transform" disabled={!when || pending} onClick={handleSchedule}>
                <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" /> Schedule
              </Button>
            </div>
          ) : null}
          {ready && canPublish ? (
            <Button type="button" size="sm" className="active:scale-95 transition-transform" disabled={pending} onClick={handlePublish}>
              Publish now
            </Button>
          ) : null}
          {justPublished ? (
            <p role="status" className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              {t("publication.publishedOk")}{" "}
              <a href="/dashboard/timeline" className="font-semibold underline underline-offset-2">
                {t("publication.openTimeline")}
              </a>
            </p>
          ) : null}
          {justScheduled ? (
            <p role="status" className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              {t("publication.scheduledOk")}{" "}
              <a href="/dashboard/timeline" className="font-semibold underline underline-offset-2">
                {t("publication.openTimeline")}
              </a>
            </p>
          ) : null}
          {blocked ? (
            <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-2 text-xs">
              <p className="font-medium">Scheduling blocked — fix these first:</p>
              <ul className="mt-1 list-disc space-y-0.5 ps-4">
                {blocking!.map((b, i) => (
                  <li key={i} dir="auto">
                    {b.locale ? `${b.locale.toUpperCase()} · ` : ""}{b.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {actionError ? (
            <p role="alert" className="text-xs text-destructive" dir="auto">{actionError}</p>
          ) : null}
          {!ready && !canSubmit ? (
            <p className="text-xs text-muted-foreground">
              {workflowStage === "in_review" || workflowStage === "seo_review"
                ? "This content is awaiting review."
                : "Publishing unavailable for stage/role."}
            </p>
          ) : null}
          {ready && !canSchedule && !canPublish ? (
            <p className="text-xs text-muted-foreground">
              You can edit this content, but you do not have permission to publish it.
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
