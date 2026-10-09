import { defineConfig } from "@playwright/test";
import { readFileSync } from "node:fs";

const [owner, repository] = (process.env.GITHUB_REPOSITORY ?? "").split("/");
const isUserOrOrganizationSite = repository === `${owner}.github.io`;
const environmentBasePath = repository && !isUserOrOrganizationSite ? `/${repository}` : "";
let basePath = environmentBasePath;
try {
  const manifest = JSON.parse(readFileSync(".next/routes-manifest.json", "utf8")) as { basePath?: unknown };
  if (typeof manifest.basePath === "string") basePath = manifest.basePath;
} catch {
  // A build manifest is optional when the test runner is used outside a built checkout.
}
const baseURL = `http://localhost:3008${basePath}/`;

export default defineConfig({
  testDir: "./e2e",
  testMatch: "runner-integration.e2e.ts",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: "list",
  outputDir: "test-results/playwright-runner",
  use: {
    baseURL,
    browserName: "chromium",
    headless: true,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `node scripts/serve-static.mjs ${basePath}`.trim(),
    url: `${baseURL}settings/`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
