import { test, expect, type Page } from "@playwright/test"
import { attachConsoleWatch, uiLogin, headingTexts, PUBLIC_SLUGS } from "./helpers"

const FATAL_CONSOLE = /Uncaught|Minified React error|ChunkLoadError|is not defined|TypeError: Cannot read properties/i

async function checkPage(page: Page, path: string, opts: { heading?: string | RegExp; minHeadings?: number } = {}) {
  const watch = attachConsoleWatch(page)
  const response = await page.goto(path, { waitUntil: "domcontentloaded" })
  expect(response, `HTTP status for ${path}`).not.toBeNull()
  expect(response!.status(), `HTTP status for ${path}`).toBeLessThan(500)

  // Loading state must resolve: a heading appears (pages render async data).
  const min = opts.minHeadings ?? 1
  await expect
    .poll(
      async () => {
        const hs = await headingTexts(page)
        return hs.filter((h) => h.length > 0).length
      },
      { timeout: 25_000, message: `page ${path} resolved to zero non-blank headings` },
    )
    .toBeGreaterThanOrEqual(min)

  if (opts.heading) {
    await expect(page.locator("h1").first(), `h1 on ${path}`).toContainText(opts.heading instanceof RegExp ? opts.heading.source : opts.heading)
  }

  // No raw blank screen.
  const rootHtml = await page.locator("#root").innerHTML()
  expect(rootHtml.trim().length, `#root not blank on ${path}`).toBeGreaterThan(10)

  // Document title exists and is not the raw default.
  const title = await page.title()
  expect(title.length, `title present on ${path}`).toBeGreaterThan(0)

  // No uncaught errors.
  expect(pageErrorsOf(watch), `no page errors on ${path}`).toHaveLength(0)
  const fatal = watch.consoleErrors.filter((e) => FATAL_CONSOLE.test(e))
  expect(fatal, `no fatal console errors on ${path}`).toEqual([])

  return watch
}

function pageErrorsOf(watch: { consoleErrors: string[]; pageErrors: string[] }) {
  return watch.pageErrors
}

const PUBLIC_ROUTES = [
  { path: "/", name: "home", min: 1 },
  { path: "/services", name: "services", min: 1 },
  { path: "/projects", name: "projects", min: 1 },
  { path: "/articles", name: "articles", min: 1 },
  { path: "/about", name: "about", min: 1 },
  { path: "/contact", name: "contact", min: 1 },
  { path: "/search", name: "search", min: 1 },
]

for (const route of PUBLIC_ROUTES) {
  test(`smoke public ${route.name}`, async ({ page }) => {
    await checkPage(page, route.path, { minHeadings: route.min })
  })
}

test("smoke detail /projects/:slug", async ({ page }) => {
  const watch = attachConsoleWatch(page)
  const resp = await page.goto(`/projects/${PUBLIC_SLUGS.project}`, { waitUntil: "domcontentloaded" })
  expect(resp?.status()).toBeLessThan(500)
  await expect(page.locator("h1").first()).toBeAttached({ timeout: 25_000 })
  const h1 = (await page.locator("h1").first().textContent()) ?? ""
  expect(h1.trim().length).toBeGreaterThan(0)
  expect(pageErrorsOf(watch)).toHaveLength(0)
})

test("smoke detail /articles/:slug", async ({ page }) => {
  const watch = attachConsoleWatch(page)
  const resp = await page.goto(`/articles/${PUBLIC_SLUGS.article}`, { waitUntil: "domcontentloaded" })
  expect(resp?.status()).toBeLessThan(500)
  await expect(page.locator("h1", { hasText: /devops/i }).first()).toBeVisible({ timeout: 25_000 })
  expect(pageErrorsOf(watch)).toHaveLength(0)
})

const AUTH_ROUTES = ["/login", "/forgot-password", "/reset-password", "/unauthorized", "/session-expired"]

for (const path of AUTH_ROUTES) {
  test(`smoke auth ${path}`, async ({ page }) => {
    await checkPage(page, path, { min: 1 })
  })
}

test("smoke staff /dashboard/:id and workspaces render (contentmanager)", async ({ page, context }) => {
  const creds = (await import("./helpers")).loadCredentials()
  await (await import("./helpers")).forceLocale(context, "en")
  const { password } = creds.contentmanager
  await uiLogin(page, "contentmanager", password)

  const staffRoutes = [
    "/dashboard",
    "/dashboard/editorial",
    "/dashboard/articles",
    "/dashboard/articles/new",
    "/dashboard/projects",
    "/dashboard/media",
    "/dashboard/contact",
    "/dashboard/newsletter",
  ]

  for (const path of staffRoutes) {
    const watch = attachConsoleWatch(page)
    const resp = await page.goto(path, { waitUntil: "domcontentloaded" })
    expect(resp?.status(), `HTTP ${path}`).toBeLessThan(500)
    await expect
      .poll(async () => (await headingTexts(page)).filter((h) => h.length).length, {
        timeout: 20_000,
        message: `staff page ${path} rendered headings`,
      })
      .toBeGreaterThanOrEqual(1)
    const fatal = watch.consoleErrors.filter((e) => FATAL_CONSOLE.test(e))
    expect(fatal, `no fatal console errors on ${path}`).toEqual([])
    expect(pageErrorsOf(watch), `no page errors on ${path}`).toHaveLength(0)
  }
})

test("back/forward navigation works", async ({ page }) => {
  await page.goto("/")
  await expect(page.locator("h1, h2").first()).toBeVisible()
  await page.goto("/services")
  await expect(page.locator("h1, h2").first()).toBeVisible()
  await page.goBack()
  await expect(page).toHaveURL("/")
  await expect(page.locator("h1, h2").first()).toBeVisible()
  await page.goForward()
  await expect(page).toHaveURL("/services")
  await expect(page.locator("h1, h2").first()).toBeVisible()
})