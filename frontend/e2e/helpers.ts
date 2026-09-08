import { readFileSync } from "node:fs"
import type { Page, BrowserContext } from "@playwright/test"

export const CREDENTIALS_PATH = "C:/Users/User.RD-01/AppData/Local/Temp/opencode/hanahoush_e2e.json"

export interface DemoAccount {
  password: string
  role: string
}

export type Credentials = Record<string, DemoAccount>

let cache: Credentials | null = null

export function loadCredentials(): Credentials {
  if (!cache) {
    cache = JSON.parse(readFileSync(CREDENTIALS_PATH, "utf-8")) as Credentials
  }
  return cache
}

/** Force the UI locale for a context (empty string clears the preference). */
export async function forceLocale(context: BrowserContext, locale: "" | "en" | "fa" | "ar") {
  await context.addInitScript((l) => {
    try {
      if (!l) window.localStorage.removeItem("hanahoush-language")
      else window.localStorage.setItem("hanahoush-language", l)
    } catch {
      /* noop */
    }
  }, locale)
}

/** Force a theme for a context. */
export async function forceTheme(context: BrowserContext, theme: "light" | "dark" | "system" | "") {
  await context.addInitScript((t) => {
    try {
      if (!t) window.localStorage.removeItem("hanahoush-theme")
      else window.localStorage.setItem("hanahoush-theme", t)
    } catch {
      /* noop */
    }
  }, theme)
}

/** Track console errors + page errors on a page; returns the collector. */
export function attachConsoleWatch(page: Page) {
  const consoleErrors: string[] = []
  const pageErrors: string[] = []
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text())
  })
  page.on("pageerror", (err) => pageErrors.push(String(err)))
  return { consoleErrors, pageErrors }
}

/** Real UI login through the form (never via API tokens). */
export async function uiLogin(page: Page, username: string, password: string) {
  await page.goto("/login")
  await page.locator("#username").fill(username)
  await page.locator("#password").fill(password)
  await page.locator('form button[type="submit"]').click()
  await page.waitForURL("**/dashboard", { timeout: 20_000 })
}

export async function logoutViaTopbar(page: Page) {
  await page.locator('[aria-label="Log out"]').first().click()
  await page.waitForURL("**/login**", { timeout: 15_000 }).catch(() => {
    /* logout may navigate to home; guard by URL check below */
  })
}

/** Total page width assertions for responsive QA. */
export async function horizontalOverflowPx(page: Page): Promise<number> {
  await page.evaluate(() => document.fonts?.ready)
  return page.evaluate(() => {
    const root = document.documentElement
    return Math.max(0, root.scrollWidth - root.clientWidth)
  })
}

export async function headingTexts(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll("h1, h2, h3, h4")).map((el) =>
      (el.textContent ?? "").replace(/\s+/g, " ").trim(),
    ),
  )
}

export const PUBLIC_SLUGS = {
  article: "demo-devops-culture",
  project: "demo-corporate-website",
}

export const VIEWPORTS: Record<string, { width: number; height: number }> = {
  desktop_large: { width: 1440, height: 900 },
  desktop_medium: { width: 1280, height: 800 },
  tablet: { width: 1024, height: 768 },
  tablet_portrait: { width: 768, height: 1024 },
  mobile: { width: 390, height: 844 },
  mobile_small: { width: 375, height: 812 },
}