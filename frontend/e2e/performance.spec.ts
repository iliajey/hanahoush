import { test, expect } from "@playwright/test"
import { writeFileSync } from "node:fs"
import { attachConsoleWatch, uiLogin, loadCredentials, forceLocale } from "./helpers"

test.describe("performance inspection (Part L)", () => {
  test("home: no duplicate API GETs, warnings captured", async ({ page }) => {
    const calls: string[] = []
    page.on("request", (req) => {
      if (req.url().includes("/api/v1/")) {
        const url = new URL(req.url())
        // Key by path + sorted query so distinct filters are not flagged.
        const query = Array.from(url.searchParams.entries())
          .map(([k, v]) => `${k}=${v}`)
          .sort()
          .join("&")
        calls.push(`${req.method()} ${url.pathname}?${query}`)
      }
    })
    const watch = attachConsoleWatch(page)
    await page.goto("/")
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 25_000 })
    await page.waitForTimeout(800)

    const sections = calls.filter((c) => c.startsWith("GET"))
    const duplicates = sections.filter((c, i) => sections.indexOf(c) !== i)
    expect(duplicates).toEqual([])

    writeFileSync("e2e-artifacts/perf-home-requests.json", JSON.stringify(calls, null, 2))
    writeFileSync("e2e-artifacts/perf-home-console-errors.json", JSON.stringify(watch.consoleErrors, null, 2))
  })

  test("layout shift is minimal on home", async ({ page }) => {
    const cls = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let total = 0
        if (!("PerformanceObserver" in window)) return resolve(-1)
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as PerformanceEntryList) {
            if ((entry as { hadRecentInput?: boolean }).hadRecentInput) continue
            total += (entry as { value?: number }).value ?? 0
          }
        })
        observer.observe({ type: "layout-shift", buffered: true })
        setTimeout(() => {
          observer.disconnect()
          resolve(total)
        }, 4000)
      })
    })
    writeFileSync("e2e-artifacts/perf-home-cls.json", JSON.stringify({ cls }))
    // CLS above 0.25 would indicate real layout instability.
    expect(cls).toBeLessThan(0.25)
  })

  test("staff dashboard lazy-loads its chunk (route splitting)", async ({ page, context }) => {
    const creds = loadCredentials()
    await forceLocale(context, "en")
    await uiLogin(page, "contentmanager", creds.contentmanager.password)
    await page.goto("/dashboard")
    await expect(page.locator("main h1").first()).toBeVisible({ timeout: 20_000 })

    const jsResources = await page.evaluate(() =>
      window.performance
        .getEntriesByType("resource")
        .map((r) => r.name)
        .filter((n) => n.includes("dashboard") || n.includes("Dashboard")),
    )
    expect(jsResources.length).toBeGreaterThan(0)
  })
})