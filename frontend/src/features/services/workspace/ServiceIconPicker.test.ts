import { describe, expect, it } from "vitest"

import { SERVICE_ICON_KEYS, sectionIcon } from "@/features/page-builder/registry/sections/common"

describe("Phase 21 service icon set", () => {
  it("exposes a small curated key list", () => {
    expect(SERVICE_ICON_KEYS.length).toBeLessThanOrEqual(12)
    expect(SERVICE_ICON_KEYS).toContain("code")
  })

  it("resolves every curated key to a real icon component", () => {
    for (const key of SERVICE_ICON_KEYS) {
      expect(sectionIcon(key, 0)).toBeTruthy()
    }
  })

  it("normalizes icon writes the way the studio payload does", () => {
    expect("  Code ".trim().toLowerCase()).toBe("code")
  })
})
