import { trackEvent } from "./index"

/**
 * Domain-level analytics helpers (Phase 8G).
 *
 * These are thin, typed wrappers around the single `trackEvent` system —
 * they do NOT introduce a parallel analytics mechanism. Each helper maps to
 * one of the agreed public event names so reporters and tests stay stable.
 */

/** About / company experience events. */
export const companyAnalytics = {
  view() {
    trackEvent("about_view", {})
  },
  teamMemberClick(id: number | undefined = undefined) {
    trackEvent("team_member_click", { id })
  },
  timelineInteraction(index: number) {
    trackEvent("timeline_interaction", { index })
  },
  partnerClick(name: string) {
    trackEvent("partner_click", { name })
  },
}

/** Contact / inquiry flow events. */
export const contactAnalytics = {
  view() {
    trackEvent("contact_form_view", {})
  },
  start() {
    trackEvent("contact_form_start", {})
  },
  submit() {
    trackEvent("contact_submit", {})
  },
  success(requestId?: string) {
    trackEvent("contact_success", { request_id: requestId })
  },
  error(code?: string) {
    trackEvent("contact_error", { code })
  },
}

/** Media library events. */
export const mediaAnalytics = {
  view() {
    trackEvent("media_view", {})
  },
  select(id: number | undefined = undefined) {
    trackEvent("media_select", { id })
  },
  upload(ok: boolean) {
    trackEvent("media_upload", { ok })
  },
}

/** Newsletter events (single subscription system). */
export const newsletterAnalytics = {
  view() {
    trackEvent("newsletter_view", {})
  },
  submit(source?: string) {
    trackEvent("newsletter_submit", { source })
  },
  success() {
    trackEvent("newsletter_success", {})
  },
  duplicate() {
    trackEvent("newsletter_duplicate", {})
  },
  error(code?: string) {
    trackEvent("newsletter_error", { code })
  },
}