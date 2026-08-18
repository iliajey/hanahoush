import { useState } from "react"
import type { ImgHTMLAttributes } from "react"

import { cn } from "@/shared/lib/cn"

const FALLBACK_IMAGE =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="100%" height="100%" fill="#e5e7eb"/><g fill="none" stroke="#9ca3af" stroke-width="2"><rect x="1" y="1" width="638" height="358" rx="8"/></g><text x="50%" y="50%" font-family="sans-serif" font-size="20" fill="#6b7280" text-anchor="middle" dominant-baseline="middle">Image unavailable</text></svg>`,
  )

export interface ResponsiveImageProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt" | "onError" | "loading"> {
  src?: string
  alt: string
  className?: string
  /** Tailwind width utility for responsive scaling (defaults to w-full). */
  widthClass?: string
}

/**
 * Responsive <img> with native lazy loading + a graceful SVG fallback when
 * no source is provided or the image fails to load. This keeps the DOM clean
 * (no broken-image icons) and is screen-reader friendly.
 */
export function ResponsiveImage({ src, alt, className, widthClass = "w-full", ...rest }: ResponsiveImageProps) {
  const [failed, setFailed] = useState(false)
  const resolved = src && !failed ? src : FALLBACK_IMAGE
  return (
    <img
      src={resolved}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={cn("object-cover", widthClass, className)}
      {...rest}
    />
  )
}