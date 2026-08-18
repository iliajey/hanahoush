import { brand, semantic, gradients, shadow, radius, motion } from "@/design"
import { Glow, GlassCard, BorderGlow, FloatingCard, SoftTilt, Spotlight, Reveal, MagneticHover } from "@/design/effects"
import { AnimatedGrid, GradientMesh, Particles } from "@/design/background"
import { Button } from "@/components/ui/button"
import { PageWrapper } from "@/app/layouts/PageWrapper"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

function TokenCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
      {children}
    </Card>
  )
}

const BRAND_ROLES: Array<{ token: string; value: string; on: string }> = [
  { token: "primary", value: brand.primary, on: brand.onPrimary },
  { token: "primaryHover", value: brand.primaryHover, on: brand.onPrimary },
  { token: "primaryActive", value: brand.primaryActive, on: brand.onPrimary },
  { token: "secondary", value: brand.secondary, on: brand.onSecondary },
  { token: "secondaryHover", value: brand.secondaryHover, on: brand.onSecondary },
  { token: "accent", value: brand.accent, on: brand.onSecondary },
  { token: "accentSoft", value: brand.accentSoft, on: brand.primary },
]

/**
 * Design Playground — development-only laboratory showing every token and
 * effect. Reachable at /design in development; hidden in production.
 */
