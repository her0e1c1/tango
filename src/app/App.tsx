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
 * Reads display settings and installs the application routes.
 */
const App: React.FC = () => {
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

export default App;
