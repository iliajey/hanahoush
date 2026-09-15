import { test, expect } from "@playwright/test"
import { forceLocale, loadCredentials, uiLogin, VIEWPORTS } from "./helpers"

const API = "http://127.0.0.1:8000/api/v1"

test.describe("publication timeline (Phase 16)", () => {
  test("SUPER_ADMIN sees timeline nav, filters and role gates", async ({ page, context }) => {
    await forceLocale(context, "en")
    const creds = loadCredentials()
    await uiLogin(page, "superadmin", creds.superadmin.password)

    await page.goto("/dashboard/timeline")
    await expect(page.locator("h1").first()).toContainText("Publication timeline")
    await expect(page.getByRole("combobox", { name: "Bucket filter" })).toBeVisible()
    await expect(page.getByRole("textbox", { name: "Search scheduled content…" })).toBeVisible()

    const token = await page.evaluate(() => window.localStorage.getItem("hanahoush_access_token") ?? "")
    const resp = await page.request.get(`${API}/editorial/schedules/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(resp.status()).toBe(200)
  })

  test("VIEWER timeline is read-only (no mutation controls)", async ({ page, context }) => {
    await forceLocale(context, "en")
    const creds = loadCredentials()
    await uiLogin(page, "viewer", creds.viewer.password)
    await page.goto("/dashboard/timeline")
    await expect(page.locator("h1").first()).toContainText("Publication timeline")
    expect(await page.getByRole("button", { name: "Cancel" }).count()).toBe(0)
    expect(await page.getByRole("button", { name: "Reschedule" }).count()).toBe(0)
  })

  test("unauthenticated schedule API is rejected", async ({ page }) => {
    const resp = await page.request.get(`${API}/editorial/schedules/`)
    expect([401, 403]).toContain(resp.status())
  })

  test("timeline responsive 390px has no horizontal overflow", async ({ page, context }) => {
    await forceLocale(context, "en")
    const creds = loadCredentials()
    await uiLogin(page, "contentmanager", creds.contentmanager.password)
    await page.setViewportSize(VIEWPORTS.mobile)
    await page.goto("/dashboard/timeline")
    await expect(page.locator("h1").first()).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(1)
  })
})
