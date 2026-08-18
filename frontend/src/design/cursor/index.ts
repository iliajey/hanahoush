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

export const cursor = { tokens: cursorTokens } as const

export default cursor
