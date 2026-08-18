import { beforeEach, describe, expect, it } from "vitest"

import {
  clearAnalyticsEvents,
  getAnalyticsEvents,
  trackEvent,
  useAnalyticsEvents,
} from "@/features/analytics"
import { renderHook, act } from "@testing-library/react"

describe("analytics", () => {
  beforeEach(() => clearAnalyticsEvents())

  it("records events with payload", () => {
    trackEvent("cta_click", { cta: "primary", label: "Start" })
    trackEvent("scroll_depth", { page: "services", percent: 50 })
    const events = getAnalyticsEvents()
    expect(events).toHaveLength(2)
    expect(events[0].name).toBe("scroll_depth")
    expect(events[1].payload).toMatchObject({ cta: "primary" })
  })

  it("observes events reactively", () => {
    const { result } = renderHook(() => useAnalyticsEvents())
    expect(result.current).toHaveLength(0)
    act(() => {
      trackEvent("accordion_open", { item: "faq-0" })
    })
    expect(result.current).toHaveLength(1)
    expect(result.current[0].name).toBe("accordion_open")
  })

  it("clears events", () => {
    trackEvent("x")
    clearAnalyticsEvents()
    expect(getAnalyticsEvents()).toHaveLength(0)
  })
})