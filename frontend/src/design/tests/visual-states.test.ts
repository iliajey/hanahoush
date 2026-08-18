import { describe, expect, it } from "vitest"

import {
  visualStateTokens,
  visualStateForSectionType,
  visualStateVars,
  type VisualState,
} from "@/design/visual-states"
import { classifyCursorState, cursorStateTokens, type CursorState } from "@/design/cursor"

describe("visual states", () => {
  it("defines tokens for every visual state", () => {
    const states: VisualState[] = ["hero", "services", "erp", "projects", "articles", "cta", "default"]
    for (const state of states) {
      const t = visualStateTokens[state]
      expect(t.gridSize).toBeGreaterThan(0)
      expect(t.energyOpacity).toBeGreaterThanOrEqual(0)
      expect(t.energyOpacity).toBeLessThanOrEqual(1)
      expect(t.meshOpacity).toBeGreaterThanOrEqual(0)
      expect(t.meshOpacity).toBeLessThanOrEqual(1)
      expect(t.energyX.endsWith("%")).toBe(true)
      expect(t.energyY.endsWith("%")).toBe(true)
    }
  })

  it("maps page-builder section types onto the visual story", () => {
    expect(visualStateForSectionType("hero")).toBe("hero")
    expect(visualStateForSectionType("services")).toBe("services")
    expect(visualStateForSectionType("erp")).toBe("erp")
    expect(visualStateForSectionType("projects")).toBe("projects")
    expect(visualStateForSectionType("featured_projects")).toBe("projects")
    expect(visualStateForSectionType("project_filters")).toBe("projects")
    expect(visualStateForSectionType("articles")).toBe("articles")
    expect(visualStateForSectionType("latest_articles")).toBe("articles")
    expect(visualStateForSectionType("cta")).toBe("cta")
    expect(visualStateForSectionType("case_cta")).toBe("cta")
    expect(visualStateForSectionType("faq")).toBe("default")
    expect(visualStateForSectionType("unknown")).toBe("default")
  })

  it("defines the scroll-story direction (calm -> strong return)", () => {
    // Articles calm down (larger cells, weaker energy)…
    expect(visualStateTokens.articles.gridSize).toBeGreaterThan(visualStateTokens.erp.gridSize)
    expect(visualStateTokens.articles.energyOpacity).toBeLessThan(visualStateTokens.hero.energyOpacity)
    // …while the final CTA returns the strongest brand energy on the home page.
    expect(visualStateTokens.cta.energyOpacity).toBeGreaterThan(visualStateTokens.articles.energyOpacity)
    expect(visualStateTokens.default.energyOpacity).toBeLessThan(visualStateTokens.hero.energyOpacity)
  })

  it("publishes CSS-variable names that the background consumes", () => {
    expect(visualStateVars.gridSize).toBe("--vs-grid-size")
    expect(visualStateVars.gridScale).toBe("--vs-grid-scale")
    expect(visualStateVars.energyOpacity).toBe("--vs-energy-opacity")
    expect(visualStateVars.meshOpacity).toBe("--vs-mesh-opacity")
  })
})

describe("cursor states", () => {
  it("keeps the native cursor over text-entry surfaces", () => {
    expect(classifyCursorState(document.createElement("input"))).toBe("text")
    expect(classifyCursorState(document.createElement("textarea"))).toBe("text")
    const select = document.createElement("select")
    expect(classifyCursorState(select)).toBe("text")
  })

  it("classifies links, buttons, disabled and aria-disabled elements", () => {
    const link = document.createElement("a")
    link.href = "#"
    expect(classifyCursorState(link)).toBe("link")

    const disabledLink = document.createElement("a")
    disabledLink.href = "#"
    disabledLink.setAttribute("aria-disabled", "true")
    expect(classifyCursorState(disabledLink)).toBe("disabled")

    const button = document.createElement("button")
    expect(classifyCursorState(button)).toBe("button")

    const disabledButton = document.createElement("button")
    disabledButton.disabled = true
    expect(classifyCursorState(disabledButton)).toBe("disabled")
  })

  it("classifies cards (annotated or via the shared bg-card token)", () => {
    const annotated = document.createElement("div")
    annotated.setAttribute("data-cursor", "card")
    expect(classifyCursorState(annotated)).toBe("card")

    const byClass = document.createElement("div")
    byClass.className = "rounded-xl border bg-card"
    expect(classifyCursorState(byClass)).toBe("card")
  })

  it("classifies draggable surfaces and defaults", () => {
    const draggable = document.createElement("div")
    draggable.setAttribute("draggable", "true")
    expect(classifyCursorState(draggable)).toBe("draggable")

    expect(classifyCursorState(document.body)).toBe("default")
    expect(classifyCursorState(null)).toBe("default")
  })

  it("gives interactive controls priority over card ancestors", () => {
    const linkInCard = document.createElement("a")
    linkInCard.href = "#"
    linkInCard.className = "bg-card"
    expect(classifyCursorState(linkInCard)).toBe("link")
  })

  it("defines a visual style for every cursor state", () => {
    const states: CursorState[] = ["default", "link", "button", "card", "draggable", "text", "disabled"]
    for (const state of states) {
      expect(cursorStateTokens[state].ringScale).toBeGreaterThan(0)
      expect(cursorStateTokens[state].orbScale).toBeGreaterThanOrEqual(0)
    }
    expect(cursorStateTokens.text.ringOpacity).toBe(0)
  })
})