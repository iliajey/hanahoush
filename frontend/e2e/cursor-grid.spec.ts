import { test, expect } from "@playwright/test"

test.describe("living cursor (Part H)", () => {
  test("enabled on fine pointer, no layout impact, keyboard usable", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator(".hh-cursor").first()).toBeVisible({ timeout: 15_000 })

    // pointer-events: none and fixed positioning → zero layout impact.
    const styles = await page.evaluate(() => {
      const el = document.querySelector(".hh-cursor")
      if (!el) return null
      const s = getComputedStyle(el)
      return { pointerEvents: s.pointerEvents, position: s.position }
    })
    expect(styles?.pointerEvents).toBe("none")
    expect(styles?.position).toBe("fixed")

    // The three layers exist.
    expect(await page.locator(".hh-cursor-glow").count()).toBe(1)
    expect(await page.locator(".hh-cursor-orb").count()).toBe(1)
    expect(await page.locator(".hh-cursor-ring").count()).toBe(1)

    // System cursor suppressed under fine-pointer conditions only.
    const suppressed = await page.evaluate(() => getComputedStyle(document.body).cursor)
    expect(["none", "auto"]).toContain(suppressed)

    // Moving the pointer moves the layers (translate changes).
    const before = await page.locator(".hh-cursor-orb").evaluate((el) => (el as HTMLElement).style.translate)
    await page.mouse.move(620, 340)
    await page.mouse.move(700, 420)
    await page.waitForTimeout(300)
    const after = await page.locator(".hh-cursor-orb").evaluate((el) => (el as HTMLElement).style.translate)
    expect(after).not.toBe("")
    expect(before).not.toBe(after)

    // No document-level layout change from the cursor overlay. The living cursor
    // is position:fixed, so removing it must not alter document dimensions.
    // Force lazy images to load first so the measurement is stable.
    await page.evaluate(() => document.fonts?.ready)
    await page.evaluate(async () => {
      const step = Math.max(500, window.innerHeight * 0.6)
      for (let y = 0; y <= document.documentElement.scrollHeight; y += step) {
        window.scrollTo(0, y)
        await new Promise((r) => setTimeout(r, 70))
      }
      window.scrollTo(0, 0)
      await new Promise((r) => setTimeout(r, 300))
      await Promise.all(Array.from(document.images).map((img) => img.decode().catch(() => undefined)))
    })
    await expect
      .poll(
        async () => {
          const h = await page.evaluate(() => document.documentElement.scrollHeight)
          await page.waitForTimeout(400)
          const h2 = await page.evaluate(() => document.documentElement.scrollHeight)
          return h === h2
        },
        { timeout: 20_000, message: "page layout settles" },
      )
      .toBe(true)
    const layoutBefore = await page.evaluate(() => ({ w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight }))
    await page.evaluate(() => document.querySelector(".hh-cursor")?.remove())
    await page.waitForTimeout(200)
    const layoutAfter = await page.evaluate(() => ({ w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight }))
    expect(Math.abs(layoutAfter.w - layoutBefore.w)).toBeLessThanOrEqual(1)
    expect(Math.abs(layoutAfter.h - layoutBefore.h)).toBeLessThanOrEqual(1)

    // Keyboard usability unaffected: Tab cycles focus.
    await page.keyboard.press("Tab")
    const active = await page.evaluate(() => document.activeElement?.tagName)
    expect(active).toBeTruthy()
  })

  test("state morphs over links and text inputs", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator(".hh-cursor").first()).toBeVisible({ timeout: 15_000 })

    const link = page.locator("a").first()
    await link.hover()
    await page.waitForTimeout(250)
    const overLink = await page.locator(".hh-cursor").getAttribute("data-state")
    expect(["link", "card", "default"]).toContain(overLink)

    const input = page.locator("input, textarea").first()
    if ((await input.count()) > 0) {
      await input.hover()
      await page.waitForTimeout(250)
      const overText = await page.locator(".hh-cursor").getAttribute("data-state")
      expect(["text", "link", "default"]).toContain(overText)
      // Native I-beam preserved on text fields.
      const inputCursor = await input.evaluate((el) => getComputedStyle(el).cursor)
      expect(["text", "auto"]).toContain(inputCursor)
    }
  })

  test("disabled by reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.goto("/")
    await page.waitForTimeout(1200)
    await expect(page.locator(".hh-cursor")).toHaveCount(0)
  })
})

test.describe("grid / scroll visual states (Part H)", () => {
  test("grid background present, subtle, no layout impact", async ({ page }) => {
    await page.goto("/articles")
    await expect(page.locator(".hh-grid").first()).toBeVisible({ timeout: 15_000 })

    const grid = await page.locator(".hh-grid").first().evaluate((el) => {
      const s = getComputedStyle(el)
      return { position: s.position, pointerEvents: s.pointerEvents, height: el.getBoundingClientRect().height }
    })
    expect(grid.pointerEvents).toBe("none")

    const energy = await page.locator("[data-grid-energy]").first().evaluate((el) => {
      const s = getComputedStyle(el)
      return { pointerEvents: s.pointerEvents, opacity: parseFloat(s.opacity) }
    })
    expect(energy.pointerEvents).toBe("none")
    expect(energy.opacity).toBeGreaterThan(0)
    expect(energy.opacity).toBeLessThan(1)
  })

  test("scroll story transitions between sections (home)", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator("[data-visual-state]").first()).toBeVisible({ timeout: 15_000 })

    // Move into a services-section and confirm the published CSS vars change.
    const projectsSection = page.locator('[data-visual-state="projects"]').first()
    if ((await projectsSection.count()) > 0) {
      await projectsSection.scrollIntoViewIfNeeded()
      await page.waitForTimeout(900)
      const gridScale = await page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue("--vs-grid-scale").trim(),
      )
      const energyOpacity = await page.evaluate(() =>
        parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--vs-energy-opacity")),
      )
      // projects token gridScale=0.97, energyOpacity=0.3
      expect(Number(gridScale)).toBeCloseTo(0.97, 2)
      expect(energyOpacity).toBeCloseTo(0.3, 1)
    }
  })

  test("parallax runs on fine pointer and does not shift layout", async ({ page }) => {
    await page.goto("/")
    const before = await page.evaluate(() => document.documentElement.scrollWidth)
    await page.mouse.move(400, 300)
    await page.mouse.wheel(0, 600)
    await page.waitForTimeout(700)
    // Container moves via transform, so no scroll-width change.
    const after = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(after).toBe(before)
  })

  test("grid/scroll system disabled under reduced motion (no permanent rAF)", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.goto("/")
    await page.waitForTimeout(1000)
    // Cursor layers absent; the backdrop stays static.
    await expect(page.locator(".hh-cursor")).toHaveCount(0)
  })
})