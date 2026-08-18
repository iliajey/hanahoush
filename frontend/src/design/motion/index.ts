/**
 * Hanahoush Motion Tokens — durations, easings and named presets.
 */

export const duration = {
  instant: "0ms",
  fastest: "100ms",
  fast: "150ms",
  normal: "200ms",
  slow: "300ms",
  slower: "500ms",
} as const

export const easing = {
  linear: "linear",
  in: "cubic-bezier(0.4, 0, 1, 1)",
  out: "cubic-bezier(0, 0, 0.2, 1)",
  inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
} as const

/** Named motion presets. */
export const motion = {
  fast: { duration: 0.12, ease: [0.2, 0, 0, 1] },
  medium: { duration: 0.2, ease: [0.2, 0, 0, 1] },
  slow: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  elastic: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  smooth: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  premium: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
} as const

export type MotionPreset = keyof typeof motion

export const motionTokens = { duration, easing, motion } as const

export default motionTokens
