import type { Meta, StoryObj } from "@storybook/react"
import type { ReactNode } from "react"

import { brand, semantic } from "@/design/colors"
import { gradients } from "@/design/gradients"
import { typography } from "@/design/typography"

/**
 * Hanahoush Brand Showcase — the single visual source of truth for the brand:
 * mark, palette, role tokens, semantic system, typography and the core UI
 * controls. Verify in light AND dark mode and with the RTL preview toggles.
 */

const Mark = ({ size = 64 }: { size?: number }) => (
  <span
    className="flex items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-950 font-black text-white shadow-lg"
    style={{ width: size, height: size, fontSize: size * 0.55 }}
  >
    ه
  </span>
)

const BRAND_ROLES: Array<{ token: string; value: string; on: string }> = [
  { token: "brand.primary", value: brand.primary, on: brand.onPrimary },
  { token: "brand.primaryHover", value: brand.primaryHover, on: brand.onPrimary },
  { token: "brand.primaryActive", value: brand.primaryActive, on: brand.onPrimary },
  { token: "brand.secondary", value: brand.secondary, on: brand.onSecondary },
  { token: "brand.secondaryHover", value: brand.secondaryHover, on: brand.onSecondary },
  { token: "brand.accent", value: brand.accent, on: brand.onSecondary },
  { token: "brand.accentSoft", value: brand.accentSoft, on: brand.primary },
  { token: "brand.onPrimary", value: brand.onPrimary, on: brand.primary },
  { token: "brand.onSecondary", value: brand.onSecondary, on: brand.secondary },
]

const Swatch = ({ name, value }: { name: string; value: string }) => (
  <div className="flex flex-col overflow-hidden rounded-lg border bg-card">
    <div className="h-14 w-full" style={{ backgroundColor: value }} />
    <div className="px-2 py-1">
      <p className="text-[10px] font-medium">{name}</p>
      <p className="font-mono text-[10px] uppercase text-muted-foreground">{value}</p>
    </div>
  </div>
)

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="rounded-2xl border bg-card p-6">
    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
    {children}
  </section>
)

const Showcase = () => (
  <div className="flex flex-col gap-6 bg-background p-8 text-foreground">
    {/* Identity */}
    <Section title="Brand Identity · the ه mark">
      <div className="flex items-center gap-6">
        <Mark size={80} />
        <div className="flex flex-col gap-1">
          <p className="text-3xl font-bold tracking-tight">Hanahoush</p>
          <p className="text-muted-foreground">Enterprise software, engineered like a product.</p>
          <p className="mt-2 text-xs text-muted-foreground">
            The mark renders on the intrinsic magenta → deep indigo gradient (brand-600 → brand-950).
          </p>
        </div>
      </div>
    </Section>

    {/* Brand scale */}
    <Section title="Brand Scale">
      <div className="grid grid-cols-6 gap-2 sm:grid-cols-11">
        {([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const).map((step) => (
          <Swatch key={step} name={String(step)} value={brand[step]} />
        ))}
      </div>
    </Section>

    {/* Role tokens */}
    <Section title="Brand Role Tokens (contrast-paired)">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {BRAND_ROLES.map(({ token, value, on }) => (
          <div key={token} className="overflow-hidden rounded-lg border">
            <div className="flex h-16 items-center justify-between px-4 font-semibold" style={{ backgroundColor: value, color: on }}>
              <span className="text-sm">{token}</span>
              <span className="font-mono text-xs uppercase opacity-90">{value}</span>
            </div>
            <p className="bg-card px-4 py-1 text-[10px] text-muted-foreground">on {on}</p>
          </div>
        ))}
      </div>
    </Section>

    {/* Semantic system */}
    <Section title="Semantic System">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Object.entries(semantic).map(([name, value]) => (
          <Swatch key={name} name={name} value={value} />
        ))}
      </div>
    </Section>

    {/* Gradients */}
    <Section title="Gradients">
      <div className="grid grid-cols-2 gap-3">
        {[gradients.brand, gradients.hero, gradients.cta, gradients.mesh].map((g) => (
          <div key={g.name} className="flex h-20 items-center justify-center rounded-lg text-sm font-medium text-white" style={{ background: g.css }}>
            {g.name}
          </div>
        ))}
      </div>
    </Section>

    {/* Typography */}
    <Section title="Typography (Inter · Vazirmatn)">
      <div className="flex flex-col gap-2">
        <p
          className="font-bold"
          style={{ fontSize: typography.display.xl.size, lineHeight: typography.display.xl.lineHeight, letterSpacing: typography.display.xl.tracking }}
        >
          Display XL — Enterprise software, engineered like a product.
        </p>
        <p className="text-2xl">Heading — نرمافزار سازمانی، مهندسیشده مثل یک محصول.</p>
        <p className="text-lg">Body large — Premium web engineering, ERP, AI and design for the region.</p>
        <p className="text-sm text-muted-foreground">Caption / meta — Updated a moment ago</p>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-700 dark:text-brand-300">Overline — Enterprise</p>
      </div>
    </Section>

    {/* UI controls */}
    <Section title="UI Controls">
      <div className="flex flex-wrap items-center gap-3">
        <button className="h-11 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">Primary</button>
        <button className="h-11 rounded-lg bg-secondary px-6 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-secondary/80">Secondary</button>
        <button className="h-11 rounded-lg border border-border bg-transparent px-6 text-sm font-semibold transition-colors hover:bg-accent">Outline</button>
        <button className="h-11 rounded-lg px-6 text-sm font-semibold text-primary transition-colors hover:bg-accent">Ghost</button>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input className="h-10 w-64 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Email address" />
        <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">Success</span>
        <span className="rounded-full bg-warning/10 px-3 py-1 text-xs font-medium text-warning">Warning</span>
        <span className="rounded-full bg-error/10 px-3 py-1 text-xs font-medium text-error">Error</span>
        <span className="rounded-full bg-info/10 px-3 py-1 text-xs font-medium text-info">Info</span>
      </div>
    </Section>
  </div>
)

const meta: Meta<typeof Showcase> = {
  title: "Brand/Identity",
  component: Showcase,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: "The Hanahoush brand identity: mark, palette, roles, semantics, typography and controls. Toggle light/dark and RTL to verify." } },
  },
}

export default meta
type Story = StoryObj<typeof Showcase>

export const Identity: Story = {}
export const Light: Story = { globals: { theme: "light" } }
export const Dark: Story = { globals: { theme: "dark" } }
export const Rtl: Story = { globals: { locale: "fa" } }