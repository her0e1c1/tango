import type { KnipConfig } from "knip";

const config: KnipConfig = {
  // These files are loaded externally; plugins discover the application, test, and other tooling entry points.
  entry: [
    "steiger.config.ts",
    // Vite loads this HTML entry and these I/O facades through runtime resolve.alias values.
    "test/integration/playwright/firebase.ts",
    "test/integration/playwright/card.ts",
    "test/integration/playwright/study-answer.ts",
    "test/integration/playwright/study-session.ts",
    "test/integration/playwright/deck.ts",
    "test/integration/playwright/auth.ts",
    "test/integration/playwright/files.ts",
    "test/integration/playwright/sdk-auth.ts",
    "test/integration/playwright/sdk-firestore.ts",
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
