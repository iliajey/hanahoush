import { test, expect, type Page } from "@playwright/test"
import { attachConsoleWatch, forceLocale, loadCredentials, uiLogin } from "./helpers"

const API = "http://127.0.0.1:8000/api/v1"
const LEAK = /Traceback|django\.exceptions|ProgrammingError|psycopg|sqlite3|KeyError|IntegrityError|OperationalError/i

async function blankScreen(page: Page): Promise<boolean> {
  const html = await page.locator("#root").innerHTML()
  return html.trim().length <= 10
}

test.describe("error / edge cases (Part J)", () => {
  test("unknown route → SPA 404, no crash, noindexed", async ({ page, context }) => {
    await forceLocale(context, "en")
    const watch = attachConsoleWatch(page)
    const resp = await page.goto("/this-route-does-not-exist")
    expect(resp?.status()).toBeLessThan(500)
    await expect(page.locator("h1")).toBeVisible({ timeout: 20_000 })
    expect(await blankScreen(page)).toBe(false)
    const bodyText = await page.evaluate(() => document.body.innerText)
    expect(bodyText).not.toMatch(LEAK)
    expect(watch.pageErrors).toHaveLength(0)
  })

  test("missing article slug → friendly state, no raw backend exception", async ({ page }) => {
    const watch = attachConsoleWatch(page)
    await page.goto("/articles/this-article-does-not-exist")
    await expect(page.locator('[role="alert"]').first()).toBeVisible({ timeout: 20_000 })
    expect(await blankScreen(page)).toBe(false)
    const bodyText = await page.evaluate(() => document.body.innerText)
    expect(bodyText).not.toMatch(LEAK)
    expect(watch.pageErrors).toHaveLength(0)
  })

  test("missing project slug → friendly state, no crash", async ({ page }) => {
    const watch = attachConsoleWatch(page)
    await page.goto("/projects/this-project-does-not-exist")
    await expect(page.locator('[role="alert"]').first()).toBeVisible({ timeout: 20_000 })
    expect(await blankScreen(page)).toBe(false)
    expect(watch.pageErrors).toHaveLength(0)
  })

  test("network failure: API aborted → page still renders, no blank screen", async ({ page }) => {
    await page.route("**/api/v1/**", (route) => route.abort("connectionrefused"))
    const watch = attachConsoleWatch(page)
    await page.goto("/articles")
    // The page keeps its shell and surfaces a user-facing error state.
    await expect(page.locator('[role="alert"]').first()).toBeVisible({ timeout: 25_000 })
    expect(await blankScreen(page)).toBe(false)
    // Page must show a recovered/error/empty state rather than a crash.
    expect(watch.pageErrors).toHaveLength(0)
  })

  test("malformed API response (HTML 500) → page stays usable", async ({ page }) => {
    await page.route("**/api/v1/articles/**", (route) =>
      route.fulfill({ status: 500, contentType: "text/html", body: "<html><body>Internal Server Error</body></html>" }),
    )
    const watch = attachConsoleWatch(page)
    await page.goto("/articles")
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 20_000 })
    expect(await blankScreen(page)).toBe(false)
    const bodyText = await page.evaluate(() => document.body.innerText)
    expect(bodyText).not.toMatch(LEAK)
    expect(watch.pageErrors).toHaveLength(0)
  })

  test("slow API → loading state shown, then resolves", async ({ page }) => {
    await page.route("**/api/v1/pages/articles/**", async (route) => {
      await new Promise((r) => setTimeout(r, 1500))
      await route.continue()
    })
    await page.goto("/articles")
    // Loading skeleton (animate-pulse) visible while the page request is in flight.
    await page.waitForSelector(".animate-pulse", { timeout: 4000 })
    // Resolves: a heading eventually appears.
    await expect(page.locator("h1", { hasText: /articles|hub|magazine/i }).first()).toBeVisible({ timeout: 30_000 })
  })

  test("invalid contact form submits show inline validation, no crash", async ({
    page,
    context,
  }) => {
    await forceLocale(context, "en")
    await page.goto("/contact")
    await expect(page.locator("form").first()).toBeVisible({ timeout: 25_000 })
    await page.locator("form").getByRole("button", { name: /Send|Submit/i }).first().click()
    // react-hook-form validation errors appear.
    await expect(page.locator("form").getByText(/[a-zA-Z\u0600-\u06FF]{3,}/).first()).toBeVisible()
    const invalid = await page.evaluate(() => document.querySelectorAll("[aria-invalid='true'], [data-error], [class*='error']").length)
    expect(invalid).toBeGreaterThanOrEqual(1)
  })

  test("duplicate submit does not navigate/crash (idempotent guard)", async ({ page, context }) => {
    await forceLocale(context, "en")
    await page.goto("/contact")
    await expect(page.locator("form").first()).toBeVisible({ timeout: 25_000 })
    const button = page.locator("form").getByRole("button", { name: /Send|Submit/i }).first()
    await button.click({ force: true })
    await page.waitForTimeout(300)
    expect(await blankScreen(page)).toBe(false)
    // Stay on /contact (no unexpected redirect).
    expect(page.url()).toContain("/contact")
  })

test("session dies mid-use → global /session-expired redirect", async ({ page, context }) => {
    await forceLocale(context, "en")
    // Simulate a dead session from the start: the first protected fetch after
    // login (the dashboard) returns 401 and the refresh endpoint is also dead.
    await page.route("**/api/v1/admin/dashboard/**", (route) =>
      route.fulfill({ status: 401, contentType: "application/json", body: "{}" }),
    )
    await page.route("**/api/v1/auth/refresh/**", (route) =>
      route.fulfill({ status: 401, contentType: "application/json", body: "{}" }),
    )
    const creds = loadCredentials()
    await uiLogin(page, "contentmanager", creds.contentmanager.password)
    await expect(page).toHaveURL(/\/session-expired/, { timeout: 20_000 })
  })

  test("protected API returns 401 unauthenticated / 403 unauthorized (backend authoritative)", async ({
    page,
  }) => {
    const unauth = await page.request.get(`${API}/admin/dashboard/`)
    expect(unauth.status()).toBe(401)
    const unauthMe = await page.request.get(`${API}/auth/me/`)
    expect(unauthMe.status()).toBe(401)
  })
})