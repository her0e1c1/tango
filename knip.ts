import type { KnipConfig } from "knip";

const config: KnipConfig = ({ production }) =>
  production
    ? {
        entry: ["src/app/main.tsx!"],
        project: ["src/**/*.{ts,tsx}!", "!src/**/*.{spec,test}.{ts,tsx}!", "!src/**/*.stories.{ts,tsx}!"],
        includeEntryExports: true,
        storybook: false,
        treatConfigHintsAsErrors: true,
        vitest: false,
      }
    : {
        entry: ["public/storybookServiceWorker.js", "steiger.config.ts"],
        includeEntryExports: true,
        treatConfigHintsAsErrors: true,
      };

export default config;
