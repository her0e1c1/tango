import React from "react";

import { startAuthSession } from "@/app/providers/auth/lifecycle";
import { useAuthSession } from "@/entities/auth";
import { RouteFeedback } from "@/shared/ui/route-feedback";

export interface AuthProviderProps {
  children: React.ReactNode;
  reload?: (() => void) | undefined;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  reload = () => {
    window.location.reload();
  },
}) => {
  const authState = useAuthSession();

  React.useEffect(() => {
    const stopAuthSession = startAuthSession();
    return stopAuthSession;
  }, []);

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

  return children;
};
