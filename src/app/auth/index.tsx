import React from "react";

import { setCurrentUser, useCurrentUser } from "@/entities/user";
import { RouteFeedback } from "@/shared/ui/route-feedback";

import { startAuthSession } from "./lifecycle";

export interface AuthProviderProps {
  children: React.ReactNode;
  reload?: (() => void) | undefined;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children, reload = () => window.location.reload() }) => {
  const currentUser = useCurrentUser();
  const [error, setError] = React.useState<unknown>(null);

  React.useEffect(
    () =>
      startAuthSession({
        onUserChange: (user) => {
          setCurrentUser(user);
          setError(null);
        },
        onError: setError,
      }),
    []
  );

  if (currentUser != null) return children;

  if (error != null) {
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
    <RouteFeedback title="Starting Tango…" description="Preparing your decks and study progress." tone="loading" />
  );
};
