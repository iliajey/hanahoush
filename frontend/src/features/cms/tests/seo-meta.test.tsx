import { afterEach, describe, expect, it } from "vitest"
import { render } from "@testing-library/react"

import { useSeoMeta, type SeoInput } from "@/features/cms/seo/useSeoMeta"

function SeoHarness({ seo }: { seo: SeoInput }) {
  useSeoMeta(seo, "en", { title: "Fallback Title" })
  return null
}

function renderSeo(seo: SeoInput) {
  const view = render(<SeoHarness seo={seo} />)
  return {
    ...view,
    meta: (key: string) =>
      document.head.querySelector<HTMLMetaElement>(`meta[property="${key}"], meta[name="${key}"]`)?.content,
    link: (rel: string, hreflang?: string) =>
      document.head.querySelector<HTMLLinkElement>(
        `link[rel="${rel}"]${hreflang ? `[hreflang="${hreflang}"]` : ""}`,
      ),
  }
}

describe("useSeoMeta", () => {
  afterEach(() => {
    document.title = ""
    document.head.querySelectorAll("meta, link").forEach((el) => el.remove())
  })

  it("sets title and description", () => {
    const { meta } = renderSeo({ title: "About Hanahoush", description: "A description.", robots: "index,follow" })
    expect(document.title).toBe("About Hanahoush")
    expect(meta("description")).toBe("A description.")
    expect(meta("robots")).toBe("index,follow")
  })

  it("emits canonical + open graph", () => {
    const { link, meta } = renderSeo({ title: "T", canonicalUrl: "https://hanahoush.dev/about" })
    expect(link("canonical")?.getAttribute("href")).toBe("https://hanahoush.dev/about")
    expect(meta("og:url")).toBe("https://hanahoush.dev/about")
    expect(meta("twitter:card")).toBe("summary_large_image")
  })

  it("emits hreflang alternates when provided", () => {
    renderSeo({
      title: "T",
      canonicalUrl: "https://hanahoush.dev/about",
      alternates: {
        en: "https://hanahoush.dev/about",
        fa: "https://hanahoush.dev/about?lang=fa",
      },
    })
    expect(document.head.querySelector('link[hreflang="en"]')?.getAttribute("href")).toBe(
      "https://hanahoush.dev/about",
    )
    expect(document.head.querySelector('link[hreflang="fa"]')?.getAttribute("href")).toBe(
      "https://hanahoush.dev/about?lang=fa",
    )
    expect(document.head.querySelector('link[hreflang="x-default"]')?.getAttribute("href")).toBe(
      "https://hanahoush.dev/about",
    )
  })

  it("removes stale alternates when none are provided on the next render", () => {
    const { rerender } = render(<SeoHarness seo={{ title: "A", alternates: { en: "/a" } }} />)
    expect(document.head.querySelectorAll('link[hreflang]')).not.toHaveLength(0)
    rerender(<SeoHarness seo={{ title: "A" }} />)
    expect(document.head.querySelectorAll('link[hreflang]')).toHaveLength(0)
  })

  it("keeps googlebot aligned with robots", () => {
    renderSeo({ title: "T", robots: "noindex,follow" })
    expect(document.head.querySelector('meta[name="googlebot"]')?.getAttribute("content")).toBe("noindex,follow")
  })
})