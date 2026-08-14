import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: ["src/app/main.tsx!"],
  project: [
    "src/**/*.{ts,tsx}!",
    "!src/**/*.{spec,test}.{ts,tsx}!",
    "!src/**/*.stories.{ts,tsx}!",
  ],
  includeEntryExports: true,
  treatConfigHintsAsErrors: true,
};

export default config;
