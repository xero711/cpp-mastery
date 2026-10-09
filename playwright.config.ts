import { defineConfig } from "@playwright/test";

const baseURL = "http://localhost:3008";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.e2e.ts",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: "list",
  outputDir: "test-results/playwright",
  use: {
    baseURL,
    browserName: "chromium",
    headless: true,
    trace: "retain-on-failure",
  },
  webServer: {
    command: "pnpm dev --port 3008",
    url: `${baseURL}/dashboard/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
