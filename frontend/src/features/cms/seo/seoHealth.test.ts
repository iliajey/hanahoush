import { describe, expect, it } from "vitest"

import { seoHealthItems } from "./seoHealth"

const t = (k: string, o?: Record<string, unknown>) =>
  o?.count != null ? `${k}:${o.count}` : o?.locale ? `${k}:${o.locale}` : k

describe("seoHealthItems", () => {
  it("flags missing slug as critical and missing SEO as warnings", () => {
    const items = seoHealthItems({ title_en: "Hi" }, t)
    expect(items.find((i) => i.key === "seo-slug")?.severity).toBe("critical")
    expect(items.some((i) => i.key === "seo-title-missing")).toBe(true)
    expect(items.some((i) => i.key === "seo-desc-missing")).toBe(true)
    expect(items.some((i) => i.key === "seo-canonical-missing")).toBe(true)
    expect(items.some((i) => i.key === "seo-og-missing")).toBe(true)
  })

  it("flags long title/description and canonical mismatch", () => {
    const items = seoHealthItems(
      {
        slug: "my-post",
        meta_title: "x".repeat(70),
        meta_description: "y".repeat(200),
        canonical_url: "https://example.com/other",
        og_image: { file: "a.png" },
        title_en: "EN",
        title_fa: "FA",
        title_ar: "AR",
      },
      t,
    )
    expect(items.some((i) => i.key === "seo-title-long")).toBe(true)
    expect(items.some((i) => i.key === "seo-desc-long")).toBe(true)
    expect(items.some((i) => i.key === "seo-canonical-mismatch")).toBe(true)
  })

  it("is quiet for complete SEO", () => {
    const items = seoHealthItems(
      {
        slug: "my-post",
        meta_title: "Good title here",
        meta_description: "Good description here",
        canonical_url: "https://example.com/articles/my-post",
        og_image: { file: "a.png" },
        title_en: "EN",
        title_fa: "FA",
        title_ar: "AR",
      },
      t,
    )
    expect(items).toEqual([])
  })
})
