import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: ["src/app/main.tsx!"],
  project: [
    "src/**/*.{ts,tsx}!",
    "!src/**/*.{spec,test}.{ts,tsx}!",
    "!src/**/*.stories.{ts,tsx}!",
  ],
  ignoreDependencies: ["@feature-sliced/steiger-plugin", "tailwindcss"],
  includeEntryExports: true,
};

export default config;
