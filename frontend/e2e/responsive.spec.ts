import { test, expect } from "@playwright/test"
import { horizontalOverflowPx, uiLogin, forceLocale, loadCredentials, PUBLIC_SLUGS, VIEWPORTS } from "./helpers"

const PUBLIC = ["/", "/services", "/projects", "/articles", "/about", "/contact", "/articles/" + PUBLIC_SLUGS.article, "/projects/" + PUBLIC_SLUGS.project]

for (const [viewportName, viewport] of Object.entries(VIEWPORTS)) {
  for (const path of PUBLIC) {
    test(`responsive ${viewportName} ${path} — no horizontal overflow`, async ({ page }) => {
      await page.setViewportSize(viewport)
      const resp = await page.goto(path, { waitUntil: "domcontentloaded" })
      expect(resp?.status()).toBeLessThan(500)
      await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 25_000 })
      const overflow = await horizontalOverflowPx(page)
      expect(overflow, `document horizontal overflow on ${path}`).toBeLessThanOrEqual(1)
    })
  }
}

for (const viewportName of ["tablet_portrait", "mobile", "mobile_small"]) {
  test(`responsive ${viewportName} mobile drawer (staff)`, async ({ page, context }) => {
    const creds = loadCredentials()
    await forceLocale(context, "en")
    await uiLogin(page, "contentmanager", creds.contentmanager.password)
    await page.setViewportSize(VIEWPORTS[viewportName])

    await page.goto("/dashboard")
    await page.locator('button[aria-label="Open menu"]').click()
    const drawer = page.getByRole("dialog", { name: "Open menu" })
    await expect(drawer).toBeVisible()
    // Drawer must not exceed the viewport width.
    const inside = await drawer.evaluate((el) => el.getBoundingClientRect())
    expect(inside.width).toBeLessThanOrEqual(page.viewportSize()!.width)
    // Navigate from the drawer closes it and moves correctly.
    await drawer.getByRole("link", { name: "Articles" }).click()
    await expect(page).toHaveURL(/\/dashboard\/articles/)
    await expect(drawer).toBeHidden()
    const overflow = await horizontalOverflowPx(page)
    expect(overflow).toBeLessThanOrEqual(1)
  })
}

test("responsive dashboard + workspace pages at mobile width", async ({ page, context }) => {
  const creds = loadCredentials()
  await forceLocale(context, "en")
  await uiLogin(page, "contentmanager", creds.contentmanager.password)
  await page.setViewportSize(VIEWPORTS.mobile)

  for (const path of ["/dashboard", "/dashboard/articles", "/dashboard/editorial", "/dashboard/media"]) {
    await page.goto(path)
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 20_000 })
    const overflow = await horizontalOverflowPx(page)
    expect(overflow, `mobile overflow on ${path}`).toBeLessThanOrEqual(1)
  }
})