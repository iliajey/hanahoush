import { chromium } from "@playwright/test"

async function main() {
  const browser = await chromium.launch({ channel: "msedge", headless: true })
  try {
    for (const locale of ["en", "fa", "ar"]) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
      await context.addInitScript((l) => {
        try { localStorage.setItem("hanahoush-language", l) } catch {}
      }, locale)
      const page = await context.newPage()

      // /search page
      await page.goto("http://localhost:5173/search", { waitUntil: "networkidle" })
      await page.waitForTimeout(400)
      const searchPage = await page.evaluate(() => {
        const input = document.querySelector('input[type="search"], input[role]') 
        const form = document.querySelector('form[role="search"]')
        const select = document.querySelector('[role="combobox"]')
        const pageWrap = document.querySelector("main")
        return {
          input: input ? { id: input.id } : null,
          formBox: form ? rect(form) : null,
          selectBox: select ? rect(select) : null,
          mainBox: pageWrap ? rect(pageWrap) : null,
        }
        function rect(el) {
          const r = el.getBoundingClientRect()
          return { x: r.x, y: r.y, w: r.width, h: r.height }
        }
      })
      console.log(`--- ${locale} /search ---`)
      console.log(JSON.stringify(searchPage, null, 2))

      // command dialog
      await page.goto("http://localhost:5173/", { waitUntil: "networkidle" })
      await page.waitForTimeout(400)
      await page.keyboard.press("Control+k")
      await page.waitForTimeout(500)
      const dialog = await page.evaluate(() => {
        const input = document.querySelector('[role="dialog"] input')
        const dialogEl = document.querySelector('[role="dialog"]')
        const field = input ? input.closest("div.relative") : null
        const clear = input ? input.closest(".relative")?.querySelector("button") : null
        return {
          dialogBox: dialogEl ? rect(dialogEl) : null,
          inputBox: input ? rect(input) : null,
          fieldBox: field ? rect(field) : null,
          dir: getComputedStyle(document.documentElement).direction,
          hasClearBtnWhenEmpty: !!clear,
        }
        function rect(el) {
          const r = el.getBoundingClientRect()
          return { x: r.x, y: r.y, w: r.width, h: r.height }
        }
      })
      console.log(`--- ${locale} dialog ---`)
      console.log(JSON.stringify(dialog, null, 2))
      await context.close()
    }
  } finally {
    await browser.close()
  }
}

main().catch((e) => { console.error(e); process.exit(1) })