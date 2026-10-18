import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "card-list-actions.demo.ts",
  workers: 1,
  retries: 0,
  timeout: 0,
  reporter: "list",
  use: {
    ...devices["Desktop Chrome"],
    headless: false,
    baseURL: "http://127.0.0.1:4173",
    trace: "on",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm start -- --host 127.0.0.1 --port 4173 --strictPort",
    cwd: process.cwd(),
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false,
    env: {
      VITE_PROJECT_ID: "tango-e2e",
      VITE_WEB_API_KEY: "e2e-api-key",
      VITE_USE_FIREBASE_EMULATORS: "true",
      VITE_DB_HOST: "127.0.0.1",
      VITE_DB_PORT: "8080",
      VITE_AUTH_HOST: "",
      VITE_AUTH_PORT: "",
    },
  },
});
