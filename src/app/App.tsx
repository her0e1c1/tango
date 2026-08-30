/**
 * @file Defines Tango's top-level application shell.
 * Authentication, display settings, and router setup live here while route definitions are owned by
 * the app/routes segment.
 */

import React from "react";
import { RouterProvider } from "react-router-dom";

import { usePreferences } from "@/entities/preference";

import { AuthProvider } from "./auth";
import { FirestoreSubscriptionsProvider } from "./firestore-subscriptions";

interface AppProps {
  router: React.ComponentProps<typeof RouterProvider>["router"];
}

/**
 * Renders the App user interface.
 * Reads display settings and installs the application routes.
 */
const App: React.FC<AppProps> = ({ router }) => {
  const { darkMode } = usePreferences().appearance;

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  return (
    <AuthProvider>
      <FirestoreSubscriptionsProvider>
        <RouterProvider router={router} />
      </FirestoreSubscriptionsProvider>
    </AuthProvider>
  );
};

export default App;
