/**
 * @file Defines Tango's top-level application shell.
 * Authentication, display settings, and router setup live here while route definitions are owned by
 * the app/routes segment.
 */

import React from "react";
import { RouterProvider } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useInvalidCardIds } from "@/entities/card";
import { usePreferences } from "@/entities/preference";
import { ToastViewport } from "@/shared/ui/toast";

import { AuthProvider } from "./auth";
import { I18nProvider } from "./i18n";

interface AppProps {
  router: React.ComponentProps<typeof RouterProvider>["router"];
}

/**
 * Renders the App user interface.
 * Reads display settings and installs the application routes.
 */
const AppShell: React.FC<AppProps> = ({ router }) => {
  const { t } = useTranslation();
  const invalidCardIds = useInvalidCardIds();
  const { darkMode } = usePreferences().appearance;
  const focusFallbackRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  return (
    <>
      <main
        ref={focusFallbackRef}
        // This landmark survives route replacement so removing a focused Toast never leaves focus on the document body.
        tabIndex={-1}
      >
        {invalidCardIds.length > 0 && (
          <p
            role="status"
            className="mx-auto mb-4 mt-[calc(var(--spacing-touch)+2rem+env(safe-area-inset-top))] max-w-reading rounded-surface border border-warning bg-surface px-4 py-3 text-body text-ink"
          >
            {t("savedCards.invalid", { count: invalidCardIds.length })}
          </p>
        )}
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </main>
      <ToastViewport focusFallbackRef={focusFallbackRef} />
    </>
  );
};

const App: React.FC<AppProps> = ({ router }) => (
  // The provider remains above the router so a locale update rerenders translations without replacing route state.
  <I18nProvider>
    <AppShell router={router} />
  </I18nProvider>
);

export default App;
