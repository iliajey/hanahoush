import type { Meta, StoryObj } from "@storybook/react"

import { cursorTokens } from "@/design/cursor"
import { HanahoushCursor } from "@/design/cursor/HanahoushCursor"

const CursorShowcase = () => (
  <div className="relative flex min-h-[60vh] items-center justify-center overflow-hidden rounded-xl border p-10">
    <HanahoushCursor />
    <div className="text-center">
      <h2 className="text-2xl font-bold">Living Cursor</h2>
      <p className="mt-2 max-w-md text-muted-foreground">
        Move your mouse over this panel. The glowing orb, trailing ring and
        ambient glow use the theme ring color and follow with soft
        interpolation. Disabled on touch devices, low-performance hardware and
        <code> prefers-reduced-motion</code>.
      </p>
      <dl className="mt-6 grid grid-cols-2 gap-4 text-left sm:grid-cols-4">
        <div>
          <dt className="text-xs text-muted-foreground">Orb size</dt>
          <dd className="font-mono text-sm">{cursorTokens.orb.size}px</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Glow radius</dt>
          <dd className="font-mono text-sm">{cursorTokens.orb.glowSize}px</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Interpolation</dt>
          <dd className="font-mono text-sm">{cursorTokens.motion.interpolation}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Ring lag</dt>
          <dd className="font-mono text-sm">{cursorTokens.motion.ringInterpolation}</dd>
        </div>
      </dl>
    </div>
  </div>
)

const meta: Meta<typeof CursorShowcase> = {
  title: "Design System/Cursor",
  component: CursorShowcase,
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof CursorShowcase>

export const Overview: Story = {}
