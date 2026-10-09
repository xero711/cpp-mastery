import { defineConfig } from "@playwright/test";

const [owner, repository] = (process.env.GITHUB_REPOSITORY ?? "").split("/");
const isUserOrOrganizationSite = repository === `${owner}.github.io`;
const basePath = repository && !isUserOrOrganizationSite ? `/${repository}` : "";
const baseURL = `http://localhost:3008${basePath}/`;

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.e2e.ts",
  testIgnore: "runner-integration.e2e.ts",
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
    command: `node scripts/serve-static.mjs ${basePath}`.trim(),
    url: `${baseURL}dashboard/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
