import { chromium } from "@playwright/test"
import { readFileSync } from "node:fs"

const CRED = JSON.parse(readFileSync("C:/Users/User.RD-01/AppData/Local/Temp/opencode/hanahoush_e2e.json", "utf-8"))

async function main() {
  const browser = await chromium.launch({ channel: "msedge", headless: true })
  try {
    for (const locale of ["en", "fa", "ar"]) {
      const context = await browser.newContext()
      await context.addInitScript((l) => {
        try { localStorage.setItem("hanahoush-language", l) } catch {}
      }, locale)
      const page = await context.newPage()
      await page.setViewportSize({ width: 1440, height: 800 })
      await page.goto("http://localhost:5173/login", { waitUntil: "networkidle" })
      await page.locator("#username").fill("contentmanager")
      await page.locator("#password").fill(CRED.contentmanager.password)
      await page.locator('form button[type="submit"]').click()
      await page.waitForURL("**/dashboard", { timeout: 20000 })
      await page.goto("http://localhost:5173/", { waitUntil: "networkidle" })
      await page.waitForTimeout(400)
      const problems = []
      const samples = []
      for (let width = 700; width <= 1600; width += 5) {
        await page.setViewportSize({ width, height: 800 })
        await page.waitForTimeout(50)
        const m = await page.evaluate(() => {
          const cluster = [...document.querySelectorAll("header div")].find(
            (d) => String(d.className).includes("flex items-center gap-2") && d.innerText.length > 0,
          ) || null
          const searchBtn = document.querySelector("header button svg.lucide-search")?.closest("button") || null
          const container = document.querySelector("header [class*='max-w-7xl']")
          const r = (el) => {
            if (!el) return null
            const b = el.getBoundingClientRect()
            return { x: +b.x.toFixed(1), right: +(b.x + b.width).toFixed(1) }
          }
          return {
            overflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
            cluster: r(cluster),
            search: r(searchBtn),
            container: r(container),
          }
        })
        if (m.overflow > 1) problems.push([width, m.overflow])
        if (width % 200 === 0) samples.push({ width, ...m })
      }
      console.log(`=== ${locale} problems (width,overflowPx) ===`)
      console.log(JSON.stringify(problems))
      console.log("samples:", JSON.stringify(samples))
      await context.close()
    }
  } finally {
    await browser.close()
  }
}

main().catch((e) => { console.error(e); process.exit(1) })