import { test, expect } from "@playwright/test"
import { attachConsoleWatch, uiLogin, forceLocale, loadCredentials, horizontalOverflowPx, VIEWPORTS } from "./helpers"

/**
 * Phase 19 personality + command center (real browser, no mocks).
 * Command palette opens via Ctrl+K, commands are permission-aware, the
 * 10-click Home egg lands on /credits, Today renders from live data.
 */
test("command center opens via Ctrl+K with grouped permission-aware commands", async ({ page, context }) => {
  await forceLocale(context, "en")
  const watch = attachConsoleWatch(page)
  const creds = loadCredentials()
  await uiLogin(page, "contentmanager", creds.contentmanager.password)

  await page.keyboard.press("Control+k")
  await expect(page.getByRole("combobox")).toBeVisible({ timeout: 10_000 })
  await expect(page.getByText("Go to Dashboard").first()).toBeVisible()
  await expect(page.getByText("Navigation").first()).toBeVisible()
  // Viewer-only check happens below; contentmanager must NOT see Users admin.
  await expect(page.locator('[role="listbox"]').getByText("Go to Users", { exact: true })).toHaveCount(0)

  // Filter narrows to matching commands.
  await page.getByRole("combobox").fill("timeline")
  await expect(page.getByText("Go to Timeline").first()).toBeVisible()

  // Arrow + Enter opens the highlighted command.
  await page.getByRole("combobox").fill("")
  await page.keyboard.press("ArrowDown")
  await page.keyboard.press("Enter")
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })
  expect(watch.pageErrors).toHaveLength(0)
})

test("viewer command center hides admin/create commands", async ({ page, context }) => {
  await forceLocale(context, "en")
  const watch = attachConsoleWatch(page)
  const creds = loadCredentials()
  await uiLogin(page, "viewer", creds.viewer.password)

  await page.keyboard.press("Control+k")
  await expect(page.getByRole("combobox")).toBeVisible({ timeout: 10_000 })
  await expect(page.locator('[role="listbox"]').getByText("Go to Users", { exact: true })).toHaveCount(0)
  await expect(page.locator('[role="listbox"]').getByText("Create Article", { exact: true })).toHaveCount(0)
  await page.keyboard.press("Escape")
  expect(watch.pageErrors).toHaveLength(0)
})

test("home 10-click easter egg lands on credits page", async ({ page, context }) => {
  await forceLocale(context, "en")
  const watch = attachConsoleWatch(page)
  await page.goto("/")
  const home = page.locator('header nav a[href="/"]').first()
  await expect(home).toBeVisible({ timeout: 15_000 })
  for (let i = 0; i < 10; i++) {
    await home.click({ delay: 30 })
  }
  await expect(page).toHaveURL(/\/credits/, { timeout: 15_000 })
  await expect(page.getByText("Ilia Jamali").first()).toBeVisible()
  await expect(page.getByText("ایلیا جمالی").first()).toBeVisible()
  expect(watch.pageErrors).toHaveLength(0)
})

test("credits page renders FA with RTL and no overflow at 390px", async ({ page, context }) => {
  await forceLocale(context, "fa")
  await page.setViewportSize(VIEWPORTS.mobile)
  const watch = attachConsoleWatch(page)
  await page.goto("/credits")
  await expect(page.locator("html[dir='rtl']")).toHaveCount(1)
  await expect(page.getByText("ایلیا جمالی").first()).toBeVisible({ timeout: 15_000 })
  expect(await horizontalOverflowPx(page)).toBe(0)
  expect(watch.pageErrors).toHaveLength(0)
})

test("today card renders from live dashboard data", async ({ page, context }) => {
  await forceLocale(context, "en")
  const watch = attachConsoleWatch(page)
  const creds = loadCredentials()
  await uiLogin(page, "contentmanager", creds.contentmanager.password)
  await expect(page.getByText("Today").first()).toBeVisible({ timeout: 20_000 })
  expect(watch.pageErrors).toHaveLength(0)
})

test("command center usable at 390px with no overflow", async ({ page, context }) => {
  await forceLocale(context, "en")
  await page.setViewportSize(VIEWPORTS.mobile)
  const watch = attachConsoleWatch(page)
  const creds = loadCredentials()
  await uiLogin(page, "contentmanager", creds.contentmanager.password)
  await page.keyboard.press("Control+k")
  await expect(page.getByRole("combobox")).toBeVisible({ timeout: 10_000 })
  expect(await horizontalOverflowPx(page)).toBe(0)
  expect(watch.pageErrors).toHaveLength(0)
})
