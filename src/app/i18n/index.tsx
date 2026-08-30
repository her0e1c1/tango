import type * as React from "react";
import { useLayoutEffect } from "react";
import { I18nextProvider } from "react-i18next";

import { usePreferences } from "@/entities/preference";

import { appI18n } from "./instance";
import { type AppLanguage, resolveEffectiveLanguage } from "./locale";

const synchronizeLanguage = (language: AppLanguage): void => {
  // Static resources make this language change synchronous. Keep it before html[lang] so translated
  // content and the document's accessibility metadata move to the same locale before paint.
  if (appI18n.resolvedLanguage !== language) void appI18n.changeLanguage(language);
  document.documentElement.lang = language;
};

export interface I18nProviderProps {
  children: React.ReactNode;
}

/** Connects the browser-independent language preference to Tango's browser i18n runtime. */
export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  const { language } = usePreferences();

  // A layout effect prevents the previous locale from becoming visible during preference hydration or switching.
  useLayoutEffect(() => {
    const synchronizeEffectiveLanguage = () => {
      synchronizeLanguage(resolveEffectiveLanguage(language, window.navigator.language));
    };

    synchronizeEffectiveLanguage();

    // Explicit choices are user-owned; browser changes may drive the application only while System is selected.
    if (language !== "system") return;

    window.addEventListener("languagechange", synchronizeEffectiveLanguage);
    return () => window.removeEventListener("languagechange", synchronizeEffectiveLanguage);
  }, [language]);

  return <I18nextProvider i18n={appI18n}>{children}</I18nextProvider>;
};
