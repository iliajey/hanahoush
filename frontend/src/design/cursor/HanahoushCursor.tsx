/**
 * Hanahoush Living Cursor.
 *
 * Three-layer glowing cursor: a large ambient glow (slow lag), a core orb
 * (snappy), and a trailing ring (medium lag). Theme-aware via CSS variables
 * (`--ring`), GPU friendly (`translate3d`), disabled on touch / low-perf and
 * with `prefers-reduced-motion`.
 */
import { useEffect, useRef, useState } from "react"

import { cursorTokens } from "./index"

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

  useEffect(() => {
    enabledRef.current = enabled
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

      glowEl.style.transform = `translate3d(${glow.x}px, ${glow.y}px, 0)`
      orbEl.style.transform = `translate3d(${orb.x}px, ${orb.y}px, 0)`
      ringEl.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0)`
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
    willChange: "transform",
  })

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[9999]">
      <div
        ref={glowRef}
        style={{
          ...layerStyle(glowSize),
          background: "radial-gradient(circle, hsl(var(--ring) / 0.14) 0%, transparent 70%)",
        }}
      />
      <div
        ref={orbRef}
        style={{
          ...layerStyle(orbSize),
          background: "radial-gradient(circle, hsl(var(--ring) / 0.7) 0%, hsl(var(--ring) / 0) 70%)",
        }}
      />
      <div
        ref={ringRef}
        style={{
          ...layerStyle(ringSize),
          border: "1.5px solid hsl(var(--ring) / 0.5)",
        }}
      />
    </div>
  )
}
