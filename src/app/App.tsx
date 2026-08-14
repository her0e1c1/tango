/**
 * @file Defines Tango's top-level application shell.
 * Authentication, display settings, and router setup live here while route definitions are owned by
 * the app/routes segment.
 */

import React from "react";
import { BrowserRouter } from "react-router-dom";

import { startAuthSession } from "@/app/providers/auth/lifecycle";
import { startCardSynchronization } from "@/app/providers/remote-read/card";
import { subscribeDecks } from "@/app/providers/remote-read/deck";
import { AppRoutes } from "@/app/routes";
import { useAuthSession } from "@/entities/auth";
import { clearCards } from "@/entities/card";
import { clearDecks } from "@/entities/deck";
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
  const authenticatedUid = authState.status === "authenticated" ? authState.uid : null;

  React.useEffect(() => {
    const stopAuthSession = startAuthSession();
    return stopAuthSession;
  }, []);

  React.useEffect(() => {
    const stopCards = authenticatedUid == null ? undefined : startCardSynchronization(authenticatedUid);
    const stopDecks = authenticatedUid == null ? undefined : subscribeDecks(authenticatedUid, console.error);

    return () => {
      stopCards?.();
      stopDecks?.();
      clearCards();
      clearDecks();
    };
  }, [authenticatedUid]);

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  if (
    authState.status === "initializing" ||
    authState.status === "unauthenticated" ||
    authState.status === "authenticating"
  ) {
    return (
      <RouteFeedback title="Starting Tango…" description="Preparing your decks and study progress." tone="loading" />
    );
  }

  if (authState.status === "error") {
    return (
      <RouteFeedback
        title="Unable to start Tango"
        description="Authentication could not be initialized."
        tone="error"
        primaryAction={{ label: "Reload", onClick: reload }}
      />
    );
  }

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
};

export default App;
