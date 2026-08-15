import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/react-vite";
import { mergeConfig } from "vite";
import { withoutPwaPlugins } from "./vitePlugins";

const storybookFirebase = fileURLToPath(new URL("./support/firebase.ts", import.meta.url));
const STORYBOOK_FIREBASE_ALIAS = /^@\/shared\/firebase$/;

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.tsx"],
  staticDirs: ["../public"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-docs",
    "@storybook/addon-themes",
    "@storybook/addon-vitest",
    "msw-storybook-addon",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  viteFinal: async (viteConfig) =>
    mergeConfig(
      {
        ...viteConfig,
        plugins: withoutPwaPlugins(viteConfig.plugins),
      },
      {
        resolve: {
          alias: [{ find: STORYBOOK_FIREBASE_ALIAS, replacement: storybookFirebase }],
        },
      }
    ),
};
export default config;
