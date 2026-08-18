import { useEffect, useState } from "react"

import { cn } from "@/shared/lib/cn"

/** Reading progress indicator (fixed top bar). */
export function ReadingProgress({ className }: { className?: string }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement
      const max = doc.scrollHeight - window.innerHeight
      if (max <= 0) return
      const pct = Math.min(100, (window.scrollY / max) * 100)
      setProgress(pct)
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div className={cn("pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 bg-transparent", className)} aria-hidden="true">
      <div className="h-full bg-brand-500 transition-[width] duration-100" style={{ width: `${progress}%` }} />
    </div>
  )
}