/**
 * Hanahoush Illustration System.
 *
 * Illustration strategy: abstract, geometric, gradient-based. No stock
 * clip-art. Product visuals are rendered as stylized UI mocks.
 */

export interface IllustrationStyle {
  name: string
  description: string
  whenToUse: string[]
  whenToAvoid: string[]
}

export const styles: IllustrationStyle[] = [
  {
    name: "Orb / Gradient Mesh",
    description: "Layered radial gradients forming soft 3D orbs.",
    whenToUse: ["hero backgrounds", "section dividers", "empty states"],
    whenToAvoid: ["dense reading content", "small thumbnails"],
  },
  {
    name: "Isometric Geometry",
    description: "Subtle isometric shapes and grid lines.",
    whenToUse: ["ERP / platform sections", "feature spotlights"],
    whenToAvoid: ["avatars", "icons next to short labels"],
  },
  {
    name: "Product Mock",
    description: "Stylized UI mock rendered as a component or export.",
    whenToUse: ["hero visual", "hanRP showcase", "case studies"],
    whenToAvoid: ["decorative use near text"],
  },
]

export const illustrations = { styles } as const

export default illustrations
