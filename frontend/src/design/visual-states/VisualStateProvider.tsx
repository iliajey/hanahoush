import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react"
import type { ReactNode } from "react"

import { visualStateTokens, visualStateVars, type VisualState } from "./index"

interface VisualStateContextValue {
  /** The visual state currently in the viewport. */
  state: VisualState
}

const VisualStateContext = createContext<VisualStateContextValue>({ state: "default" })

/** Read the active visual state (for consumers that need the value). */
export function useVisualState(): VisualState {
  return useContext(VisualStateContext).state
}

const selector = "[data-visual-state]"

function applyState(state: VisualState): void {
  if (typeof document === "undefined") return
  const s = visualStateTokens[state]
  const root = document.documentElement
  root.style.setProperty(visualStateVars.gridSize, `${s.gridSize}px`)
  root.style.setProperty(visualStateVars.gridScale, String(s.gridScale))
  root.style.setProperty(visualStateVars.energyOpacity, String(s.energyOpacity))
  root.style.setProperty(visualStateVars.energySize, `${s.energySize}px`)
  root.style.setProperty(visualStateVars.energyX, s.energyX)
  root.style.setProperty(visualStateVars.energyY, s.energyY)
  root.style.setProperty(visualStateVars.meshOpacity, String(s.meshOpacity))
}

/**
 * Observes `[data-visual-state]` sections (annotated by the Page Builder
 * renderer) and publishes the active visual state on `document.documentElement`
 * CSS custom properties consumed by the living background.
 *
 * Selection: the intersecting section with the highest visibility; ties break
 * toward the section lower on the page (the natural "current" one while the
 * user scrolls). Falls back to `default` when nothing intersects.
 */
export function VisualStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<VisualState>("default")
  const stateRef = useRef<VisualState>("default")
  const entriesRef = useRef<Map<Element, IntersectionObserverEntry>>(new Map())
  const stateRefApplied = useRef<VisualState | null>(null)

  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      return undefined
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) entriesRef.current.set(entry.target, entry)
        evaluate()
      },
      { rootMargin: "0px 0px -10% 0px", threshold: [0, 0.15, 0.4, 0.7] },
    )

    const roots = new Set<HTMLElement>()

    const evaluate = () => {
      let best: { state: VisualState; score: number; top: number } | null = null
      for (const [target, entry] of entriesRef.current) {
        if (!entry.isIntersecting) continue
        const st = target.getAttribute("data-visual-state") as VisualState | null
        if (!st || !(st in visualStateTokens)) continue
        const score = entry.intersectionRatio || 0.1
        const rect = entry.boundingClientRect
        if (!best || score > best.score + 1e-6 || (Math.abs(score - best.score) <= 1e-6 && rect.top > best.top)) {
          best = { state: st, score, top: rect.top }
        }
      }
      const next: VisualState = best?.state ?? stateRef.current
      if (best) stateRef.current = best.state
      if (next !== stateRefApplied.current) {
        stateRefApplied.current = next
        applyState(next)
        setState(next)
      }
    }

    const reconcile = () => {
      const found = Array.from(document.querySelectorAll<HTMLElement>(selector))
      const foundSet = new Set(found)
      for (const el of found) {
        if (!roots.has(el)) {
          roots.add(el)
          observer.observe(el)
        }
      }
      for (const el of roots) {
        if (!foundSet.has(el)) {
          observer.unobserve(el)
          roots.delete(el)
          entriesRef.current.delete(el)
        }
      }
      // Seed entries for elements that are already in view (the IO stub in
      // tests fires immediately; browsers fire on the first intersection).
      if (found.length > 0) evaluate()
    }

    const mutationObserver =
      typeof MutationObserver !== "undefined"
        ? new MutationObserver(() => reconcile())
        : null

    if (document.body) mutationObserver?.observe(document.body, { childList: true, subtree: true })

    reconcile()
    applyState("default")

    return () => {
      mutationObserver?.disconnect()
      observer.disconnect()
      entriesRef.current.clear()
    }
  }, [])

  const memoChildren = useMemo(() => children, [children])
  const value = useMemo(() => ({ state }), [state])

  return <VisualStateContext.Provider value={value}>{memoChildren}</VisualStateContext.Provider>
}