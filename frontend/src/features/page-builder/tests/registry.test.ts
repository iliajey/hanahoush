import { describe, expect, it } from "vitest"

import { isRegisteredSection, registeredSections } from "@/features/page-builder/registry"
import { SECTION_TYPES } from "@/features/page-builder/config"

describe("page-builder section registry", () => {
  it("registers every canonical section type", () => {
    for (const type of SECTION_TYPES) {
      expect(isRegisteredSection(type)).toBe(true)
    }
  })

  it("rejects unknown types", () => {
    expect(isRegisteredSection("mystery")).toBe(false)
    expect(isRegisteredSection("hero-section-2")).toBe(false)
  })

  it("lists the full registry with metadata", () => {
    const sections = registeredSections()
    const types = sections.map((s) => s.type)
    expect(types).toContain("hero")
    expect(types).toContain("faq")
    expect(types).toContain("footer")
    for (const section of sections) {
      expect(section.name).toBeTruthy()
      expect(section.description).toBeTruthy()
      expect(section.Component).toBeDefined()
    }
  })
})
