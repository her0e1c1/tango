import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

// Stryker runs the unit suite without initializing browser or emulator projects.
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      name: "unit",
      // Avoid appending a GitHub test summary for every mutant run.
      reporters: ["default"],
      globals: true,
      setupFiles: ["./test/setup.ts"],
      include: ["src/**/*.spec.{ts,tsx}", "*.spec.{ts,tsx}"],
      environment: "jsdom",
    },
  })
);
