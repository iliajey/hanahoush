import { beforeEach, describe, expect, it } from "vitest"

import { clearAnalyticsEvents, getAnalyticsEvents } from "@/features/analytics"
import { companyAnalytics, contactAnalytics, mediaAnalytics, newsletterAnalytics } from "@/features/analytics/domains"

describe("analytics domain helpers (Phase 8G)", () => {
  beforeEach(() => clearAnalyticsEvents())

  it("company events fire with the agreed names", () => {
    companyAnalytics.view()
    companyAnalytics.teamMemberClick(7)
    companyAnalytics.timelineInteraction(2)
    companyAnalytics.partnerClick("Arya")
    // events are stored newest-first; reverse to assert fire order
    const names = getAnalyticsEvents().map((e) => e.name).reverse()
    expect(names).toEqual(["about_view", "team_member_click", "timeline_interaction", "partner_click"])
  })

  it("contact events fire with the agreed names", () => {
    contactAnalytics.view()
    contactAnalytics.start()
    contactAnalytics.submit()
    contactAnalytics.success("req-123")
    contactAnalytics.error("Network error")
    // events are stored newest-first; reverse to assert fire order
    const names = getAnalyticsEvents().map((e) => e.name).reverse()
    expect(names).toEqual([
      "contact_form_view",
      "contact_form_start",
      "contact_submit",
      "contact_success",
      "contact_error",
    ])
  })

  it("media events fire with the agreed names", () => {
    mediaAnalytics.view()
    mediaAnalytics.select(3)
    mediaAnalytics.upload(true)
    // events are stored newest-first; reverse to assert fire order
    const names = getAnalyticsEvents().map((e) => e.name).reverse()
    expect(names).toEqual(["media_view", "media_select", "media_upload"])
  })

  it("newsletter events fire with the agreed names", () => {
    newsletterAnalytics.view()
    newsletterAnalytics.submit("articles-newsletter")
    newsletterAnalytics.success()
    newsletterAnalytics.duplicate()
    newsletterAnalytics.error()
    // events are stored newest-first; reverse to assert fire order
    const names = getAnalyticsEvents().map((e) => e.name).reverse()
    expect(names).toEqual([
      "newsletter_view",
      "newsletter_submit",
      "newsletter_success",
      "newsletter_duplicate",
      "newsletter_error",
    ])
  })

  it("contact success carries the request id payload", () => {
    contactAnalytics.success("req-abc")
    const [event] = getAnalyticsEvents()
    expect(event.payload).toEqual({ request_id: "req-abc" })
  })
})