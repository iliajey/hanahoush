import { describe, expect, it, vi } from "vitest"

import { resolveMediaFile, resolveMediaUrl } from "./resolveMediaUrl"

vi.stubEnv("VITE_API_BASE_URL", "http://localhost:8000/api/v1")

describe("resolveMediaUrl", () => {
  it("leaves absolute URLs untouched", () => {
    expect(resolveMediaUrl("https://cdn.example.com/a.jpg")).toBe("https://cdn.example.com/a.jpg")
  })

  it("joins relative media paths onto the API origin", () => {
    expect(resolveMediaUrl("/media/media/2026/09/cover.png")).toBe(
      "http://localhost:8000/media/media/2026/09/cover.png",
    )
  })

  it("returns null for empty input", () => {
    expect(resolveMediaUrl(null)).toBeNull()
    expect(resolveMediaUrl(undefined)).toBeNull()
  })
})

describe("resolveMediaFile", () => {
  it("prefers preview_url over file", () => {
    expect(
      resolveMediaFile({ preview_url: "/media/a.png", file: "/media/b.png" }),
    ).toBe("http://localhost:8000/media/a.png")
  })

  it("falls back to file when no preview exists", () => {
    expect(resolveMediaFile({ preview_url: null, file: "/media/b.png" })).toBe(
      "http://localhost:8000/media/b.png",
    )
  })
})
