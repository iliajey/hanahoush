import { chromium } from "@playwright/test"

async function main() {
  const browser = await chromium.launch({ channel: "msedge", headless: true })
  try {
    for (const locale of ["en", "fa", "ar"]) {
      const context = await browser.newContext()
      await context.addInitScript((l) => {
        try { localStorage.setItem("hanahoush-language", l) } catch {}
      }, locale)
      const page = await context.newPage()
      await page.setViewportSize({ width: 1500, height: 800 })
      await page.goto("http://localhost:5173/", { waitUntil: "networkidle" })
      await page.waitForTimeout(400)
      const problems = []
      for (let width = 1000; width <= 1600; width += 5) {
        await page.setViewportSize({ width, height: 800 })
        await page.waitForTimeout(60)
        const overflow = await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth))
        if (overflow > 1) problems.push([width, overflow])
      }
      console.log(`=== ${locale} (width,overflowPx) ===`)
      console.log(JSON.stringify(problems))
      await context.close()
    }
  } finally {
    await browser.close()
  }
}

main().catch((e) => { console.error(e); process.exit(1) })