import { chromium } from "@playwright/test"

async function main() {
  const browser = await chromium.launch({ channel: "msedge", headless: true })
  try {
    for (const locale of ["en", "fa", "ar"]) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 300 } })
      await context.addInitScript((l) => {
        try { localStorage.setItem("hanahoush-language", l) } catch {}
      }, locale)
      const page = await context.newPage()
      await page.goto("http://localhost:5173/", { waitUntil: "networkidle" })
      await page.waitForTimeout(800)
      await page.screenshot({ path: `C:/Users/User.RD-01/AppData/Local/Temp/opencode/nav-${locale}.png` })
      console.log(`--- ${locale} ---`)
      console.log("dir:", await page.evaluate(() => document.documentElement.getAttribute("dir")))
      console.log("overflow:", await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth)))
      const searchBtn = page.locator("header button").filter({ has: page.locator("svg.lucide-search") }).first()
      const searchBox = await searchBtn.boundingBox()
      const logoBox = await page.locator("header a").first().boundingBox()
      const controlsBox = await page.locator("header .flex.items-center.gap-2").first().boundingBox()
      console.log("logo box:", logoBox)
      console.log("search box:", searchBox)
      console.log("controls group box:", controlsBox)
      await context.close()
    }
  } finally {
    await browser.close()
  }
}

main().catch((e) => { console.error(e); process.exit(1) })