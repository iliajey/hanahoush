/**
 * Effects Library — reusable motion/visual effect components.
 */
import { useEffect, useRef, useState } from "react"
import type { CSSProperties, HTMLAttributes, ReactNode } from "react"

import { cn } from "@/shared/lib/cn"

/* ------------------------------------------------------------------ */
/* Glow — soft radial glow behind an element                           */
/* ------------------------------------------------------------------ */
export function Glow({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("relative", className)} {...props}>
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 rounded-[inherit] opacity-70"
        style={{ background: "radial-gradient(60% 60% at 50% 40%, hsl(var(--ring) / 0.18), transparent 70%)" }}
      />
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* GlassCard — translucent blurred surface                             */
/* ------------------------------------------------------------------ */
export function GlassCard({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("glass rounded-xl", className)} {...props}>
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* BorderGlow — gradient border card                                   */
/* ------------------------------------------------------------------ */
export function BorderGlow({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("border-glow rounded-xl", className)} {...props}>
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* MagneticHover — element nudges toward the cursor, resets on leave   */
/* ------------------------------------------------------------------ */
export function MagneticHover({
  children,
  className = "",
  strength = 0.3,
}: {
  children: ReactNode
  className?: string
  strength?: number
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduced || !window.matchMedia("(pointer: fine)").matches) return

    let raf = 0
    let x = 0
    let y = 0
    let tx = 0
    let ty = 0

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      tx = (e.clientX - rect.left - rect.width / 2) * strength
      ty = (e.clientY - rect.top - rect.height / 2) * strength
    }
    const onLeave = () => {
      tx = 0
      ty = 0
    }
    const tick = () => {
      x += (tx - x) * 0.18
      y += (ty - y) * 0.18
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`
      raf = requestAnimationFrame(tick)
    }

    el.addEventListener("pointermove", onMove)
    el.addEventListener("pointerleave", onLeave)
    raf = requestAnimationFrame(tick)
    return () => {
      el.removeEventListener("pointermove", onMove)
      el.removeEventListener("pointerleave", onLeave)
      cancelAnimationFrame(raf)
    }
  }, [strength])

  return (
    <div ref={ref} className={cn("will-change-transform", className)}>
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* FloatingCard — gentle idle float                                    */
/* ------------------------------------------------------------------ */
export function FloatingCard({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("hh-float", className)} {...props}>
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* SoftTilt — 3D perspective tilt toward the pointer                   */
/* ------------------------------------------------------------------ */
export function SoftTilt({
  children,
  className = "",
  maxTilt = 6,
}: {
  children: ReactNode
  className?: string
  maxTilt?: number
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    if (!window.matchMedia("(pointer: fine)").matches) return

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      const px = (e.clientX - rect.left) / rect.width - 0.5
      const py = (e.clientY - rect.top) / rect.height - 0.5
      el.style.transform = `perspective(800px) rotateX(${(-py * maxTilt).toFixed(2)}deg) rotateY(${(px * maxTilt).toFixed(2)}deg)`
    }
    const onLeave = () => {
      el.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg)"
    }
    el.addEventListener("pointermove", onMove)
    el.addEventListener("pointerleave", onLeave)
    return () => {
      el.removeEventListener("pointermove", onMove)
      el.removeEventListener("pointerleave", onLeave)
    }
  }, [maxTilt])

  return (
    <div ref={ref} className={cn("transition-transform duration-200 will-change-transform", className)}>
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Spotlight — mouse-tracking radial highlight inside a container      */
/* ------------------------------------------------------------------ */
export function Spotlight({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!window.matchMedia("(pointer: fine)").matches) return

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      el.style.setProperty("--spot-x", `${e.clientX - rect.left}px`)
      el.style.setProperty("--spot-y", `${e.clientY - rect.top}px`)
    }
    el.addEventListener("pointermove", onMove)
    return () => el.removeEventListener("pointermove", onMove)
  }, [])

  return (
    <div ref={ref} className={cn("group relative overflow-hidden", className)} {...props}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={
          {
            background: "radial-gradient(320px circle at var(--spot-x, 50%) var(--spot-y, 50%), hsl(var(--ring) / 0.12), transparent 70%)",
          } as CSSProperties
        }
      />
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Reveal — IntersectionObserver fade/rise wrapper                     */
/* ------------------------------------------------------------------ */
export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduced) {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={cn("transition-all duration-500", className)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}
