import type { KnipConfig } from "knip";

const config: KnipConfig = {
  // Loaded externally by Steiger; other entry points are discovered from their explicit references.
  entry: ["steiger.config.ts"],
  project: [
    "src/**/*.{ts,tsx,css,scss,sass,mdx}!",
    "test/**/*.{ts,tsx}",
    ".storybook/**/*.{ts,tsx}",
    "*.{ts,js}",
  ],
};

export default config;
