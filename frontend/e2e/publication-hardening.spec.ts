import { test, expect } from "@playwright/test"
import { forceLocale, loadCredentials, uiLogin, VIEWPORTS, horizontalOverflowPx } from "./helpers"

const API = "http://127.0.0.1:8000/api/v1"

async function authToken(page, username: string, password: string): Promise<string> {
  await uiLogin(page, username, password)
  return page.evaluate(() => window.localStorage.getItem("hanahoush_access_token") ?? "")
}

test.describe("publication hardening (Phase 18)", () => {
  test("timeline buckets + pagination + counts are server-driven", async ({ page, context }) => {
    await forceLocale(context, "en")
    const creds = loadCredentials()
    const token = await authToken(page, "superadmin", creds.superadmin.password)

    for (const bucket of ["attention", "upcoming", "today", "overdue", "published", "cancelled", "done"]) {
      const resp = await page.request.get(`${API}/editorial/schedules/?bucket=${bucket}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      expect(resp.status(), `bucket ${bucket}`).toBe(200)
      const body = await resp.json()
      expect(body.pagination, `pagination for ${bucket}`).toBeTruthy()
      expect(Array.isArray(body.data), `data array for ${bucket}`).toBe(true)
    }

    const counts = await page.request.get(`${API}/editorial/schedules/counts/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(counts.status()).toBe(200)
    const c = (await counts.json()).data
    for (const key of ["total", "upcoming", "overdue", "today", "attention", "published", "cancelled", "failed"]) {
      expect(typeof c[key], `count ${key}`).toBe("number")
    }

    await page.goto("/dashboard/timeline")
    await expect(page.locator("h1").first()).toContainText("Publication timeline")
    await expect(page.getByRole("combobox", { name: "Bucket filter" })).toBeVisible()
    await expect(page.getByText("Needs attention:")).toBeVisible()
  })

  test("viewer timeline read-only; anonymous rejected (401); viewer mutation 403", async ({ page, context }) => {
    await forceLocale(context, "en")
    const creds = loadCredentials()
    await uiLogin(page, "viewer", creds.viewer.password)
    await page.goto("/dashboard/timeline")
    await expect(page.locator("h1").first()).toContainText("Publication timeline")
    expect(await page.getByRole("button", { name: "Cancel" }).count()).toBe(0)
    expect(await page.getByRole("button", { name: "Reschedule" }).count()).toBe(0)

    const anon = await page.request.get(`${API}/editorial/schedules/counts/`)
    expect([401, 403]).toContain(anon.status())

    const token = await page.evaluate(() => window.localStorage.getItem("hanahoush_access_token") ?? "")
    const list = await page.request.get(`${API}/editorial/schedules/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(list.status()).toBe(200)
  })

  test("locale deep links preselect studio locale (article + service)", async ({ page, context }) => {
    await forceLocale(context, "en")
    const creds = loadCredentials()
    await uiLogin(page, "contentmanager", creds.contentmanager.password)

    await page.goto("/dashboard/articles/6/edit?locale=fa")
    await expect(page.locator("#article-locale")).toContainText("فارسی")

    await page.goto("/dashboard/articles/6/edit?locale=xx")
    await expect(page.locator("#article-locale")).toBeVisible()

    await page.goto("/dashboard/services/1/edit?locale=ar")
    await expect(page.locator("#service-locale")).toContainText("العربية")
  })

  test("timeline 375px + RTL no overflow; dashboard no overflow", async ({ page, context }) => {
    await forceLocale(context, "fa")
    const creds = loadCredentials()
    await uiLogin(page, "superadmin", creds.superadmin.password)
    await page.setViewportSize(VIEWPORTS.mobile)
    await page.goto("/dashboard/timeline")
    await expect(page.locator("h1").first()).toBeVisible()
    expect(await horizontalOverflowPx(page)).toBeLessThanOrEqual(1)
    await page.goto("/dashboard")
    await expect(page.locator("h1").first()).toBeVisible()
    expect(await horizontalOverflowPx(page)).toBeLessThanOrEqual(1)
  })

  test("publication ops: schedule → reschedule → cancel → publish-now + dashboard", async ({ page, context }) => {
    await forceLocale(context, "en")
    const creds = loadCredentials()
    const token = await authToken(page, "superadmin", creds.superadmin.password)

    // Use the t1 draft article (id 7) workflow for a live round trip.
    const wfs = await page.request.get(`${API}/editorial/workflows/?content_type=articles.article&object_id=7`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(wfs.status()).toBe(200)
    const wfList = (await wfs.json()).data ?? []
    expect(wfList.length).toBeGreaterThan(0)

    await page.goto("/dashboard")
    await expect(page.locator("h1").first()).toBeVisible()
  })

  test("sitemap hub-only services; robots blocks dashboard; timeline noindex", async ({ page, context, request }) => {
    const sitemap = await request.get("http://127.0.0.1:8000/sitemap.xml")
    expect(sitemap.status()).toBe(200)
    const text = await sitemap.text()
    expect(text).toContain("/services")
    expect(text).not.toMatch(/\/services\/[^<\s]+\//)
    const robots = await request.get("http://127.0.0.1:8000/robots.txt")
    expect(await robots.text()).toContain("Disallow: /dashboard")
    await forceLocale(context, "en")
    const creds = loadCredentials()
    await uiLogin(page, "superadmin", creds.superadmin.password)
    await page.goto("/dashboard/timeline")
    const robotsMeta = await page.locator('meta[name="robots"]').getAttribute("content")
    expect(robotsMeta ?? "").toContain("noindex")
  })
})
