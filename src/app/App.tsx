/**
 * @file Defines Tango's top-level application shell.
 * Authentication, display settings, and router setup live here while route definitions are owned by
 * the app/routes segment.
 */

import React from "react";
import { BrowserRouter } from "react-router-dom";
import { useStore } from "zustand";

import { AppRoutes } from "@/app/routes";
import { useSession } from "@/entities/session";
import { configStore } from "@/shared/config/configStore";
import { RouteFeedback } from "@/shared/ui/route-feedback";

/**
 * Renders the App user interface.
 * Reads authentication and display settings, installs the application routes, and offers reload
 * when startup fails.
 */
const App: React.FC<{ reload?: () => void }> = ({ reload = () => window.location.reload() }) => {
  const darkMode = useStore(configStore, (state) => state.config.appearance.darkMode);
  const authState = useSession();

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  if (authState.status === "initializing" || authState.status === "signedOut") {
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
