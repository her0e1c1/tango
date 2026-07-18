import type { StorybookConfig } from "@storybook/react-vite";
import { mergeConfig } from "vite";
import { createReactCompilerPlugin } from "../reactCompiler";
import { withoutPwaPlugins } from "./vitePlugins";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.tsx"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-docs",
    "@storybook/addon-themes",
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
        plugins: [createReactCompilerPlugin()],
      },
    ),
};
export default config;