export function DesignPlayground() {
  return (
    <PageWrapper title="Design Playground" description="The Hanahoush design laboratory (development only).">
      <div className="flex flex-col gap-8">
        {/* Brand identity mark */}
        <TokenCard title="Brand Identity">
          <div className="flex flex-col items-center gap-6 rounded-2xl border bg-gradient-to-br from-brand-600 to-brand-950 p-10 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-4xl font-black text-white backdrop-blur">
                ه
              </span>
              <div>
                <p className="text-2xl font-bold text-white">Hanahoush</p>
                <p className="text-sm text-white/70">Enterprise software, engineered like a product.</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 text-right">
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white">
                brand-600 → brand-950
              </span>
              <span className="text-xs text-white/70">the "ه" mark gradient</span>
            </div>
          </div>
        </TokenCard>

        {/* Brand role tokens */}
        <TokenCard title="Brand Roles (contrast-paired)">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {BRAND_ROLES.map(({ token, value, on }) => (
              <div key={token} className="overflow-hidden rounded-lg border">
                <div
                  className="flex h-16 items-center justify-between px-4 text-sm font-semibold"
                  style={{ backgroundColor: value, color: on }}
                >
                  <span>{token}</span>
                  <span className="font-mono text-xs uppercase opacity-90">{value}</span>
                </div>
                <p className="bg-card px-4 py-1 text-[10px] text-muted-foreground">on {on}</p>
              </div>
            ))}
          </div>
        </TokenCard>

        {/* Background system */}
        <TokenCard title="Background System">
          <div className="relative h-40 overflow-hidden rounded-lg border">
            <AnimatedGrid className="absolute inset-0" />
            <GradientMesh className="absolute inset-0" />
            <Particles className="absolute inset-0 h-full w-full" count={18} />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Animated grid + gradient mesh + tiny particles (CSS/canvas, GPU friendly).
          </p>
        </TokenCard>

        {/* Brand + semantic colors */}
        <TokenCard title="Brand Colors">
          <div className="grid grid-cols-5 gap-2">
            {Object.entries(brand).map(([name, value]) => (
              <div key={name} className="overflow-hidden rounded-md border">
                <div className="h-10" style={{ backgroundColor: value }} />
                <p className="p-1 text-[10px] text-muted-foreground">{name}</p>
              </div>
            ))}
          </div>
        </TokenCard>

        <TokenCard title="Semantic Colors">
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(semantic).map(([name, value]) => (
              <div key={name} className="overflow-hidden rounded-md border">
                <div className="h-10" style={{ backgroundColor: value }} />
                <p className="p-1 text-[10px] text-muted-foreground">{name}</p>
              </div>
            ))}
          </div>
        </TokenCard>

        {/* Typography */}
        <TokenCard title="Typography">
          <div className="flex flex-col gap-2">
            <p className="text-4xl font-bold tracking-tight">Display / Heading 1</p>
            <p className="text-2xl font-semibold">Heading 2 — پیش نمایش فارسی</p>
            <p className="text-lg">Body large — Premium enterprise software, engineered like a product.</p>
            <p className="text-sm text-muted-foreground">Caption / meta — Updated a moment ago</p>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-600">Overline — Enterprise</p>
          </div>
        </TokenCard>

        {/* Spacing */}
        <TokenCard title="Spacing (4px grid)">
          <div className="flex flex-wrap items-end gap-2">
            {[1, 2, 4, 8, 12, 16, 24, 32].map((s) => (
              <div key={s} className="flex flex-col items-center gap-1">
                <div className="bg-brand-500/60" style={{ width: s, height: s }} />
                <span className="text-[10px] text-muted-foreground">{s}px</span>
              </div>
            ))}
          </div>
        </TokenCard>

        {/* Radius */}
        <TokenCard title="Radius">
          <div className="flex flex-wrap gap-4">
            {Object.entries(radius).map(([name, value]) => (
              <div key={name} className="flex flex-col items-center gap-1">
                <div className="h-14 w-14 border-2 border-brand-500/50 bg-brand-500/10" style={{ borderRadius: value }} />
                <span className="text-[10px] text-muted-foreground">{name}</span>
              </div>
            ))}
          </div>
        </TokenCard>

        {/* Shadows / elevation */}
        <TokenCard title="Shadows / Elevation">
          <div className="flex flex-wrap gap-4">
            {Object.entries(shadow).map(([name, value]) => (
              <div key={name} className="flex h-16 w-28 items-center justify-center rounded-lg border bg-card text-[10px]" style={{ boxShadow: value }}>
                {name}
              </div>
            ))}
          </div>
        </TokenCard>

        {/* Gradients */}
        <TokenCard title="Gradients">
          <div className="grid grid-cols-2 gap-3">
            {[gradients.brand, gradients.hero, gradients.cta, gradients.mesh].map((g) => (
              <div key={g.name} className="flex h-20 items-center justify-center rounded-lg text-sm font-medium text-white" style={{ background: g.css }}>
                {g.name}
              </div>
            ))}
          </div>
        </TokenCard>

        {/* Motion */}
        <TokenCard title="Motion Presets">
          <div className="flex flex-wrap gap-3">
            {Object.entries(motion).map(([name, preset]) => (
              <Badge key={name} variant="secondary">
                {name} · {Math.round(preset.duration * 1000)}ms
              </Badge>
            ))}
          </div>
        </TokenCard>

        {/* Glass */}
        <TokenCard title="Glass Surfaces">
          <div className="grid grid-cols-3 gap-3">
            <GlassCard className="p-6 text-center text-sm">subtle</GlassCard>
            <GlassCard className="p-6 text-center text-sm">standard</GlassCard>
            <GlassCard className="glass-strong rounded-xl p-6 text-center text-sm">strong</GlassCard>
          </div>
        </TokenCard>

        {/* Effects */}
        <TokenCard title="Effects">
          <div className="grid gap-4 md:grid-cols-2">
            <Glow>
              <Card className="p-6">Glow wrapper</Card>
            </Glow>
            <BorderGlow>
              <Card className="border-0 p-6">Border glow</Card>
            </BorderGlow>
            <FloatingCard>
              <Card className="p-6">Floating card</Card>
            </FloatingCard>
            <SoftTilt>
              <Card className="p-6">Soft tilt — move your cursor</Card>
            </SoftTilt>
            <Spotlight>
              <Card className="p-6">Spotlight — move your cursor</Card>
            </Spotlight>
            <MagneticHover>
              <Card className="p-6">Magnetic hover</Card>
            </MagneticHover>
          </div>
          <div className="mt-4">
            <Reveal>
              <Card className="p-6">Reveal on scroll</Card>
            </Reveal>
          </div>
        </TokenCard>

        {/* CTAs */}
        <TokenCard title="Buttons">
          <div className="flex flex-wrap gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
        </TokenCard>

        {/* Forms + status */}
        <TokenCard title="Forms & Semantic Status">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="flex flex-col gap-3">
              <Input placeholder="Email address" />
              <Input placeholder="Company" />
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-success/10 text-success">Success · delivered</Badge>
                <Badge className="bg-warning/10 text-warning">Warning · review</Badge>
                <Badge className="bg-error/10 text-error">Error · failed</Badge>
                <Badge className="bg-info/10 text-info">Info · info</Badge>
              </div>
            </div>
            <div className="flex flex-col justify-center gap-3">
              <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
                <span className="h-2.5 w-2.5 rounded-full bg-success" />
                <p className="text-sm">Operational — all systems nominal</p>
              </div>
              <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
                <span className="h-2.5 w-2.5 rounded-full bg-warning" />
                <p className="text-sm">Degraded — retries in progress</p>
              </div>
              <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
                <span className="h-2.5 w-2.5 rounded-full bg-error" />
                <p className="text-sm">Outage — contact engineering</p>
              </div>
            </div>
          </div>
        </TokenCard>
      </div>
    </PageWrapper>
  )
}
