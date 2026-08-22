import React from "react";

import { RouteFeedback } from "@/shared/ui/route-feedback";

import { startAuthSession, type AuthBootstrapStatus } from "./lifecycle";

export interface AuthProviderProps {
  children: React.ReactNode;
  reload?: (() => void) | undefined;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children, reload = () => window.location.reload() }) => {
  const [status, setStatus] = React.useState<AuthBootstrapStatus>("starting");

  React.useEffect(() => startAuthSession(setStatus), []);

  if (status === "starting") {
    return (
      <RouteFeedback title="Starting Tango…" description="Preparing your decks and study progress." tone="loading" />
    );
  }

  if (status === "error") {
    return (
      <RouteFeedback
        title="Unable to start Tango"
        description="Authentication could not be initialized."
        tone="error"
        primaryAction={{ label: "Reload", onClick: reload }}
      />
    );
  }

  return children;
};
