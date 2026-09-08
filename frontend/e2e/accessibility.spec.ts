import { test, expect } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"
import { mkdirSync, writeFileSync } from "node:fs"
import { PUBLIC_SLUGS } from "./helpers"

const SCAN_PAGES = [
  { path: "/", name: "home" },
  { path: "/services", name: "services" },
  { path: "/articles", name: "articles" },
  { path: "/articles/" + PUBLIC_SLUGS.article, name: "article-detail" },
  { path: "/projects", name: "projects" },
  { path: "/projects/" + PUBLIC_SLUGS.project, name: "project-detail" },
  { path: "/about", name: "about" },
  { path: "/contact", name: "contact" },
  { path: "/login", name: "login" },
]

mkdirSync("e2e-artifacts/axe", { recursive: true })

test.describe("accessibility (Part I)", () => {
  for (const pageSpec of SCAN_PAGES) {
    test(`axe scan: ${pageSpec.name} has no critical violations`, async ({ page }) => {
      await page.goto(pageSpec.path)
      await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 25_000 })
      await page.evaluate(() => document.fonts?.ready)
      await page.waitForTimeout(1200)

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze()

      writeFileSync(
        `e2e-artifacts/axe/${pageSpec.name}.json`,
        JSON.stringify({ url: page.url, violations: results.violations }, null, 2),
      )

      const critical = results.violations.filter((v) => v.impact === "critical")
      expect(critical, `${pageSpec.name}: critical axe violations ${JSON.stringify(critical.map((v) => v.id))}`).toEqual([])
      const serious = results.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical",
      )
      expect(serious, `${pageSpec.name}: serious axe violations ${JSON.stringify(serious.map((v) => v.id))}`).toEqual([])
    })
  }

  test("single meaningful H1 per public page", async ({ page }) => {
    for (const spec of SCAN_PAGES) {
      await page.goto(spec.path)
      await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 20_000 })
      const h1s = await page.evaluate(() =>
        Array.from(document.querySelectorAll("h1")).map((el) => (el.textContent ?? "").trim()).filter(Boolean),
      )
      expect(h1s.length, `${spec.name} h1 count ${JSON.stringify(h1s)}`).toBe(1)
    }
  })

  test("landmarks: banner/navigation/main/contentinfo present on public shell", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator("body")).toBeVisible()
    expect(await page.locator("header").count()).toBeGreaterThanOrEqual(1)
    expect(await page.locator("main").count()).toBe(1)
    expect(await page.locator("footer").count()).toBeGreaterThanOrEqual(1)
    expect(await page.locator("nav").count()).toBeGreaterThan(0)
  })

  test("contact form controls have associated labels", async ({ page }) => {
    await page.goto("/contact")
    await expect(page.locator("form").first()).toBeVisible({ timeout: 25_000 })
    const unlabeled = await page.evaluate(() => {
      const controls = Array.from(document.querySelectorAll("form input, form textarea, form select"))
      return controls.filter((el) => {
        const input = el as HTMLInputElement
        // Hidden/components-internals (Radix hidden form fallbacks) are not
        // exposed to assistive tech and never need a label.
        if (input.getAttribute("aria-hidden") === "true") return false
        const id = input.id || ""
        const labeledById = id !== "" && Boolean(document.querySelector(`label[for="${id}"]`))
        const implicitlyLabeled = Boolean(input.closest("label"))
        const labeledByAttr =
          Boolean(input.getAttribute("aria-label")) ||
          Boolean(
            input.getAttribute("aria-labelledby") &&
              document.getElementById(input.getAttribute("aria-labelledby") ?? ""),
          )
        return !(labeledById || implicitlyLabeled || labeledByAttr)
      }).length
    })
    // Every control exposed to assistive tech must be programmatically labelled.
    expect(unlabeled).toBe(0)
  })

  test("images have alt text or are marked decorative", async ({ page }) => {
    await page.goto("/services")
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 25_000 })
    const bad = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll("img"))
      return images.filter((img) => {
        const i = img as HTMLImageElement
        return !i.hasAttribute("alt") && !i.getAttribute("aria-hidden")
      }).length
    })
    expect(bad).toBe(0)
  })
})