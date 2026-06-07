import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  timeout: 30_000,
  fullyParallel: false,
  use: {
    baseURL: "http://localhost:3100",
    storageState: "playwright/.auth/user.json",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run start:e2e",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
})
