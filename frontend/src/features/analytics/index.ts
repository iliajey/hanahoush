import { useEffect, useRef, useState } from "react"

import { enqueueAnalyticsEvent } from "./persistence"

/** Lightweight client analytics: events, section visibility and scroll depth. */

export interface AnalyticsEvent {
  id: number
  name: string
  payload: Record<string, unknown>
  at: number
}

let nextId = 1
const events: AnalyticsEvent[] = []
const listeners = new Set<() => void>()
const MAX_EVENTS = 200

function emit() {
  listeners.forEach((listener) => listener())
}

/** Record an analytics event (e.g. cta_click, accordion_open, section_visible). */
export function trackEvent(name: string, payload: Record<string, unknown> = {}): void {
  const event: AnalyticsEvent = { id: nextId++, name, payload, at: Date.now() }
  events.unshift(event)
  if (events.length > MAX_EVENTS) events.length = MAX_EVENTS
  enqueueAnalyticsEvent(name, payload, event.at)
  if (import.meta.env.DEV) {
    console.debug("[analytics]", name, payload)
  }
  emit()
}

export function getAnalyticsEvents(): AnalyticsEvent[] {
  return events
}

export function clearAnalyticsEvents(): void {
  events.length = 0
  emit()
}

/** Reactive subscription to the analytics event stream. */
export function useAnalyticsEvents(): AnalyticsEvent[] {
  const [state, setState] = useState<AnalyticsEvent[]>(getAnalyticsEvents)
  useEffect(() => {
    const update = () => setState(getAnalyticsEvents())
    listeners.add(update)
    return () => {
      listeners.delete(update)
    }
  }, [])
  return state
}

/** Fires a tracked event the first time an element enters the viewport. */
export function useSectionVisibility<T extends HTMLElement>(name: string, enabled = true) {
  const ref = useRef<T | null>(null)
  const fired = useRef(false)

  useEffect(() => {
    const node = ref.current
    if (!node || !enabled || fired.current || typeof IntersectionObserver === "undefined") return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          fired.current = true
          trackEvent("section_visible", { section: name })
          observer.disconnect()
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.15 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [name, enabled])

  return ref
}

const DEPTH_MILESTONES = [25, 50, 75, 100]

/** Tracks scroll-depth milestones (25/50/75/100%) as events. */
export function useScrollDepth(page: string): void {
  const reached = useRef<Set<number>>(new Set())

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement
      const max = doc.scrollHeight - window.innerHeight
      if (max <= 0) return
      const percent = Math.min(100, Math.round((window.scrollY / max) * 100))
      for (const milestone of DEPTH_MILESTONES) {
        if (percent >= milestone && !reached.current.has(milestone)) {
          reached.current.add(milestone)
          trackEvent("scroll_depth", { page, percent: milestone })
        }
      }
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [page])
}
