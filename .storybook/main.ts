import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/react-vite";
import { mergeConfig } from "vite";
// Storybook's config loader requires the runtime extension even though this resolves to TypeScript source.
import { withoutPwaPlugins } from "./vitePlugins.js";

const storybookFirebase = fileURLToPath(new URL("./support/firebase.ts", import.meta.url));

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.tsx"],
  staticDirs: ["../public"],
  addons: ["@storybook/addon-docs", "@storybook/addon-themes", "@storybook/addon-vitest", "msw-storybook-addon"],
  framework: "@storybook/react-vite",
  viteFinal: async (viteConfig) =>
    mergeConfig(
      {
        ...viteConfig,
        plugins: withoutPwaPlugins(viteConfig.plugins),
      },
      {
        resolve: {
          alias: [{ find: /^@\/shared\/firebase$/, replacement: storybookFirebase }],
        },
      }
    ),
};
export default config;
