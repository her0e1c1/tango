import { withThemeByClassName } from "@storybook/addon-themes";
import type { Decorator, Preview } from "@storybook/react";
import { createElement } from "react";
import { I18nextProvider } from "react-i18next";

import { appI18n } from "../src/app/i18n/instance";
import { INITIAL_VIEWPORTS } from "./support/storybookViewports";
import "../src/app/styles/index.css";

const withI18n: Decorator = (Story, context) => {
  // Every story starts from English unless it explicitly demonstrates another locale.
  void appI18n.changeLanguage(context.parameters.locale === "ja" ? "ja" : "en");
  return createElement(I18nextProvider, { i18n: appI18n }, createElement(Story));
};

const preview: Preview = {
  decorators: [
    withI18n,
    withThemeByClassName({
      themes: {
        light: "light",
        dark: "dark",
      },
      defaultTheme: "light",
    }),
  ],
  parameters: {
    a11y: {
      test: "error",
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
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
