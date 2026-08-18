/**
 * Hanahoush Living Cursor.
 *
 * Three-layer glowing cursor: a large ambient glow (slow lag), a core orb
 * (snappy), and a trailing ring (medium lag). Theme-aware via CSS variables
 * (`--ring`), GPU friendly (`translate3d` via the CSS `translate` property),
 * disabled on touch / low-perf and with `prefers-reduced-motion`.
 *
 * Primary pointer experience on fine-pointer desktops: while enabled the
 * system cursor is suppressed with CSS (`html.hh-live-cursor`) and the living
 * cursor morphs per element state (link / button / card / draggable / text /
 * disabled). Text-entry surfaces keep the native I-beam; keyboard navigation,
 * touch and reduced-motion users are completely unaffected.
 */
import { useEffect, useRef, useState } from "react"

import { classifyCursorState, cursorTokens, type CursorState } from "./index"

/** Detect whether the living cursor should be active. */
export function useCursorEnabled(): boolean {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)")
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    const lowPerf =
      typeof navigator.hardwareConcurrency === "number" &&
      navigator.hardwareConcurrency > 0 &&
      navigator.hardwareConcurrency < cursorTokens.performance.minConcurrency

    const compute = () => {
      setEnabled(finePointer.matches && !reducedMotion.matches && !lowPerf)
    }

    compute()
    finePointer.addEventListener("change", compute)
    reducedMotion.addEventListener("change", compute)
    return () => {
      finePointer.removeEventListener("change", compute)
      reducedMotion.removeEventListener("change", compute)
    }
  }, [])

  return enabled
}

interface Point {
  x: number
  y: number
}

function lerp(a: Point, b: Point, factor: number): Point {
  return { x: a.x + (b.x - a.x) * factor, y: a.y + (b.y - a.y) * factor }
}

export function HanahoushCursor() {
  const enabled = useCursorEnabled()
  const glowRef = useRef<HTMLDivElement>(null)
  const orbRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const enabledRef = useRef(enabled)
  const [state, setState] = useState<CursorState>("default")
  const stateRef = useRef<CursorState>("default")

  useEffect(() => {
    enabledRef.current = enabled
  }, [enabled])

  // While active, let CSS suppress the system cursor on fine-pointer desktops.
  useEffect(() => {
    const root = document.documentElement
    if (enabled) {
      root.classList.add("hh-live-cursor")
    } else {
      root.classList.remove("hh-live-cursor")
    }
    return () => root.classList.remove("hh-live-cursor")
  }, [enabled])

  useEffect(() => {
    if (!enabled) return

    const center: Point = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    let target: Point = { ...center }
    let glow: Point = { ...center }
    let orb: Point = { ...center }
    let ring: Point = { ...center }
    let visible = false
    let raf = 0

    const glowEl = glowRef.current
    const orbEl = orbRef.current
    const ringEl = ringRef.current
    if (!glowEl || !orbEl || !ringEl) return

    const onPointerMove = (event: PointerEvent) => {
      if (!enabledRef.current) return
      target = { x: event.clientX, y: event.clientY }
      const next = classifyCursorState(event.target)
      if (next !== stateRef.current) {
        stateRef.current = next
        setState(next)
      }
      if (!visible) {
        glow = { ...target }
        orb = { ...target }
        ring = { ...target }
        visible = true
      }
    }

    const tick = () => {
      glow = lerp(glow, target, cursorTokens.motion.interpolation * 0.4)
      orb = lerp(orb, target, cursorTokens.motion.interpolation)
      ring = lerp(ring, target, cursorTokens.motion.ringInterpolation)

      glowEl.style.translate = `${glow.x}px ${glow.y}px`
      orbEl.style.translate = `${orb.x}px ${orb.y}px`
      ringEl.style.translate = `${ring.x}px ${ring.y}px`
      raf = requestAnimationFrame(tick)
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true })
    raf = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener("pointermove", onPointerMove)
      cancelAnimationFrame(raf)
    }
  }, [enabled])

  if (!enabled) return null

  const glowSize = cursorTokens.orb.glowSize
  const orbSize = cursorTokens.orb.size
  const ringSize = cursorTokens.ring.size

  const layerStyle = (size: number): React.CSSProperties => ({
    position: "absolute",
    left: 0,
    top: 0,
    width: size,
    height: size,
    marginLeft: -size / 2,
    marginTop: -size / 2,
    borderRadius: "50%",
    willChange: "translate, transform, opacity",
  })

  return (
    <div aria-hidden="true" data-state={state} className="hh-cursor pointer-events-none fixed inset-0 z-[9999]">
      <div
        ref={glowRef}
        className="hh-cursor-glow"
        style={{
          ...layerStyle(glowSize),
          background: "radial-gradient(circle, hsl(var(--ring) / 0.14) 0%, transparent 70%)",
        }}
      />
      <div
        ref={orbRef}
        className="hh-cursor-orb"
        style={{
          ...layerStyle(orbSize),
          transform: "scale(1)",
          background: "radial-gradient(circle, hsl(var(--ring) / 0.7) 0%, hsl(var(--ring) / 0) 70%)",
        }}
      />
      <div
        ref={ringRef}
        className="hh-cursor-ring"
        style={{
          ...layerStyle(ringSize),
          transform: "scale(1)",
        }}
      />
    </div>
  )
}