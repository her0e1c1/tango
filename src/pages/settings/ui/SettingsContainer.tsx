import type * as React from "react";

import { useAuthAccount, useAuthUid } from "@/entities/auth";
import { updatePreferences, usePreferences } from "@/entities/preferences";
import { SettingsForm, usePreferencesFormState } from "@/features/preferences-edit";
import { useSignIn } from "@/features/sign-in";
import { useSignOut } from "@/features/sign-out";
import { RemoteMutationNotice } from "@/shared/ui/remote-mutation-notice";

interface SettingsContainerProps {
  login: () => Promise<void>;
  logout: () => Promise<void>;
  version: string;
}

export const SettingsContainer: React.FC<SettingsContainerProps> = ({ login, logout, version }) => {
  const preferences = usePreferences();
  const authAccount = useAuthAccount();
  const authUid = useAuthUid();
  const isLoggedIn = authAccount != null;

  const signIn = useSignIn(login);
  const signOut = useSignOut(logout);
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
  // Mutation hooks retain rejected operations for feedback, so UI events consume the handled promise.
  const runAccountOperation = () => void accountOperation.run().catch(() => undefined);

  const formState = usePreferencesFormState({
    preferences,
    onSubmit: updatePreferences,
  });

  return (
    <SettingsForm
      {...formState}
      identity={{ uid: authUid, displayName: authAccount?.displayName ?? null }}
      version={version}
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
  );
};
