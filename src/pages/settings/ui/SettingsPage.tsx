import type * as React from "react";
import { useNavigate } from "react-router-dom";
import { useKey } from "react-use";

import { useAuthSession } from "@/entities/auth";
import { updatePreferences, usePreferences } from "@/entities/preferences";
import { SettingsForm, usePreferencesFormState } from "@/features/settings";
import { useSignIn } from "@/features/sign-in";
import { useSignOut } from "@/features/sign-out";
import { RemoteMutationNotice } from "@/shared/ui/remote-mutation-notice";
import { AppLayout } from "@/widgets/app-layout";

interface SettingsPageProps {
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ login, logout }) => {
  const preferences = usePreferences();
  const authState = useAuthSession();
  const navigate = useNavigate();

  const authenticatedUser = authState.status === "authenticated" ? authState : undefined;
  const linkedUser = authenticatedUser != null && !authenticatedUser.isAnonymous ? authenticatedUser : undefined;
  const isLoggedIn = linkedUser != null;
  const identity = {
    uid: authenticatedUser?.uid ?? "",
    displayName: authenticatedUser?.displayName ?? null,
  };

  const signIn = useSignIn(login);
  const signOut = useSignOut(isLoggedIn ? logout : undefined);
  const accountOperation = isLoggedIn
    ? {
        run: signOut.signOut,
        pending: signOut.pending,
        error: signOut.error,
        pendingLabel: "Signing out…",
        errorLabel: "Unable to sign out.",
      }
    : {
        run: signIn.signIn,
        pending: signIn.pending,
        error: signIn.error,
        pendingLabel: "Signing in…",
        errorLabel: "Unable to sign in.",
      };
  const runAccountOperation = () => void accountOperation.run().catch(() => undefined);

  const formState = usePreferencesFormState({
    preferences,
    onSubmit: updatePreferences,
  });
  useKey("t", () => void navigate("/"));

  return (
    <AppLayout showHeader>
      <SettingsForm
        {...formState}
        identity={identity}
        version={__APP_VERSION__}
        isLoggedIn={isLoggedIn}
        onLogin={runAccountOperation}
        {...(isLoggedIn ? { onLogout: runAccountOperation } : {})}
        accountPending={accountOperation.pending}
        accountFeedback={
          <RemoteMutationNotice
            pending={accountOperation.pending}
            error={accountOperation.error}
            onRetry={runAccountOperation}
            pendingLabel={accountOperation.pendingLabel}
            errorLabel={accountOperation.errorLabel}
          />
        }
      />
    </AppLayout>
  );
};
