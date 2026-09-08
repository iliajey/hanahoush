import { chromium } from "@playwright/test"

async function main() {
  const browser = await chromium.launch({ channel: "msedge", headless: true })
  try {
    for (const locale of ["en", "fa"]) {
      for (const vp of [
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
        const info = await page.evaluate(() => {
          const header = document.querySelector("header")
          const drawer = document.getElementById("mobile-nav")
          return {
            headerHTML: header ? header.outerHTML.slice(0, 1500) : null,
            drawerPresent: !!drawer,
            drawerVisible: drawer ? getComputedStyle(drawer).display : null,
            bodyOverflow: { sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth },
          }
        })
        console.log(`=== ${locale} ${vp.name} ===`)
        console.log("drawerPresent:", info.drawerPresent, "drawerDisplay:", info.drawerVisible)
        console.log("sw/cw:", info.bodyOverflow)
        console.log(info.headerHTML)
        await context.close()
      }
    }
  } finally {
    await browser.close()
  }
}

main().catch((e) => { console.error(e); process.exit(1) })