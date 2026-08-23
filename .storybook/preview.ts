import { withThemeByClassName } from "@storybook/addon-themes";
import type { Preview } from "@storybook/react";
import { setupWorker } from "msw/browser";
import { mswLoader } from "msw-storybook-addon/csf3";
import { storybookHandlers } from "./support/handlers";
import { INITIAL_VIEWPORTS } from "./support/storybookViewports";
import "../src/app/styles/index.css";

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
    mswLoader(() => {
      const worker = setupWorker();
      return worker
        .start({
          onUnhandledRequest: "bypass",
          serviceWorker: {
            url: "./storybookServiceWorker.js",
          },
        })
        .then(() => worker);
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
    options: {
      storySort: {
        order: ["Integration", "Pages", "Features", "Shared"],
      },
    },
    viewport: {
      options: INITIAL_VIEWPORTS,
    },
  },
};

export default preview;
