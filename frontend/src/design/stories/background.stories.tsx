import type { Meta, StoryObj } from "@storybook/react"

import { AnimatedGrid, GradientMesh, NoiseLayer, Particles, SiteBackground } from "@/design/background"

const BackgroundShowcase = () => (
  <div className="flex flex-col gap-8 p-6">
    <div className="relative h-48 overflow-hidden rounded-xl border">
      <AnimatedGrid className="absolute inset-0" />
      <span className="absolute bottom-2 start-2 text-xs text-muted-foreground">Animated grid (masked, CSS)</span>
    </div>
    <div className="relative h-48 overflow-hidden rounded-xl border">
      <GradientMesh className="absolute inset-0" />
      <span className="absolute bottom-2 start-2 text-xs text-muted-foreground">Gradient mesh (CSS)</span>
    </div>
    <div className="relative h-48 overflow-hidden rounded-xl border">
      <Particles className="absolute inset-0 h-full w-full" count={20} />
      <span className="absolute bottom-2 start-2 text-xs text-muted-foreground">Particles (canvas, GPU capped)</span>
    </div>
    <div className="relative h-48 overflow-hidden rounded-xl border">
      <SiteBackground grid mesh particles />
      <span className="absolute bottom-2 start-2 text-xs text-muted-foreground">Site background composition</span>
    </div>
    <div className="relative h-32 overflow-hidden rounded-xl border">
      <NoiseLayer />
      <span className="absolute bottom-2 start-2 text-xs text-muted-foreground">Noise layer (film grain, fixed)</span>
    </div>
  </div>
)

const meta: Meta<typeof BackgroundShowcase> = {
  title: "Design System/Background",
  component: BackgroundShowcase,
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof BackgroundShowcase>

export const Overview: Story = {}
