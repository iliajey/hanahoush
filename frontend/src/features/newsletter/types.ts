/** Newsletter subscriber types (staff admin API only). The unsubscribe token
 * is never exposed by the backend — it is never surfaced in the UI either. */
import type { PaginationMeta } from "@/shared/types/api"

export type NewsletterLocale = "fa" | "en" | "ar"

export interface NewsletterSubscriber {
  id: number
  email: string
  locale: NewsletterLocale
  source: string
  is_active: boolean
  is_subscribed: boolean
  unsubscribed_at: string | null
  created_at: string
  updated_at: string
}

export interface NewsletterListParams {
  page?: number
  pageSize?: number
  q?: string
  locale?: NewsletterLocale
  is_active?: boolean
  ordering?: string
}

export interface NewsletterListResult {
  items: NewsletterSubscriber[]
  pagination?: PaginationMeta
}

export interface NewsletterStateResult {
  id: number
  is_active: boolean
}