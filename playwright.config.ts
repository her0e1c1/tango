import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./test/e2e",
  testMatch: "**/*.spec.ts",
  globalSetup: "./test/e2e/global-setup.ts",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  ...(process.env.CI ? { workers: 4 } : {}),
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Full headless Chromium honors the scoped secure-origin override; headless shell does not. The isolated Vite
        // origin needs it so PERSIST-02 can cache the app shell before a real context-level offline reload. Remote
        // workers must also use the browser container's shared IPC memory instead of blocking on overlay-backed /tmp.
        channel: "chromium",
        launchOptions: {
          args: ["--unsafely-treat-insecure-origin-as-secure=http://app.test:4173"],
          ignoreDefaultArgs: ["--disable-dev-shm-usage"],
        },
      },
    },
  ],
});
