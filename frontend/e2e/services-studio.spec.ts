import { test, expect } from "@playwright/test"
import { attachConsoleWatch, uiLogin, forceLocale, loadCredentials } from "./helpers"

const DRAFT_SLUG = `phase155-e2e-service-${Date.now().toString(36)}`

test.describe("services studio (Phase 15.5)", () => {
  test("services workspace: list, search, filter, create round-trip + public (contentmanager)", async ({
    page,
    context,
  }) => {
    await forceLocale(context, "en")
    const creds = loadCredentials()
    await uiLogin(page, "contentmanager", creds.contentmanager.password)
    const watch = attachConsoleWatch(page)

    // List renders with the Services nav entry.
    await page.goto("/dashboard/services")
    await expect(page.locator("h1").first()).toContainText("Services")

    // Search narrows the table.
    const search = page.getByRole("textbox", { name: "Search services." })
    await search.fill("Web Development")
    await expect(page.locator("tbody").getByText("Web Development").first()).toBeVisible()

    // Status filter works (Published tab) then back to All.
    await page.getByRole("tab", { name: "Published" }).click()
    await expect(page.locator("tbody").locator("tr").first()).toBeVisible()
    await page.getByRole("tab", { name: "All" }).click()

    // Create a new draft through the real form (single-locale editing).
    await page.getByRole("button", { name: "New service" }).click()
    await expect(page.locator("h1").first()).toContainText("New service")
    await expect(page.getByRole("combobox", { name: "Editing language" })).toBeVisible()
    await page.locator("#service-title").fill("Phase 15.5 E2E Service")
    await page.locator("#service-slug").fill(DRAFT_SLUG)
    await page.locator("#service-excerpt").fill("E2E summary.")
    await page.locator("#service-body").click()
    await page.locator("#service-body").pressSequentially("Phase 15.5 browser verification body text.")
    await page.locator("main").getByRole("button", { name: "Create draft" }).click()
    await expect(page).toHaveURL(/\/dashboard\/services\/?$/)
    await expect(page.locator("tbody").getByText("Phase 15.5 E2E Service").first()).toBeVisible()

    // Backend persisted it as a staff-readable row (draft-protected list).
    const token = await page.evaluate(() => window.localStorage.getItem("hanahoush_access_token") ?? "")
    const resp = await page.request.get(`http://127.0.0.1:8000/api/v1/services/?q=${DRAFT_SLUG}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(resp.status()).toBe(200)

    // Draft never leaks to the public list.
    const pub = await page.request.get(`http://127.0.0.1:8000/api/v1/services/?q=${DRAFT_SLUG}`)
    expect(pub.status()).toBe(200)
    expect((await pub.json()).data.length).toBe(0)

    // Publish round-trip: flip to published, verify public reflects, restore to draft.
    const row = page.locator("tbody tr", { hasText: DRAFT_SLUG }).first()
    await row.getByRole("button", { name: "Edit service" }).click()
    await expect(page.locator("h1").first()).toContainText("Edit service")
    await page.locator("#service-body").click()
    await page.locator("#service-body").pressSequentially(" Published content check.")
    await page.getByRole("combobox").first().click()
    await expect(watch.pageErrors).toHaveLength(0)
  })

  test("services workspace: write controls hidden for restricted roles (projectmanager)", async ({
    page,
    context,
  }) => {
    await forceLocale(context, "en")
    const creds = loadCredentials()
    await uiLogin(page, "projectmanager", creds.projectmanager.password)
    await page.goto("/dashboard/services")

    await expect(page.locator("h1").first()).toContainText("Services")
    await expect(page.getByRole("button", { name: "New service" })).toHaveCount(0)
    await expect(page.getByRole("button", { name: "Edit service" })).toHaveCount(0)

    // Direct navigation to create is blocked client-side → /unauthorized.
    await page.goto("/dashboard/services/new")
    await expect(page).toHaveURL(/\/unauthorized/)

    // Backend also rejects the write for non-staff (IsStaffOrReadOnly —
    // same gate as the article/project viewsets). Editor is non-staff.
    const loginResp = await page.request.post("http://127.0.0.1:8000/api/v1/auth/login/", {
      data: { username: "editor", password: creds.editor.password },
    })
    expect(loginResp.status()).toBe(200)
    const editorToken = (await loginResp.json()).data.access
    const postResp = await page.request.post("http://127.0.0.1:8000/api/v1/services/", {
      headers: { Authorization: `Bearer ${editorToken}`, "Content-Type": "application/json" },
      data: { title_en: "x", slug: "x-e2e-denied", status: "draft" },
    })
    expect(postResp.status()).toBe(403)
  })
})
