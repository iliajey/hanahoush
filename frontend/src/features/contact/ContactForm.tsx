import { useEffect, useMemo, useRef, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { CheckCircle2, Loader2, Send } from "lucide-react"
import { z } from "zod"

import { useLanguage } from "@/app/language/useLanguage"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/shared/lib/cn"

import { submitContact } from "./api"
import { contactAnalytics } from "./analytics"
import type { ContactFieldsConfig, ContactFormValues } from "./types"

/**
 * Production contact / inquiry form.
 *
 * - react-hook-form + zod validation (localized messages)
 * - honeypot field (hidden), duplicate-submission guard
 * - loading / success / error states announced via aria-live
 * - accessible labels + aria-invalid + associated error text
 * - analytics: contact_form_view / start / submit / success / error
 */
export function ContactForm({
  config = {},
  className,
}: {
  config?: ContactFieldsConfig
  className?: string
}) {
  const { t } = useTranslation()
  const { language } = useLanguage()

  const [state, setState] = useState<
    | { kind: "idle" }
    | { kind: "loading" }
    | { kind: "success"; requestId?: string }
    | { kind: "error"; message?: string }
  >({ kind: "idle" })

  const submitGuard = useRef(false)
  const started = useRef(false)
  const successRef = useRef<HTMLHeadingElement>(null)

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().trim().min(1, t("contact.validation.nameRequired")),
        email: z
          .string()
          .trim()
          .min(1, t("contact.validation.emailRequired"))
          .email(t("contact.validation.emailInvalid")),
        phone: z.string().trim().max(20).optional().or(z.literal("")),
        company: z.string().trim().max(255).optional().or(z.literal("")),
        subject: z.string().trim().max(255).optional().or(z.literal("")),
        service_category: z.string().optional().or(z.literal("")),
        project_type: z.string().optional().or(z.literal("")),
        budget_range: z.string().optional().or(z.literal("")),
        preferred_contact: z.enum(["email", "phone", "any"]).default("any"),
        message: z.string().trim().min(1, t("contact.validation.messageRequired")),
        consent: z.literal(true, { errorMap: () => ({ message: t("contact.validation.consentRequired") }) }),
        website: z.string(),
      }),
    [t],
  )

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(schema as never),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      subject: "",
      service_category: "",
      project_type: "",
      budget_range: "",
      preferred_contact: "any",
      message: "",
      consent: false as unknown as boolean,
      website: "",
    },
  })

  useEffect(() => {
    contactAnalytics.view()
  }, [])

  useEffect(() => {
    if (state.kind === "success") {
      successRef.current?.focus()
    }
  }, [state.kind])

  const onSubmit = handleSubmit(async (values) => {
    if (submitGuard.current) return
    submitGuard.current = true
    setState({ kind: "loading" })
    contactAnalytics.submit()
    const result = await submitContact({ ...values, locale: language, source: "/contact" })
    submitGuard.current = false
    if (result.ok) {
      setState({ kind: "success", requestId: result.requestId })
    } else {
      setState({ kind: "error", message: result.message })
    }
  })

  const markStarted = () => {
    if (!started.current) {
      started.current = true
      contactAnalytics.start()
    }
  }

  const budgetOptions = [
    { value: "", label: t("contact.budgetRange") },
    { value: "under-10k", label: t("contact.budgetUnder10k") },
    { value: "10k-25k", label: t("contact.budget10to25") },
    { value: "25k-50k", label: t("contact.budget25to50") },
    { value: "50k-100k", label: t("contact.budget50to100") },
    { value: "100k+", label: t("contact.budgetOver100") },
  ]

  const services =
    config.services?.length
      ? config.services
      : [
          t("contact.serviceOptions.erp"),
          t("contact.serviceOptions.software"),
          t("contact.serviceOptions.web"),
          t("contact.serviceOptions.ai"),
          t("contact.serviceOptions.odoo"),
          t("contact.serviceOptions.consulting"),
        ]
  const projectTypes = config.projectTypes?.length
    ? config.projectTypes
    : [
        t("contact.projectTypes.enterprise"),
        t("contact.projectTypes.web"),
        t("contact.projectTypes.mobile"),
        t("contact.projectTypes.other"),
      ]

  return (
    <form
      onSubmit={(e) => {
        markStarted()
        void onSubmit(e)
      }}
      className={cn("mx-auto max-w-2xl rounded-3xl border bg-card p-6 sm:p-8", className)}
      noValidate
    >
      {/* Honeypot — hidden from humans, a trap for bots. */}
      <div className="sr-only" aria-hidden="true">
        <Label htmlFor="contact-website">Website</Label>
        <Input
          id="contact-website"
          tabIndex={-1}
          autoComplete="off"
          {...register("website")}
        />
      </div>

      <div aria-live="polite" className="mb-6">
        {state.kind === "success" ? (
          <div className="flex flex-col items-start gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
            <h3 ref={successRef} tabIndex={-1} className="inline-flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              {t("contact.successTitle")}
            </h3>
            <p className="text-sm text-muted-foreground">{t("contact.successBody")}</p>
          </div>
        ) : null}
        {state.kind === "error" ? (
          <div role="alert" className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            <strong className="block font-semibold">{t("contact.errorTitle")}</strong>
            <span>{t("contact.errorBody")}</span>
          </div>
        ) : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contact-name">{t("contact.name")} *</Label>
          <Input
            id="contact-name"
            autoComplete="name"
            error={Boolean(errors.name)}
            aria-describedby={errors.name ? "contact-name-error" : undefined}
            {...register("name")}
            onChange={(e) => {
              markStarted()
              void register("name").onChange(e)
            }}
          />
          {errors.name ? (
            <p id="contact-name-error" className="text-xs text-destructive">{errors.name.message}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contact-email">{t("contact.email")} *</Label>
          <Input
            id="contact-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            error={Boolean(errors.email)}
            aria-describedby={errors.email ? "contact-email-error" : undefined}
            {...register("email")}
          />
          {errors.email ? (
            <p id="contact-email-error" className="text-xs text-destructive">{errors.email.message}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contact-phone">{t("contact.phone")}</Label>
          <Input id="contact-phone" type="tel" inputMode="tel" autoComplete="tel" {...register("phone")} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contact-company">{t("contact.company")}</Label>
          <Input id="contact-company" autoComplete="organization" {...register("company")} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contact-subject">{t("contact.subject")}</Label>
          <Input id="contact-subject" {...register("subject")} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>{t("contact.serviceCategory")}</Label>
          <Controller
            control={control}
            name="service_category"
            render={({ field }) => (
              <Select value={field.value || undefined} onValueChange={field.onChange}>
                <SelectTrigger id="contact-service" aria-label={t("contact.serviceCategory")}>
                  <SelectValue placeholder={t("contact.serviceCategory")} />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service} value={service}>
                      {service}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>{t("contact.projectType")}</Label>
          <Controller
            control={control}
            name="project_type"
            render={({ field }) => (
              <Select value={field.value || undefined} onValueChange={field.onChange}>
                <SelectTrigger id="contact-project-type" aria-label={t("contact.projectType")}>
                  <SelectValue placeholder={t("contact.projectType")} />
                </SelectTrigger>
                <SelectContent>
                  {projectTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>{t("contact.budgetRange")}</Label>
          <Controller
            control={control}
            name="budget_range"
            render={({ field }) => (
              <Select value={field.value || undefined} onValueChange={field.onChange}>
                <SelectTrigger id="contact-budget" aria-label={t("contact.budgetRange")}>
                  <SelectValue placeholder={t("contact.budgetRange")} />
                </SelectTrigger>
                <SelectContent>
                  {budgetOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium leading-none">{t("contact.preferredContact")}</legend>
          <div className="flex flex-wrap gap-3 pt-1">
            {[
              { value: "any", label: t("contact.preferredAny") },
              { value: "email", label: t("contact.preferredEmail") },
              { value: "phone", label: t("contact.preferredPhone") },
            ].map((option) => (
              <label key={option.value} className="flex items-center gap-1.5 text-sm">
                <input
                  type="radio"
                  value={option.value}
                  className="h-4 w-4 accent-primary"
                  {...register("preferred_contact")}
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="contact-message">{t("contact.message")} *</Label>
          <Textarea
            id="contact-message"
            rows={5}
            error={Boolean(errors.message)}
            aria-describedby={errors.message ? "contact-message-error" : undefined}
            {...register("message")}
          />
          {errors.message ? (
            <p id="contact-message-error" className="text-xs text-destructive">{errors.message.message}</p>
          ) : null}
        </div>

        <div className="flex items-start gap-2.5 sm:col-span-2">
          <Controller
            control={control}
            name="consent"
            render={({ field }) => (
              <Checkbox
                id="contact-consent"
                checked={Boolean(field.value)}
                onCheckedChange={(checked) => field.onChange(checked === true)}
                aria-describedby={errors.consent ? "contact-consent-error" : undefined}
              />
            )}
          />
          <div className="flex flex-col gap-1">
            <label htmlFor="contact-consent" className="text-sm">
              {t("contact.consent")} *
            </label>
            {errors.consent ? (
              <p id="contact-consent-error" className="text-xs text-destructive">{errors.consent.message}</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end">
        <Button type="submit" size="lg" disabled={isSubmitting || state.kind === "success"}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {t("contact.submitting")}
            </>
          ) : (
            <>
              <Send className="h-4 w-4" aria-hidden="true" />
              {t("contact.submit")}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}