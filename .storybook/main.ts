import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/react-vite";
import { mergeConfig } from "vite";
// Storybook's config loader requires the runtime extension even though this resolves to TypeScript source.
import { withoutPwaPlugins } from "./vitePlugins.js";

const storybookFirebase = fileURLToPath(new URL("./support/firebase.ts", import.meta.url));

const config: StorybookConfig = {
  stories: ["./ComponentCatalog.mdx", "../src/**/*.stories.tsx", "../test/integration/storybook/**/*.stories.tsx"],
  staticDirs: ["../public"],
  addons: ["@storybook/addon-a11y", "@storybook/addon-docs", "@storybook/addon-themes", "@storybook/addon-vitest"],
  framework: "@storybook/react-vite",
  viteFinal: async (viteConfig) =>
    mergeConfig(
      {
        ...viteConfig,
        plugins: withoutPwaPlugins(viteConfig.plugins),
      },
      {
        // Build metadata is an external input; keep the settings contract fixture reproducible.
        define: {
          __APP_VERSION__: JSON.stringify("1.2.3"),
          __COMMIT_HASH__: JSON.stringify("0123456789abcdef0123456789abcdef01234567"),
        },
        // Keep facade re-exports connected to the SDK mocks rather than prebundling separate copies.
        optimizeDeps: { exclude: ["firebase/auth", "firebase/firestore"] },
        resolve: {
          alias: [{ find: /^(?:@\/shared\/firebase|\.\.\/firebase)$/, replacement: storybookFirebase }],
        },
      }
    ),
};
export default config;
