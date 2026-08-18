/**
 * Hanahoush brand assets.
 *
 * `mark` is the icon-only lockup (cropped from the source brand image) used in
 * compact UI slots (navbar, auth shell, footer brand block). `full` is the
 * complete lockup (icon + Persian wordmark) reserved for large brand moments
 * (Storybook showcase, print-style surfaces).
 *
 * Source of truth: E:\Ilia Jamali\Hana\IMG_2854 (1).PNG (1080×1080).
 * The processed PNGs live in `/public/brand/` so they are served as static
 * assets with stable URLs (see phase-09F report §4 for the analysis).
 */

export const brandAsset = {
  /** Icon-only mark, transparent background, 512px wide (retina-crisp). */
  mark: "/brand/hanahoush-logo.png",
  /** Full lockup (icon + wordmark), transparent background, 512×512. */
  full: "/brand/hanahoush-logo-full.png",
  /** 192px PWA icon (white background, faithful to the original). */
  icon192: "/brand/icon-192.png",
  /** 512px PWA icon (white background, faithful to the original). */
  icon512: "/brand/icon-512.png",
} as const

export type BrandAssetVariant = keyof typeof brandAsset