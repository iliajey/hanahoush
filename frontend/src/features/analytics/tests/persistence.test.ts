import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { clearAnalyticsEvents, trackEvent } from "@/features/analytics"
import {
  flushAnalyticsEvents,
  isAnalyticsPersistenceEnabled,
  setAnalyticsPersistenceEnabled,
} from "@/features/analytics/persistence"

describe("analytics persistence", () => {
  const fetchSpy = vi.fn()

  beforeEach(() => {
    fetchSpy.mockReset()
    vi.stubGlobal("fetch", fetchSpy)
    // Track locally without side effects.
    clearAnalyticsEvents()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    setAnalyticsPersistenceEnabled(false)
    vi.useRealTimers()
  })

  it("is disabled by default in test mode", () => {
    expect(isAnalyticsPersistenceEnabled()).toBe(false)
  })

  it("does not send anything while disabled", async () => {
    trackEvent("cta_click", {})
    await flushAnalyticsEvents()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it("batches tracked events and posts them when enabled", async () => {
    setAnalyticsPersistenceEnabled(true)
    fetchSpy.mockResolvedValue({ ok: true, status: 202, json: async () => ({}) } as Response)

    trackEvent("search_view", {})
    trackEvent("search_submit", { q: "erp" })
    expect(fetchSpy).not.toHaveBeenCalled() // still buffered

    await flushAnalyticsEvents()
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [url, init] = fetchSpy.mock.calls[0]
    expect(url).toContain("/analytics/events/")
    const body = JSON.parse(String(init.body))
    expect(body.events).toHaveLength(2)
    expect(body.events[0].event_name).toBe("search_view")
    expect(body.events[1].metadata).toMatchObject({ q: "erp" })
  })

  it("scrubs credential-like metadata before sending", async () => {
    setAnalyticsPersistenceEnabled(true)
    fetchSpy.mockResolvedValue({ ok: true, status: 202, json: async () => ({}) } as Response)
    trackEvent("event", { token: "secret-token", password: "p", category: "safe" })
    await flushAnalyticsEvents()
    const body = JSON.parse(String(fetchSpy.mock.calls[0][1].body))
    expect(body.events[0].metadata).toEqual({ category: "safe" })
    expect(JSON.stringify(body)).not.toContain("secret-token")
    expect(JSON.stringify(body)).not.toContain("password")
  })
})