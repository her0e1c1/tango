import type { KnipConfig } from "knip";

const config: KnipConfig = {
  workspaces: {
    ".": {
      // These files are loaded externally; plugins discover the application, test, and other tooling entry points.
      entry: ["steiger.config.ts"],
      vitest: {
        config: ["vitest.config.ts", "vitest.mutation.config.ts"],
      },
      project: [
        "src/**/*.{ts,tsx,css,scss,sass,mdx}!",
        "test/**/*.{ts,tsx}",
        "scripts/**/*.ts",
        ".storybook/**/*.{ts,tsx}",
        "*.{ts,js}",
      ],
    },
    "vendor/braces": {
      entry: ["index.js!"],
      project: ["lib/*.js!"],
    },
  },
};

export default config;
