/**
 * Hanahoush Icon System.
 *
 * Icon engine strategy: Lucide (stroke) as the UI icon source, sizes,
 * stroke weights, and the RTL mirror list.
 */

/** Standard icon sizes (px). */
export const sizes = { sm: 16, md: 20, lg: 24, xl: 32 } as const

export type IconSize = keyof typeof sizes

/** Stroke width presets. */
export const stroke = {
  default: 2,
  medium: 1.75,
  thin: 1.5,
} as const

/** Icons that MUST mirror in RTL. */
export const rtlMirror = [
  "ChevronRight",
  "ChevronLeft",
  "ArrowRight",
  "ArrowLeft",
  "MoveRight",
  "MoveLeft",
  "Undo2",
  "Redo2",
  "SkipBack",
  "SkipForward",
  "LogIn",
  "LogOut",
  "ExternalLink",
  "ArrowUpRight",
  "ArrowDownLeft",
  "ChevronsRight",
  "ChevronsLeft",
] as const

/** Icons that must NOT mirror (content orientation). */
export const noMirror = [
  "Clock",
  "Check",
  "X",
  "Search",
  "User",
  "MessageCircle",
  "Flag",
  "Globe",
  "Loader2",
  "Mail",
  "Phone",
] as const

export const icons = { sizes, stroke, rtlMirror, noMirror } as const

export default icons
