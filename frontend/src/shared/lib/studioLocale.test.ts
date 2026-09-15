import { describe, expect, it } from "vitest"

import { studioLocaleFromSearchParams, studioPathWithLocale } from "./studioLocale"

describe("studioLocaleFromSearchParams (Phase 18)", () => {
  it("preselects a valid locale from ?locale=", () => {
    expect(studioLocaleFromSearchParams(new URLSearchParams("locale=fa"), "en")).toBe("fa")
    expect(studioLocaleFromSearchParams(new URLSearchParams("locale=ar"), "en")).toBe("ar")
    expect(studioLocaleFromSearchParams(new URLSearchParams("locale=en"), "fa")).toBe("en")
  })

  it("falls back safely on missing/invalid locale", () => {
    expect(studioLocaleFromSearchParams(new URLSearchParams(""), "en")).toBe("en")
    expect(studioLocaleFromSearchParams(new URLSearchParams("locale=xx"), "fa")).toBe("fa")
    expect(studioLocaleFromSearchParams(new URLSearchParams("locale="), "ar")).toBe("ar")
  })

  it("builds studio deep links with locale preselect", () => {
    expect(studioPathWithLocale("/dashboard/articles/7/edit", "fa")).toBe(
      "/dashboard/articles/7/edit?locale=fa",
    )
  })
})
