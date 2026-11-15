import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://127.0.0.1:4174";
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;

export default defineConfig({
  testDir: "./test/integration/playwright",
  testMatch: "**/*.spec.ts",
  outputDir: "test-results/playwright",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    serviceWorkers: "block",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    ...(executablePath === undefined ? {} : { launchOptions: { executablePath } }),
  },
  webServer: {
    command:
      "npx --no-install vite --config test/integration/playwright/vite.config.ts --host 127.0.0.1 --port 4174 --strictPort",
    url: `${baseURL}/test/integration/playwright/index.html`,
    reuseExistingServer: false,
  },
});
