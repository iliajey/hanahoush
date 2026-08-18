import { describe, expect, it } from "vitest"

import { cmsQueryBaseOptions, staleTimeFor } from "@/features/cms/cache/strategy"
import { cmsKeys } from "@/features/cms/queries/keys"

describe("cms query keys", () => {
  it("scopes every key by locale", () => {
    expect(cmsKeys.articles.list("fa", {})[2]).toBe("fa")
    expect(cmsKeys.articles.list("en", {})[2]).toBe("en")
    expect(cmsKeys.site.footer("ar")).toEqual(["cms", "site", "ar", "footer"])
  })

  it("isolates params within a resource", () => {
    const a = cmsKeys.articles.list("en", { page: 1 })
    const b = cmsKeys.articles.list("en", { page: 2 })
    expect(a).not.toEqual(b)
  })

  it("separates featured from plain lists", () => {
    const a = cmsKeys.projects.list("en", { featured: true, limit: 3 })
    const b = cmsKeys.projects.list("en", {})
    expect(a).not.toEqual(b)
  })
})

describe("cms cache strategy", () => {
  it("resolves stale times per tier", () => {
    expect(staleTimeFor("site")).toBe(1000 * 60 * 30)
    expect(staleTimeFor("content")).toBe(1000 * 60 * 5)
    expect(staleTimeFor("listings")).toBe(1000 * 60 * 2)
    expect(staleTimeFor()).toBe(1000 * 60 * 2)
  })

  it("builds base query options with retry + gc", () => {
    const options = cmsQueryBaseOptions({ tier: "site" })
    expect(options.staleTime).toBe(1000 * 60 * 30)
    expect(options.retry).toBe(2)
    expect(options.gcTime).toBe(1000 * 60 * 10)
    expect(options.refetchOnWindowFocus).toBe(false)
    expect(options.refetchOnReconnect).toBe(true)
  })

  it("applies exponential backoff", () => {
    const options = cmsQueryBaseOptions()
    const delay = (options.retryDelay as (attempt: number) => number)(3)
    expect(delay).toBe(300 * 2 ** 3)
  })
})
