import type { KnipConfig } from "knip";

const config: KnipConfig = {
  // These files are loaded externally; plugins discover the application, test, and other tooling entry points.
  entry: ["steiger.config.ts", "test/e2e/browser-fixture.ts"],
  project: [
    "src/**/*.{ts,tsx,css,scss,sass,mdx}!",
    "test/**/*.{ts,tsx}",
    "scripts/**/*.ts",
    ".storybook/**/*.{ts,tsx}",
    "*.{ts,js}",
  ],
};

export default config;
