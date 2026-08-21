import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: ["src/app/main.tsx!"],
  project: [
    "src/**/*.{ts,tsx}!",
    "!src/**/*.{spec,test}.{ts,tsx}!",
    "!src/**/*.stories.{ts,tsx}!",
    // These entry points are consumed only by Storybook, which is intentionally outside the production graph.
    "!src/entities/*/testing.ts!",
  ],
  ignoreDependencies: ["@feature-sliced/steiger-plugin", "tailwindcss"],
  includeEntryExports: true,
};

export default config;
