import type { KnipConfig } from "knip";

const config: KnipConfig = {
  // These files are loaded externally; plugins discover the application, test, and other tooling entry points.
  entry: [
    "steiger.config.ts",
    // Knip does not discover Vite's RegExp aliases; list only their externally loaded I/O facades.
    "test/integration/playwright/{auth,card,deck,files,firebase,sdk-auth,sdk-firestore,study-answer,study-session}.ts",
  ],
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
};

export default config;
