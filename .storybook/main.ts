import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/react-vite";
import { mergeConfig } from "vite";
import { withoutPwaPlugins } from "./vitePlugins.ts";

const storybookFirebase = fileURLToPath(new URL("../src/storybook/firebase.ts", import.meta.url));
const storybookFirestoreRuntime = fileURLToPath(
  new URL("../src/storybook/firestoreRuntime.ts", import.meta.url),
);

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
          alias: [
            { find: /^@\/firebase$/, replacement: storybookFirebase },
            {
              find: /^@\/adapters\/firestore\/runtime$/,
              replacement: storybookFirestoreRuntime,
            },
          ],
        },
      },
    ),
};
export default config;
