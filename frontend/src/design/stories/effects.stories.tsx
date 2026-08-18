import type { Meta, StoryObj } from "@storybook/react"

import {
  Glow,
  GlassCard,
  BorderGlow,
  MagneticHover,
  FloatingCard,
  SoftTilt,
  Spotlight,
  Reveal,
} from "@/design/effects"
import { Card } from "@/components/ui/card"

const EffectsShowcase = () => (
  <div className="grid gap-6 p-6 md:grid-cols-2">
    <Glow>
      <Card className="p-6">Glow — radial highlight behind content.</Card>
    </Glow>
    <GlassCard className="p-6">Glass — translucent blurred surface.</GlassCard>
    <BorderGlow>
      <Card className="border-0 p-6">Border Glow — gradient border card.</Card>
    </BorderGlow>
    <MagneticHover>
      <Card className="p-6">Magnetic Hover — move your cursor over this card.</Card>
    </MagneticHover>
    <FloatingCard>
      <Card className="p-6">Floating Card — gentle idle motion.</Card>
    </FloatingCard>
    <SoftTilt>
      <Card className="p-6">Soft Tilt — 3D perspective toward the pointer.</Card>
    </SoftTilt>
    <Spotlight>
      <Card className="p-6">Spotlight — a light follows your cursor.</Card>
    </Spotlight>
    <Reveal>
      <Card className="p-6">Reveal — fades and rises on scroll into view.</Card>
    </Reveal>
  </div>
)

const meta: Meta<typeof EffectsShowcase> = {
  title: "Design System/Effects",
  component: EffectsShowcase,
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof EffectsShowcase>

export const Overview: Story = {}
