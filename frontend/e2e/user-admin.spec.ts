import { test, expect } from "@playwright/test"
import { attachConsoleWatch, uiLogin, forceLocale, loadCredentials } from "./helpers"

/** Phase 12 browser verification: SUPER_ADMIN user-management workspace.
 *
 * Real UI through system Edge: login → list → new → detail → guards.
 * Credentials come from the temp credentials file (never committed).
 */
test("superadmin manages users through the workspace UI", async ({ page, context }) => {
  const creds = loadCredentials()
  const superadmin = creds["superadmin"]
  test.skip(!superadmin, "superadmin credentials unavailable")
  await forceLocale(context, "en")
  const watch = attachConsoleWatch(page)

  await uiLogin(page, "superadmin", superadmin.password)
  await expect(page).toHaveURL(/\/dashboard$/)

  await page.goto("/dashboard/users")
  await expect(page.getByRole("heading", { name: "User Management" })).toBeVisible({
    timeout: 15_000,
  })
  await expect(page.getByPlaceholder(/Search by username/i)).toBeVisible()

  await page.goto("/dashboard/users/new")
  await expect(page.getByRole("heading", { name: "Create user" })).toBeVisible({
    timeout: 15_000,
  })
  await expect(page.locator("#new-username")).toBeVisible()
  await expect(page.locator("#new-password")).toBeVisible()

  expect(watch.pageErrors).toEqual([])
})

test("viewer is blocked from every user admin route", async ({ page, context }) => {
  const creds = loadCredentials()
  const viewer = creds["viewer"]
  test.skip(!viewer, "viewer credentials unavailable")
  await forceLocale(context, "en")

  await uiLogin(page, "viewer", viewer.password)
  await expect(page).toHaveURL(/\/dashboard$/)

  for (const path of ["/dashboard/users", "/dashboard/users/new", "/dashboard/users/1"]) {
    await page.goto(path)
    await expect(page).toHaveURL(/\/unauthorized/, { timeout: 15_000 })
  }
})
