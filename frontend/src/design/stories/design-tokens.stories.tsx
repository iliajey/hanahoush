import type { Meta, StoryObj } from "@storybook/react"

import { brand, semantic, hover, focus, selection, scrollbar } from "@/design/colors"
import { gradients } from "@/design/gradients"
import { radius } from "@/design/radius"
import { shadow } from "@/design/shadows"
import { motion } from "@/design/motion"
import { GlassCard } from "@/design/effects"
import { BrandLogo } from "@/components/brand/BrandLogo"

const TokenShowcase = () => (
  <div className="flex flex-col gap-10 p-6">
    <section className="rounded-2xl border bg-gradient-to-br from-brand-600 to-brand-950 p-8 text-white">
      <div className="flex items-center gap-5">
        <BrandLogo alt="Hanahoush" className="h-16 w-auto" eager />
        <div>
          <p className="text-2xl font-bold">Hanahoush — Brand System</p>
          <p className="text-sm text-white/75">
            Viola-magenta primary (#932990) with deep indigo ink (#272161) on a near-white surface —
            measured from the brand mark.
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {Object.entries(brand)
          .filter(([k]) => ["600", "900", "950", "primary", "secondary"].includes(k))
          .map(([name, value]) => (
            <span key={name} className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
              {name} · {value}
            </span>
          ))}
      </div>
    </section>

    <section>
      <h2 className="mb-3 text-lg font-bold">Brand Colors</h2>
      <div className="grid grid-cols-5 gap-2">
        {Object.entries(brand).map(([name, value]) => (
          <div key={name} className="overflow-hidden rounded-lg border">
            <div className="h-12" style={{ backgroundColor: value }} />
            <p className="p-1 text-[10px]">{name}</p>
          </div>
        ))}
      </div>
    </section>

    <section>
      <h2 className="mb-3 text-lg font-bold">Semantic Colors</h2>
      <div className="grid grid-cols-3 gap-2">
        {Object.entries(semantic).map(([name, value]) => (
          <div key={name} className="overflow-hidden rounded-lg border">
            <div className="h-12" style={{ backgroundColor: value }} />
            <p className="p-1 text-[10px]">{name}</p>
          </div>
        ))}
      </div>
    </section>

    <section>
      <h2 className="mb-3 text-lg font-bold">Interaction & State Colors</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {(
          [
            ["hover", hover],
            ["focus", focus],
            ["selection", selection],
            ["scrollbar", scrollbar],
          ] as Array<[string, Record<string, string>]>
        ).map(([label, group]) => (
          <div key={label}>
            <h3 className="mb-2 text-sm font-semibold capitalize">{label}</h3>
            <div className="flex flex-col gap-1">
              {Object.entries(group).map(([k, v]) => (
                <div key={k} className="flex items-center gap-2 rounded border p-1">
                  <span className="h-4 w-4 rounded-sm border" style={{ backgroundColor: v }} />
                  <span className="text-[10px]">{k}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>

    <section>
      <h2 className="mb-3 text-lg font-bold">Gradients</h2>
      <div className="grid grid-cols-2 gap-3">
        {[gradients.brand, gradients.hero, gradients.cta, gradients.mesh].map((g) => (
          <div key={g.name} className="flex h-24 items-center justify-center rounded-lg text-white" style={{ background: g.css }}>
            {g.name}
          </div>
        ))}
      </div>
    </section>

    <section>
      <h2 className="mb-3 text-lg font-bold">Radius</h2>
      <div className="flex flex-wrap gap-4">
        {Object.entries(radius).map(([name, value]) => (
          <div key={name} className="flex flex-col items-center gap-1">
            <div className="h-16 w-16 border-2 bg-brand-500/10" style={{ borderRadius: value }} />
            <span className="text-[10px]">{name}</span>
          </div>
        ))}
      </div>
    </section>

    <section>
      <h2 className="mb-3 text-lg font-bold">Shadows / Elevation</h2>
      <div className="flex flex-wrap gap-4">
        {Object.entries(shadow).map(([name, value]) => (
          <div key={name} className="flex h-20 w-32 items-center justify-center rounded-lg bg-card text-[10px]" style={{ boxShadow: value }}>
            {name}
          </div>
        ))}
      </div>
    </section>

    <section>
      <h2 className="mb-3 text-lg font-bold">Motion Presets</h2>
      <div className="flex flex-wrap gap-2">
        {Object.entries(motion).map(([name, preset]) => (
          <span key={name} className="rounded-full bg-muted px-3 py-1 text-xs">
            {name} · {Math.round(preset.duration * 1000)}ms
          </span>
        ))}
      </div>
    </section>

    <section>
      <h2 className="mb-3 text-lg font-bold">Glass Surfaces</h2>
      <div className="grid grid-cols-3 gap-4 bg-gradient-to-br from-brand-500/20 to-transparent p-6">
        <GlassCard className="p-6 text-center">Subtle</GlassCard>
        <GlassCard className="p-6 text-center">Standard</GlassCard>
        <GlassCard className="glass-strong rounded-xl p-6 text-center">Strong</GlassCard>
      </div>
    </section>
  </div>
)

const meta: Meta<typeof TokenShowcase> = {
  title: "Design System/Tokens",
  component: TokenShowcase,
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof TokenShowcase>

export const Overview: Story = {}
