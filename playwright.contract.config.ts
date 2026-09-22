import { defineConfig } from "@playwright/test";
import baseConfig from "./playwright.config";

export default defineConfig(baseConfig, {
  reporter: [["./test/e2e/e2e-contract-reporter.ts"]],
});
