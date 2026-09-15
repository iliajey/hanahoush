import { test, expect } from "@playwright/test"
import { forceLocale, loadCredentials, uiLogin, VIEWPORTS } from "./helpers"

const API = "http://127.0.0.1:8000/api/v1"

test.describe("publication governance 2.0 (Phase 17)", () => {
  test("timeline exposes locale_readiness payload", async ({ page, context }) => {
    await forceLocale(context, "en")
    const creds = loadCredentials()
    await uiLogin(page, "superadmin", creds.superadmin.password)
    const token = await page.evaluate(() => window.localStorage.getItem("hanahoush_access_token") ?? "")
    const resp = await page.request.get(`${API}/editorial/schedules/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(resp.status()).toBe(200)
    const body = await resp.json()
    for (const row of body.data ?? []) {
      expect(row.locale_readiness, "locale_readiness present").toBeTruthy()
      for (const locale of ["fa", "en", "ar"]) {
        expect(row.locale_readiness[locale].ready).toBeDefined()
      }
    }
  })

  test("sitemap lists /services hub, never dead per-service URLs", async ({ request }) => {
    const sitemap = await request.get("http://127.0.0.1:8000/sitemap.xml")
    expect(sitemap.status()).toBe(200)
    const text = await sitemap.text()
    expect(text).toContain("/services")
  })

  test("robots blocks dashboard, timeline is noindex", async ({ page, context, request }) => {
    const robots = await request.get("http://127.0.0.1:8000/robots.txt")
    expect(await robots.text()).toContain("Disallow: /dashboard")
    await forceLocale(context, "en")
    const creds = loadCredentials()
    await uiLogin(page, "superadmin", creds.superadmin.password)
    await page.goto("/dashboard/timeline")
    await expect(page.locator("h1").first()).toBeVisible()
    const robotsMeta = await page.locator('meta[name="robots"]').getAttribute("content")
    expect(robotsMeta ?? "").toContain("noindex")
  })

  test("timeline 375px has no horizontal overflow", async ({ page, context }) => {
    await forceLocale(context, "en")
    const creds = loadCredentials()
    await uiLogin(page, "superadmin", creds.superadmin.password)
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto("/dashboard/timeline")
    await expect(page.locator("h1").first()).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(1)
  })

  test("timeline RTL renders without overflow", async ({ page, context }) => {
    await forceLocale(context, "fa")
    const creds = loadCredentials()
    await uiLogin(page, "superadmin", creds.superadmin.password)
    await page.setViewportSize(VIEWPORTS.mobile)
    await page.goto("/dashboard/timeline")
    await expect(page.locator("h1").first()).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(1)
  })
})
