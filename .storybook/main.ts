import type { StorybookConfig } from "@storybook/react-vite";
import { withoutPwaPlugins } from "./vitePlugins";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.tsx"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-docs",
    "@storybook/addon-themes",
    "@storybook/addon-vitest",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  viteFinal: async (viteConfig) =>
    ({
      ...viteConfig,
      plugins: withoutPwaPlugins(viteConfig.plugins),
    }),
};
export default config;
