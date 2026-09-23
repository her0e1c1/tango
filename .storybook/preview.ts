import { withThemeByClassName } from "@storybook/addon-themes";
import type { Decorator, Preview } from "@storybook/react";
import { createElement } from "react";
import { I18nextProvider } from "react-i18next";

import { appI18n } from "../src/app/i18n/instance";
import { INITIAL_VIEWPORTS } from "./support/storybookViewports";
import "../src/app/styles/index.css";

// Docs mounts English and Japanese stories together; each language needs its own instance.
const docsI18n = {
  en: appI18n.cloneInstance({ lng: "en", initAsync: false }),
  ja: appI18n.cloneInstance({ lng: "ja", initAsync: false }),
};

const withI18n: Decorator = (Story, { parameters, viewMode }) => {
  const language = parameters.locale === "ja" ? "ja" : "en";
  const i18n = viewMode === "docs" ? docsI18n[language] : appI18n;
  const content = createElement(I18nextProvider, { i18n }, createElement(Story));
  return viewMode === "docs"
    ? createElement("div", { lang: language, style: { display: "contents" } }, content)
    : content;
};

const preview: Preview = {
  beforeEach: async ({ parameters, viewMode }) => {
    const language = parameters.locale === "ja" ? "ja" : "en";
    const i18n = viewMode === "docs" ? docsI18n[language] : appI18n;
    await i18n.changeLanguage(language);
    document.documentElement.lang = viewMode === "docs" ? "en" : language;
  },
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
