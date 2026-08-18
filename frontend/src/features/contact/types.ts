import type { Locale } from "@/i18n"

/** Field options the backend accepts. */
export type PreferredContact = "email" | "phone" | "any"
export type BudgetRange = "" | "under-10k" | "10k-25k" | "25k-50k" | "50k-100k" | "100k+"

/** Public contact form values (mirror of ContactSubmitSerializer). */
export interface ContactFormValues {
  name: string
  email: string
  phone: string
  company: string
  subject: string
  service_category: string
  project_type: string
  budget_range: string
  preferred_contact: PreferredContact
  message: string
  consent: boolean
  locale: Locale
  source: string
  /** Honeypot — robots fill it, humans never see it. */
  website: string
}

export interface ContactSubmissionResult {
  ok: boolean
  requestId?: string
  status?: string
  message?: string
  errors?: Record<string, string[]> | string[] | string | null
}

export interface ContactFieldsConfig {
  services?: string[]
  projectTypes?: string[]
  budgetRanges?: { label: string; value: string }[]
}