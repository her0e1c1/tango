/**
 * @file Defines Tango's top-level application shell.
 * Authentication, display settings, and router setup live here while route definitions are owned by
 * the app/routes segment.
 */

import React from "react";
import { BrowserRouter } from "react-router-dom";

import { usePreferences } from "@/entities/preference";

import { AuthProvider } from "./auth";
import { FirestoreSubscriptionsProvider } from "./firestore-subscriptions";
import { I18nProvider } from "./i18n";
import { AppRoutes } from "./routes";

/**
 * Renders the App user interface.
 * Reads display settings and installs the application routes.
 */
const AppShell: React.FC = () => {
  const { darkMode } = usePreferences().appearance;

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  return (
    <AuthProvider>
      <FirestoreSubscriptionsProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </FirestoreSubscriptionsProvider>
    </AuthProvider>
  );
};

const App: React.FC = () => (
  // The provider remains above the router so a locale update rerenders translations without replacing route state.
  <I18nProvider>
    <AppShell />
  </I18nProvider>
);

export default App;
