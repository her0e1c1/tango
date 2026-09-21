import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/react-vite";
import { mergeConfig } from "vite";
// Storybook's config loader requires the runtime extension even though this resolves to TypeScript source.
import { withoutPwaPlugins } from "./vitePlugins.js";

const storybookFirebase = fileURLToPath(new URL("./support/firebase.ts", import.meta.url));

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.tsx"],
  staticDirs: ["../public"],
  addons: ["@storybook/addon-a11y", "@storybook/addon-docs", "@storybook/addon-themes", "@storybook/addon-vitest"],
  framework: "@storybook/react-vite",
  viteFinal: async (viteConfig) => {
    const finalConfig = mergeConfig(viteConfig, {
      resolve: {
        alias: [{ find: /^(?:@\/shared\/firebase|\.\.\/firebase)$/, replacement: storybookFirebase }],
      },
    });
    finalConfig.plugins = withoutPwaPlugins(finalConfig.plugins);
    return finalConfig;
  },
};
export default config;
