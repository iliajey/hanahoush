/**
 * Background System — Animated Grid, Noise, Gradient Mesh, Particles.
 *
 * All layers are GPU friendly and throttled to stay under 60fps.
 * The grid and mesh use pure CSS (transform/opacity only). Particles use a
 * single canvas with rAF, capped DPR and a low particle count.
 */
import { useEffect, useRef } from "react"

/** Subtle animated grid (masked, GPU-friendly CSS pan). */
export function AnimatedGrid({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`hh-grid hh-grid-animated ${className}`} />
}

/** Film-grain noise overlay (fixed, very low opacity). */
export function NoiseLayer() {
  return <div aria-hidden="true" className="hh-noise" />
}

/** Layered gradient mesh (CSS only). */
export function GradientMesh({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`hh-mesh ${className}`} />
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
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {grid ? <AnimatedGrid className="absolute inset-0" /> : null}
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
