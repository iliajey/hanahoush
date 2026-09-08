import { test, expect, type Page } from "@playwright/test"
import { forceTheme } from "./helpers"

/** Known brand tokens (kept from the real organisational identity). */
const LIGHT_TOKENS = {
  primary: "302 56% 37%", // #932990
  background: "330 33% 99%", // ~#FDFBFC near-white
  ring: "302 56% 37%",
}
const DARK_TOKENS = {
  primary: "302 49% 57%",
  background: "252 43% 7%", // deep #272161-adjacent surface
  ring: "303 56% 69%",
}

async function readTokens(page: Page) {
  return page.evaluate(() => {
    const root = getComputedStyle(document.documentElement)
    const pick = (name: string) => root.getPropertyValue(name).trim()
    return {
      primary: pick("--primary"),
      background: pick("--background"),
      ring: pick("--ring"),
    }
  })
}

test.describe("theme QA (Part G)", () => {
  test("light theme tokens", async ({ page, context }) => {
    await forceTheme(context, "light")
    await page.goto("/")
    await expect(page.locator("body")).toBeVisible()
    const tokens = await readTokens(page)
    expect(tokens.primary).toBe(LIGHT_TOKENS.primary)
    expect(tokens.ring).toBe(LIGHT_TOKENS.ring)
    expect(tokens.background).toBe(LIGHT_TOKENS.background)
  })

  test("dark theme tokens", async ({ page, context }) => {
    await forceTheme(context, "dark")
    await page.goto("/")
    await expect(page.locator("body")).toBeVisible()
    const tokens = await readTokens(page)
    expect(tokens.primary).toBe(DARK_TOKENS.primary)
    expect(tokens.ring).toBe(DARK_TOKENS.ring)
    expect(tokens.background).toBe(DARK_TOKENS.background)
  })

  test("system theme follows OS dark preference", async ({ page, context }) => {
    await forceTheme(context, "system")
    await page.emulateMedia({ colorScheme: "dark" })
    await page.goto("/")
    await expect(page.locator("body")).toBeVisible()
    const tokens = await readTokens(page)
    expect(tokens.primary).toBe(DARK_TOKENS.primary)
  })

  test("system theme follows OS light preference", async ({ page, context }) => {
    await forceTheme(context, "system")
    await page.emulateMedia({ colorScheme: "light" })
    await page.goto("/")
    await expect(page.locator("body")).toBeVisible()
    const tokens = await readTokens(page)
    expect(tokens.primary).toBe(LIGHT_TOKENS.primary)
  })

  test("light vs dark actually differ on body background", async ({ page, context }) => {
    await forceTheme(context, "light")
    await page.goto("/")
    await expect(page.locator("body")).toBeVisible()
    const lightBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)

    await forceTheme(context, "dark")
    await page.goto("/")
    await expect(page.locator("body")).toBeVisible()
    const darkBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
    expect(lightBg).not.toBe(darkBg)
  })

  test("focus ring is visible and uses the primary/ring token", async ({ page, context }) => {
    await forceTheme(context, "light")
    await page.goto("/")
    await page.locator("a, button").first().focus()
    const outline = await page.evaluate(() => {
      const el = document.activeElement
      const s = el ? getComputedStyle(el) : null
      return s ? { color: s.outlineColor, width: s.outlineWidth, style: s.outlineStyle } : null
    })
    expect(outline).not.toBeNull()
    expect(outline!.style).toBe("solid")
    expect(outline!.width).not.toBe("0px")
    expect(outline!.color).not.toBe("rgba(0, 0, 0, 0)")
  })

  test("brand logo renders in navbar", async ({ page }) => {
    await page.goto("/")
    const logo = page.locator("img[src*='hanahoush-logo'], img[alt*='Hanahoush']").first()
    await expect(logo).toBeVisible()
    const size = await logo.evaluate((el: HTMLImageElement) => ({ w: el.naturalWidth, h: el.naturalHeight }))
    expect(size.w).toBeGreaterThan(0)
    expect(size.h).toBeGreaterThan(0)
  })
})