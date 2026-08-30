import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next";

import { resources } from "./resources";

export const appI18n = createInstance();

// Bundled resources and synchronous initialization make English available before React's first render.
void appI18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  supportedLngs: ["en", "ja"],
  initAsync: false,
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});
