import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./test/production-smoke",
  fullyParallel: true,
  forbidOnly: true,
  retries: 2,
  reporter: [["github"], ["html", { open: "never", outputFolder: "playwright-report/production" }]],
  outputDir: "test-results/production",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "https://tango-ts.web.app",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
