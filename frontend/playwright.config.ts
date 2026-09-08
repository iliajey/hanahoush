import { defineConfig } from "@playwright/test"

/**
 * Phase 10 browser-verification harness.
 *
 * Uses the locally installed Microsoft Edge (channel: "msedge") — no browser
 * downloads are required. All tests run against the real local stack:
 *   backend  http://127.0.0.1:8000  (Django + real PostgreSQL `hanahoush` DB)
 *   frontend http://localhost:5173   (Vite dev server)
 *
 * Evidence: HTML report + per-scenario screenshots under e2e-artifacts.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [
    ["html", { outputFolder: "e2e-artifacts/report", open: "never" }],
    ["line"],
  ],
  use: {
    baseURL: "http://localhost:5173",
    channel: "msedge",
    headless: true,
    viewport: { width: 1440, height: 900 },
    screenshot: "only-on-failure",
    video: "off",
    trace: "retain-on-failure",
    locale: "en-US",
  },
  projects: [
    { name: "chromium" },
  ],
})