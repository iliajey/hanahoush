import { chromium } from "@playwright/test"
import { readFileSync } from "node:fs"

const CRED = JSON.parse(readFileSync("C:/Users/User.RD-01/AppData/Local/Temp/opencode/hanahoush_e2e.json", "utf-8"))

async function main() {
  const browser = await chromium.launch({ channel: "msedge", headless: true })
  try {
    for (const locale of ["en", "fa", "ar"]) {
      for (const width of [1440, 1280, 1024, 900, 768, 700, 640, 600, 480, 390]) {
        const context = await browser.newContext({ viewport: { width, height: 800 } })
        await context.addInitScript((l) => {
          try { localStorage.setItem("hanahoush-language", l) } catch {}
        }, locale)
        const page = await context.newPage()
        await page.goto("http://localhost:5173/login", { waitUntil: "networkidle" })
        await page.waitForTimeout(300)
        await page.locator("#username").fill("contentmanager")
        await page.locator("#password").fill(CRED.contentmanager.password)
        await page.locator('form button[type="submit"]').click()
        await page.waitForURL("**/dashboard", { timeout: 20000 })
        await page.goto("http://localhost:5173/", { waitUntil: "networkidle" })
        await page.waitForTimeout(600)

        const geo = await page.evaluate(() => {
          const cluster = [...document.querySelectorAll("header div")].find(
            (d) => String(d.className).includes("flex items-center gap-2"),
          ) || null
          const searchBtn = document.querySelector("header button svg.lucide-search")?.closest("button") || null
          const menuBtn = document.querySelector("header #mobile-nav") ? null
            : [...document.querySelectorAll("header button")].find((b) => b.querySelector("svg.lucide-menu")) || null
          const container = document.querySelector("header [class*='max-w-7xl']")
          const r = (el) => {
            if (!el) return null
            const b = el.getBoundingClientRect()
            return { x: +b.x.toFixed(1), right: +(b.x + b.width).toFixed(1), w: +b.width.toFixed(1) }
          }
          return {
            viewport: document.documentElement.clientWidth,
            scrollW: document.documentElement.scrollWidth,
            container: r(container),
            cluster: r(cluster),
            search: r(searchBtn),
            menuVisible: menuBtn ? !!menuBtn.offsetParent : false,
          }
        })
        const inside = geo.container && geo.cluster
          ? geo.cluster.x >= geo.container.x - 1 && geo.cluster.right <= geo.container.right + 1
          : null
        console.log(`${locale} @${width}  container=${JSON.stringify(geo.container)} cluster=${JSON.stringify(geo.cluster)} search=${JSON.stringify(geo.search)} menuVisible=${geo.menuVisible} overflow=${geo.scrollW - geo.viewport} clusterInside=${inside}`)
        await context.close()
      }
    }
  } finally {
    await browser.close()
  }
}

main().catch((e) => { console.error(e); process.exit(1) })