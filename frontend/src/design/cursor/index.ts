/**
 * Hanahoush Living Cursor tokens.
 *
 * The glowing cursor orb: size, glow, colors, interpolation and
 * performance/reduced-motion gates. Consumed by the Cursor Engine component.
 */

export const cursorTokens = {
  orb: {
    size: 24, // px — core orb
    glowSize: 120, // px — radial glow radius
    colorLight: "hsl(239 84% 63% / 0.55)",
    colorDark: "hsl(239 84% 67% / 0.6)",
    blur: "24px",
  },
  ring: {
    enabled: true,
    size: 36,
    border: "1.5px solid hsl(var(--ring) / 0.6)",
    lag: 0.12, // lerp factor for the trailing ring
  },
  motion: {
    /** Interpolation factor (0..1). Higher = snappier. */
    interpolation: 0.22,
    /** Trailing ring lerp factor. */
    ringInterpolation: 0.12,
    /** Throttle: only update on pointermove (rAF-driven). */
    rAF: true,
  },
  performance: {
    /** Reduce effects below this device-concurrency threshold. */
    minConcurrency: 4,
    /** Disable below this device-memory GB threshold (if reported). */
    minMemoryGB: 4,
    maxParticles: 24,
  },
  gates: {
    /** Requires a fine pointer (not touch). */
    requireFinePointer: true,
    /** Respects prefers-reduced-motion. */
    reducedMotionDisables: true,
    /** Hides the native cursor over the orb area when active. */
    hideNativeCursor: true,
  },
} as const

/**
 * Cursor states — how the orb/ring/glow react to the element under the
 * pointer. The JS engine lerps position via the CSS `translate` property and
 * these scale transitions morph the ring/orb via `transform` (composable).
 */
export type CursorState = "default" | "link" | "button" | "card" | "draggable" | "text" | "disabled"

export interface CursorStateStyle {
  /** Ring scale multiplier. */
  ringScale: number
  /** Ring opacity 0..1. */
  ringOpacity: number
  /** Orb scale multiplier. */
  orbScale: number
  /** Render the ring with a dashed border (dragging affordance). */
  dash?: boolean
}

export const cursorStateTokens: Record<CursorState, CursorStateStyle> = {
  default: { ringScale: 1, ringOpacity: 0.5, orbScale: 1 },
  link: { ringScale: 1.45, ringOpacity: 0.85, orbScale: 0.55 },
  button: { ringScale: 0.85, ringOpacity: 0.5, orbScale: 1.15 },
  card: { ringScale: 1.7, ringOpacity: 0.45, orbScale: 0.8 },
  draggable: { ringScale: 1.9, ringOpacity: 0.7, orbScale: 0.7, dash: true },
  text: { ringScale: 1, ringOpacity: 0, orbScale: 0 },
  disabled: { ringScale: 1, ringOpacity: 0.35, orbScale: 0.9 },
}

export const cursor = { tokens: cursorTokens, stateTokens: cursorStateTokens } as const

/**
 * Classify the cursor state from the element currently under the pointer.
 * Pure and DOM-safe so it can be unit tested.
 */
export function classifyCursorState(raw: EventTarget | null): CursorState {
  const target = raw instanceof Element ? raw : null
  if (!target) return "default"

  const isDisabled = (el: Element) =>
    el.hasAttribute("disabled") ||
    el.getAttribute("aria-disabled") === "true" ||
    (el instanceof HTMLButtonElement && el.disabled)

  // Text entry — the native I-beam must remain (system cursor not suppressed).
  const text = target.closest(
    "input, textarea, select, [contenteditable='true'], [contenteditable='plaintext-only']",
  )
  if (text) return "text"

  // Interactive controls (buttons/checkboxes/switches/summary).
  const button = target.closest(
    "button, [role='button'], [role='switch'], [role='checkbox'], [role='radio'], [type='submit'], [type='button'], summary",
  )
  if (button) return isDisabled(button) ? "disabled" : "button"

  // Links.
  const link = target.closest("a[href], [role='link'], area[href]")
  if (link) return isDisabled(link) ? "disabled" : "link"

  // Draggable surfaces.
  const draggable = target.closest("[draggable='true']")
  if (draggable) return "draggable"

  // Card-like surfaces (annotated via data-cursor, or the shared bg-card token
  // used by Card / marketing cards).
  const card = target.closest("[data-cursor='card'], article, [class~='bg-card']")
  if (card) return "card"

  return "default"
}

export default cursor
