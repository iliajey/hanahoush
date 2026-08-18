import { describe, expect, it } from "vitest"

import { brand, semantic, themes } from "@/design/colors"
import { fontFamily, scripts, display, heading, body } from "@/design/typography"
import { spacing, containers } from "@/design/spacing"
import { radius, contexts } from "@/design/radius"
import { gradients } from "@/design/gradients"
import { motion } from "@/design/motion"
import { glass } from "@/design/glass"
import { cursorTokens } from "@/design/cursor"

describe("design tokens", () => {
  it("exposes a full brand scale plus brand role tokens", () => {
    const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const
    for (const step of steps) {
      expect(brand[step]).toMatch(/^#[0-9a-f]{6}$/i)
    }
    // Phase 9C brand role tokens (single source of truth for components).
    expect(brand.primary).toMatch(/^#[0-9a-f]{6}$/i)
    expect(brand.primaryHover).toMatch(/^#[0-9a-f]{6}$/i)
    expect(brand.primaryActive).toMatch(/^#[0-9a-f]{6}$/i)
    expect(brand.secondary).toMatch(/^#[0-9a-f]{6}$/i)
    expect(brand.secondaryHover).toMatch(/^#[0-9a-f]{6}$/i)
    expect(brand.accent).toMatch(/^#[0-9a-f]{6}$/i)
    expect(brand.accentSoft).toMatch(/^#[0-9a-f]{6}$/i)
    expect(brand.onPrimary).toMatch(/^#[0-9a-f]{6}$/i)
    expect(brand.onSecondary).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it("defines light and dark theme variable maps", () => {
    expect(Object.keys(themes)).toEqual(["light", "dark"])
    expect(themes.light["--background"]).toBeTruthy()
    expect(themes.dark["--background"]).toBeTruthy()
    expect(themes.light["--success"]).toBeTruthy()
    expect(themes.dark["--success"]).toBeTruthy()
  })

  it("semantic tokens reference CSS variables", () => {
    expect(semantic.primary).toMatch(/^hsl\(var\(--primary\)\)$/)
    expect(semantic.foreground).toMatch(/var\(--foreground\)/)
    // Phase 9C brand-semantic roles resolve to the shared CSS pipeline.
    expect(semantic.success).toMatch(/var\(--success\)/)
    expect(semantic.warning).toMatch(/var\(--warning\)/)
    expect(semantic.error).toMatch(/var\(--error\)/)
    expect(semantic.info).toMatch(/var\(--info\)/)
    expect(semantic.surface).toMatch(/var\(--card\)/)
    expect(semantic.focus).toMatch(/var\(--ring\)/)
  })

  it("typography covers scripts and scale", () => {
    expect(Object.keys(scripts)).toEqual(["fa", "ar", "en"])
    expect(scripts.fa.rtl).toBe(true)
    expect(scripts.en.rtl).toBe(false)
    expect(display.xl.size).toBeTruthy()
    expect(heading.h1.size).toBeTruthy()
    expect(body.md.size).toBeTruthy()
    expect(fontFamily.sans.length).toBeGreaterThan(0)
  })

  it("spacing is a 4px grid and containers are defined", () => {
    expect(spacing[4]).toBe("1rem")
    expect(Number.parseFloat(spacing[8])).toBeGreaterThan(Number.parseFloat(spacing[4]))
    expect(containers["2xl"]).toBe("1440px")
  })

  it("radius has a full scale and per-context mapping", () => {
    expect(radius.full).toBe("9999px")
    expect(contexts.card).toBe("lg")
    expect(contexts.button).toBe("md")
  })

  it("gradients expose a CSS string for every renderable surface", () => {
    for (const g of [gradients.brand, gradients.hero, gradients.cta, gradients.mesh]) {
      expect(g.css.length).toBeGreaterThan(20)
    }
  })

  it("motion presets have durations and easings", () => {
    for (const preset of Object.values(motion)) {
      expect(preset.duration).toBeGreaterThan(0)
      expect(preset.ease.length).toBeGreaterThanOrEqual(2)
    }
  })

  it("glass defines levels and usage rules", () => {
    expect(Object.keys(glass.levels)).toEqual(["subtle", "standard", "strong"])
    expect(glass.allowed.length).toBeGreaterThan(0)
    expect(glass.forbidden.length).toBeGreaterThan(0)
  })

  it("cursor tokens satisfy the living-cursor contract", () => {
    expect(cursorTokens.orb.size).toBeGreaterThan(0)
    expect(cursorTokens.orb.glowSize).toBeGreaterThan(cursorTokens.orb.size)
    expect(cursorTokens.motion.interpolation).toBeGreaterThan(0)
    expect(cursorTokens.motion.interpolation).toBeLessThanOrEqual(1)
    expect(cursorTokens.gates.requireFinePointer).toBe(true)
    expect(cursorTokens.gates.reducedMotionDisables).toBe(true)
  })
})
