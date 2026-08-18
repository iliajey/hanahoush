import { cn } from "@/shared/lib/cn"
import { brandAsset, type BrandAssetVariant } from "@/config/brand"

export interface BrandLogoProps {
  /** Which brand asset to render. Defaults to the icon-only mark. */
  variant?: BrandAssetVariant
  /** Accessible name for the logo image. */
  alt: string
  /** Sizing / layout classes (e.g. `h-8 w-auto`). */
  className?: string
  /** Keep the logo eager (fonts/navbar). Defaults to lazy for large moments. */
  eager?: boolean
}

/**
 * The real Hanahoush organizational mark.
 *
 * Renders the processed source logo (icon-only mark by default) as a managed
 * image. The logo itself is never recolored or redrawn — the surrounding UI
 * consumes the existing design tokens so the mark reads correctly in both
 * light and dark themes.
 */
export function BrandLogo({ variant = "mark", alt, className = "", eager = false }: BrandLogoProps) {
  return (
    <img
      src={brandAsset[variant]}
      alt={alt}
      className={cn("object-contain", className)}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
    />
  )
}