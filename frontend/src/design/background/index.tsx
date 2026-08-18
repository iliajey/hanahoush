/**
 * Background System — Animated Grid, Noise, Gradient Mesh, Particles,
 * plus the "Living Grid" interaction layer (scroll parallax + pointer energy).
 *
 * All layers are GPU friendly and throttled to stay under 60fps.
 * The grid and mesh use pure CSS (transform/opacity only). Particles use a
 * single canvas with rAF, capped DPR and a low particle count. The living
 * grid engine adds a very subtle scroll parallax and pointer-following energy
 * nudge, gated to fine-pointer, non-reduced-motion, non-low-perf devices and
 * stopped at idle (no continuous animation loop).
 */
import { useEffect, useRef } from "react"
import type { RefObject } from "react"

import { cn } from "@/shared/lib/cn"
import { useCursorEnabled } from "@/design/cursor/HanahoushCursor"

/**
 * Subtle animated grid (masked, GPU-friendly CSS pan). The scale morph is
 * driven by the visual-state CSS variables (`--vs-grid-scale`) so sections
 * can slightly settle/engage without touching the component.
 */
export function AnimatedGrid({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("hh-grid hh-grid-animated", className)}>
      <div className="hh-grid-scale" />
    </div>
  )
}

/** Section-aware energy bloom — brightens selected grid areas. */
export function GridEnergy() {
  return <div aria-hidden="true" data-grid-energy className="hh-grid-energy" />
}

/** Film-grain noise overlay (fixed, very low opacity). */
export function NoiseLayer() {
  return <div aria-hidden="true" className="hh-noise" />
}

/** Layered gradient mesh (CSS only). Opacity follows the visual state. */
export function GradientMesh({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`hh-mesh ${className}`} />
}

/**
 * Living-grid engine: parallax (container translateY) + a pointer-following
 * nudge on the energy layer. transform-only, rAF-driven, and it stops when it
 * converges so there is no continuous expensive loop at idle. Fully disabled
 * on touch / reduced-motion / low-perf devices.
 */
function useLivingGridMovement(containerRef: RefObject<HTMLDivElement | null>) {
  const enabled = useCursorEnabled()

  useEffect(() => {
    if (!enabled) return
    const container = containerRef.current
    if (!container) return

    const energy = container.querySelector<HTMLElement>("[data-grid-energy]")

    let targetY = 0
    let currentY = 0
    let pointerX = 0
    let pointerY = 0
    let currentPX = 0
    let currentPY = 0
    let running = false
    let raf = 0

    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

    const schedule = () => {
      if (running) return
      running = true
      raf = requestAnimationFrame(tick)
    }
    const stop = () => {
      running = false
      cancelAnimationFrame(raf)
    }

    const tick = () => {
      // Sleep whenever the tab is hidden (saves battery on background tabs).
      if (document.hidden) {
        stop()
        return
      }
      currentY += (targetY - currentY) * 0.08
      currentPX += (pointerX - currentPX) * 0.12
      currentPY += (pointerY - currentPY) * 0.12

      container.style.transform = `translate3d(0px, ${currentY.toFixed(2)}px, 0px)`
      if (energy) {
        energy.style.transform = `translate3d(${currentPX.toFixed(2)}px, ${currentPY.toFixed(2)}px, 0px)`
      }

      const settled =
        Math.abs(targetY - currentY) < 0.05 &&
        Math.abs(pointerX - currentPX) < 0.05 &&
        Math.abs(pointerY - currentPY) < 0.05
      if (settled) {
        stop()
      } else {
        raf = requestAnimationFrame(tick)
      }
    }

    const onScroll = () => {
      targetY = clamp(window.scrollY * 0.05, -60, 60)
      schedule()
    }
    const onPointerMove = (event: PointerEvent) => {
      const rx = event.clientX / window.innerWidth - 0.5
      const ry = event.clientY / window.innerHeight - 0.5
      pointerX = rx * 14 // max ±7px horizontal nudge
      pointerY = ry * 10 // max ±5px vertical nudge
      schedule()
    }
    const onVisibility = () => {
      if (document.hidden) {
        stop()
      } else {
        schedule()
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("pointermove", onPointerMove, { passive: true })
    document.addEventListener("visibilitychange", onVisibility)

    return () => {
      stop()
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("pointermove", onPointerMove)
      document.removeEventListener("visibilitychange", onVisibility)
      container.style.transform = ""
      if (energy) energy.style.transform = ""
    }
  }, [enabled, containerRef])
}

/**
 * SiteBackground — composition of the ambient background layers.
 * Optional by default; `enabled` controls whether the grid/mesh/particles
 * render. NoiseLayer is always global (mounted in App).
 */
export function SiteBackground({
  grid = true,
  mesh = true,
  particles = false,
}: {
  grid?: boolean
  mesh?: boolean
  particles?: boolean
}) {
  const backdropRef = useRef<HTMLDivElement>(null)
  useLivingGridMovement(backdropRef)

  return (
    <div ref={backdropRef} aria-hidden="true" className="hh-backdrop">
      {grid ? <AnimatedGrid className="absolute inset-0" /> : null}
      <GridEnergy />
      {mesh ? <GradientMesh className="absolute inset-0" /> : null}
      {particles ? <Particles className="absolute inset-0 h-full w-full" count={18} /> : null}
    </div>
  )
}

export interface ParticlesProps {
  /** Max particle count (auto-capped for low-perf devices). */
  count?: number
  color?: string
  className?: string
}

/** Tiny drifting particles on a single canvas. */
export function Particles({ count = 20, color = "hsl(var(--ring) / 0.5)", className = "" }: ParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Gate: skip on reduced motion or coarse pointers.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const coarse = !window.matchMedia("(pointer: fine)").matches
    const lowPerf =
      typeof navigator.hardwareConcurrency === "number" &&
      navigator.hardwareConcurrency > 0 &&
      navigator.hardwareConcurrency < 4
    if (reduced || coarse || lowPerf) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let raf = 0
    let width = 0
    let height = 0
    const particles: Array<{ x: number; y: number; vx: number; vy: number; r: number }> = []

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const init = () => {
      const n = Math.min(count, 24)
      particles.length = 0
      for (let i = 0; i < n; i += 1) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          r: Math.random() * 1.5 + 0.5,
        })
      }
    }

    const tick = () => {
      if (document.hidden) {
        raf = requestAnimationFrame(tick)
        return
      }
      ctx.clearRect(0, 0, width, height)
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > width) p.vx *= -1
        if (p.y < 0 || p.y > height) p.vy *= -1
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()
      }
      raf = requestAnimationFrame(tick)
    }

    resize()
    init()
    raf = requestAnimationFrame(tick)
    window.addEventListener("resize", resize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", resize)
    }
  }, [count, color])

  return <canvas ref={canvasRef} aria-hidden="true" className={`pointer-events-none ${className}`} />
}