/**
 * @file Defines Tango's top-level application shell.
 * Authentication, display settings, and router setup live here while route definitions are owned by
 * the app/routes segment.
 */

import React from "react";
import { BrowserRouter } from "react-router-dom";

import { AuthProvider } from "@/app/providers/auth";
import { FirestoreSubscriptionsProvider } from "@/app/providers/firestore-subscriptions";
import { AppRoutes } from "@/app/routes";
import { usePreferences } from "@/entities/preferences";

/**
 * Renders the App user interface.
 * Reads authentication and display settings, installs the application routes, and offers reload
 * when startup fails.
 */
const App: React.FC<{ reload?: () => void }> = ({ reload }) => {
  const { darkMode } = usePreferences().appearance;

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  return (
    <AuthProvider reload={reload}>
      <FirestoreSubscriptionsProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </FirestoreSubscriptionsProvider>
    </AuthProvider>
  );
};

export default App;
