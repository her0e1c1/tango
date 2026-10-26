import { resolve } from "node:path";
import { defineConfig } from "@playwright/test";

const output = resolve("test-results/report-fixture");

export default defineConfig({
  testDir: ".",
  testMatch: "report.spec.ts",
  outputDir: resolve(output, "results"),
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: [
    ["html", { outputFolder: resolve(output, "html"), open: "never" }],
    ["json", { outputFile: resolve(output, "report.json") }],
  ],
  use: { trace: "on" },
});
