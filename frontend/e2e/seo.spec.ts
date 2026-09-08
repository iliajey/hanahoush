import { test, expect, type Page } from "@playwright/test"
import { PUBLIC_SLUGS } from "./helpers"

interface HeadSnapshot {
  title: string
  description: string
  canonical: string
  robots: string
  ogTitle: string
  ogType: string
  twitterCard: string
  jsonLd: number
  hreflangs: string[]
}

async function headSnapshot(page: Page): Promise<HeadSnapshot> {
  return page.evaluate(() => {
    const text = (sel: string, attr: string, key: string) =>
      document.head.querySelector(`${sel}[${attr}="${key}"]`)?.getAttribute("content") ?? ""
    return {
      title: document.title,
      description: text("meta", "name", "description"),
      canonical: document.head.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? "",
      robots: text("meta", "name", "robots"),
      ogTitle: text("meta", "property", "og:title"),
      ogType: text("meta", "property", "og:type"),
      twitterCard: text("meta", "name", "twitter:card"),
      jsonLd: Array.from(document.querySelectorAll('script[type="application/ld+json"]')).length,
      hreflangs: Array.from(
        document.head.querySelectorAll('link[rel="alternate"][hreflang]'),
      ).map((el) => el.getAttribute("hreflang") ?? ""),
    }
  })
}

const INDEXABLE = [
  { path: "/", name: "home" },
  { path: "/services", name: "services" },
  { path: "/articles", name: "articles" },
  { path: "/articles/" + PUBLIC_SLUGS.article, name: "article-detail" },
  { path: "/projects", name: "projects" },
  { path: "/projects/" + PUBLIC_SLUGS.project, name: "project-detail" },
  { path: "/about", name: "about" },
  { path: "/contact", name: "contact" },
]

test.describe("SEO inspection (Part K)", () => {
  for (const route of INDEXABLE) {
    test(`${route.name} head is complete and indexable`, async ({ page }) => {
      await page.goto(route.path)
      await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 25_000 })
      await expect.poll(() => page.title(), { timeout: 10_000 }).not.toBe("")

      const head = await headSnapshot(page)
      expect(head.title.length, `${route.path} title`).toBeGreaterThan(0)
      expect(head.description.length, `${route.path} description`).toBeGreaterThan(10)
      expect(head.canonical, `${route.path} canonical`).toContain(locationOrigin())
      expect(head.robots).toBe("index,follow")
      expect(head.ogTitle).toBe(head.title)
      expect(head.ogType).toBeTruthy()
      expect(head.twitterCard).toBe("summary_large_image")
    })
  }

  test("auth/error pages are noindex", async ({ page }) => {
    for (const path of ["/login", "/search", "/unauthorized", "/session-expired", "/does-not-exist"]) {
      await page.goto(path)
      await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 25_000 })
      const head = await headSnapshot(page)
      expect(head.robots, `${path} robots`).toContain("noindex")
    }
  })

  test("404 page sets its own title (SPA catch-all)", async ({ page }) => {
    await page.goto("/definitely-not-a-real-page")
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 20_000 })
    const head = await headSnapshot(page)
    expect(head.title.length).toBeGreaterThan(0)
    expect(head.robots).toContain("noindex")
  })

  test("JSON-LD present where applicable", async ({ page }) => {
    await page.goto("/about")
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 25_000 })
    const head = await headSnapshot(page)
    expect(head.jsonLd).toBeGreaterThanOrEqual(1)
  })

  test("backend robots.txt + sitemap.xml are reachable and complete", async ({ request }) => {
    const robots = await request.get("http://127.0.0.1:8000/robots.txt")
    expect(robots.status()).toBe(200)
    const robotsText = await robots.text()
    expect(robotsText).toContain("Disallow: /dashboard")
    expect(robotsText).toContain("Sitemap:")

    const sitemap = await request.get("http://127.0.0.1:8000/sitemap.xml")
    expect(sitemap.status()).toBe(200)
    const sitemapText = await sitemap.text()
    expect(sitemapText).toContain("<urlset")
    expect(sitemapText).toContain("<url>")
  })
})

function locationOrigin() {
  return "localhost:5173"
}