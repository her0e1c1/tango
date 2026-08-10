/// <reference types="vite/client" />

import { withThemeByClassName } from "@storybook/addon-themes";
import type { Preview } from "@storybook/react";
import { setupWorker } from "msw/browser";
import { mswLoader } from "msw-storybook-addon/csf3";
import { storybookHandlers } from "../src/storybook/handlers";
import { INITIAL_VIEWPORTS } from "../src/storybook/storybookViewports";
import "../src/index.css";

const preview: Preview = {
  decorators: [
    withThemeByClassName({
      themes: {
        light: "light",
        dark: "dark",
      },
      defaultTheme: "light",
    }),
  ],
  loaders: [
    mswLoader(async () => {
      const worker = setupWorker();
      await worker.start({
        onUnhandledRequest: "bypass",
        serviceWorker: {
          url: "./mockServiceWorker.js",
        },
      });
      return worker;
    }),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    msw: storybookHandlers,
    viewport: {
      options: INITIAL_VIEWPORTS,
    },
  },
};

export default preview;
