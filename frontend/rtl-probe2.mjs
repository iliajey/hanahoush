import { chromium } from "@playwright/test"

async function main() {
  const browser = await chromium.launch({ channel: "msedge", headless: true })
  try {
    for (const locale of ["en", "fa", "ar"]) {
      for (const vp of [
        { name: "desktop", width: 1440, height: 900 },
        { name: "tablet", width: 1024, height: 768 },
        { name: "mobile", width: 390, height: 844 },
      ]) {
        const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } })
        await context.addInitScript((l) => {
          try { localStorage.setItem("hanahoush-language", l) } catch {}
        }, locale)
        const page = await context.newPage()
        await page.goto("http://localhost:5173/", { waitUntil: "networkidle" })
        await page.waitForTimeout(600)
        const overflow = await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth))
        const searchBtn = page.locator("header button svg.lucide-search").first()
        let sb = null
        if (await searchBtn.isVisible().catch(() => false)) {
          sb = await searchBtn.locator("xpath=ancestor::button").boundingBox()
        }
        const menuBtn = page.locator("header button:has(svg.lucide-menu)").first()
        const menuVisible = await menuBtn.isVisible().catch(() => false)
        let drawerItems = null
        if (menuVisible) {
          await menuBtn.click()
          await page.waitForTimeout(300)
          const items = page.locator("#mobile-nav a, #mobile-nav button")
          drawerItems = []
          for (let i = 0; i < (await items.count()); i++) {
            const txt = (await items.nth(i).innerText()).replace(/\s+/g, " ").trim()
            if (txt) drawerItems.push(txt)
          }
        }
        await page.screenshot({ path: `C:/Users/User.RD-01/AppData/Local/Temp/opencode/${locale}-${vp.name}.png` })
        const headerBox = await page.locator("header").first().boundingBox()
        console.log(`--- ${locale} ${vp.name} dir=${await page.evaluate(() => document.documentElement.getAttribute("dir"))} overflow=${overflow}`)
        console.log("  header box:", headerBox)
        console.log("  search btn box:", sb)
        console.log("  menu visible:", menuVisible)
        if (drawerItems) console.log("  drawer items:", JSON.stringify(drawerItems))
        await context.close()
      }
    }
  } finally {
    await browser.close()
  }
}

main().catch((e) => { console.error(e); process.exit(1) })