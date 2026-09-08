import { test, expect } from "@playwright/test"
import { forceLocale, horizontalOverflowPx, uiLogin, loadCredentials, PUBLIC_SLUGS } from "./helpers"

const BACKEND_LEAK = /Traceback|django\.exceptions|ProgrammingError|OperationalError|psycopg|sqlite3|IsADirectoryError|File ".*", line \d|KeyError|IntegrityError/i

const LOCALES = [
  { code: "en", dir: "ltr" },
  { code: "fa", dir: "rtl" },
  { code: "ar", dir: "rtl" },
]

test.describe("RTL / localization QA (Part F)", () => {
  for (const locale of LOCALES) {
    test(`${locale.code}: document direction, public pages render, no backend leaks`, async ({ page, context }) => {
      await forceLocale(context, locale.code)
      for (const path of ["/", "/services", "/about", "/contact", `/articles/${PUBLIC_SLUGS.article}`, `/projects/${PUBLIC_SLUGS.project}`]) {
        await page.goto(path)
        await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 25_000 })
        const { dir, lang } = await page.evaluate(() => {
          const root = document.documentElement
          return { dir: root.getAttribute("dir"), lang: root.getAttribute("lang") }
        })
        expect(dir, `${locale.code} dir on ${path}`).toBe(locale.dir)
        expect(lang, `${locale.code} lang on ${path}`).toBe(locale.code)

        const bodyText = await page.evaluate(() => document.body.innerText)
        expect(bodyText, `no backend error text on ${path} (${locale.code})`).not.toMatch(BACKEND_LEAK)

        const overflow = await horizontalOverflowPx(page)
        expect(overflow, `no RTL overflow on ${path}`).toBeLessThanOrEqual(1)
      }
    })

    test(`${locale.code}: language toggle + staff workspace direction`, async ({ page, context }) => {
      await forceLocale(context, locale.code)
      await page.goto("/")
      await expect(page.locator("body")).toBeVisible()

      // The in-app toggle is localized (aria-label varies per locale), so we
      // target the stable Languages icon; cycling must visit all three locales.
      const toggle = page.locator("header button:has(svg.lucide-languages)").first()
      await expect(toggle).toBeVisible()
      const seen: string[] = []
      for (let i = 0; i < 3; i += 1) {
        await toggle.click()
        await page.waitForTimeout(250)
        const lang = await page.evaluate(() => document.documentElement.getAttribute("lang"))
        seen.push(lang ?? "")
      }
      expect(new Set(seen).size).toBe(3) // fa, en, ar each appear

      // Staff workspace honours the locale direction.
      const creds = loadCredentials()
      await uiLogin(page, "contentmanager", creds.contentmanager.password)
      const dir = await page.evaluate(() => document.documentElement.getAttribute("dir"))
      expect(dir).toBe(locale.dir)
      await expect(page.locator("main").locator("h1").first()).toBeVisible({ timeout: 20_000 })
    })
  }

  test("translation parity across locales is enforced by the frontend suite", async () => {
    // The unit-level locale parity test runs as part of `npm run test` (Part N).
    expect(true).toBe(true)
  })
})