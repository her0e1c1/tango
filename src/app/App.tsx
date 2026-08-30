/**
 * @file Defines Tango's top-level application shell.
 * Authentication, display settings, and router setup live here while route definitions are owned by
 * the app/routes segment.
 */

import React from "react";
import { BrowserRouter } from "react-router-dom";

import { usePreferences } from "@/entities/preference";
import { ToastViewport } from "@/shared/ui/toast";

import { AuthProvider } from "./auth";
import { FirestoreSubscriptionsProvider } from "./firestore-subscriptions";
import { AppRoutes } from "./routes";

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
    <>
      <AuthProvider>
        <FirestoreSubscriptionsProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </FirestoreSubscriptionsProvider>
      </AuthProvider>
      <ToastViewport />
    </>
  );
};

export default App;
