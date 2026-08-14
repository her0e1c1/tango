/**
 * @file Defines Tango's top-level application shell.
 * Authentication, display settings, and router setup live here while route definitions are owned by
 * the app/routes segment.
 */

import React from "react";
import { BrowserRouter } from "react-router-dom";

import { startAuthSession } from "@/app/providers/auth/lifecycle";
import { FirestoreSubscriptionsProvider } from "@/app/providers/firestore-subscriptions";
import { AppRoutes } from "@/app/routes";
import { useAuthSession } from "@/entities/auth";
import { usePreferences } from "@/entities/preferences";
import { RouteFeedback } from "@/shared/ui/route-feedback";

/**
 * Renders the App user interface.
 * Reads authentication and display settings, installs the application routes, and offers reload
 * when startup fails.
 */
const App: React.FC<{ reload?: () => void }> = ({ reload = () => window.location.reload() }) => {
  const { darkMode } = usePreferences().appearance;
  const authState = useAuthSession();

  React.useEffect(() => {
    const stopAuthSession = startAuthSession();
    return stopAuthSession;
  }, []);

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  if (
    authState.status === "initializing" ||
    authState.status === "unauthenticated" ||
    authState.status === "authenticating"
  ) {
    return (
      <FirestoreSubscriptionsProvider>
        <RouteFeedback title="Starting Tango…" description="Preparing your decks and study progress." tone="loading" />
      </FirestoreSubscriptionsProvider>
    );
  }

  if (authState.status === "error") {
    return (
      <FirestoreSubscriptionsProvider>
        <RouteFeedback
          title="Unable to start Tango"
          description="Authentication could not be initialized."
          tone="error"
          primaryAction={{ label: "Reload", onClick: reload }}
        />
      </FirestoreSubscriptionsProvider>
    );
  }

  return (
    <FirestoreSubscriptionsProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </FirestoreSubscriptionsProvider>
  );
};

export default App;
