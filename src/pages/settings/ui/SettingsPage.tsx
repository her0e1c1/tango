import type * as React from "react";
import { useKey } from "react-use";

import { useAuthAccount, useAuthUid } from "@/entities/auth";
import { updatePreferences, usePreferences } from "@/entities/preferences";
import { SettingsForm, usePreferencesFormState } from "@/features/preferences-edit";
import { useSignIn } from "@/features/sign-in";
import { useSignOut } from "@/features/sign-out";
import { useNavigation } from "@/shared/routes";
import { RemoteMutationNotice } from "@/shared/ui/remote-mutation-notice";
import { AppLayout } from "@/widgets/app-layout";

interface SettingsPageProps {
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ login, logout }) => {
  const preferences = usePreferences();
  const authAccount = useAuthAccount();
  const authUid = useAuthUid();
  const navigation = useNavigation();

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
  const runAccountOperation = () => void accountOperation.run().catch(() => undefined);

  const formState = usePreferencesFormState({
    preferences,
    onSubmit: updatePreferences,
  });
  useKey("t", () => void navigation.goToDeckList());

  return (
    <AppLayout showHeader>
      <SettingsForm
        {...formState}
        identity={{ uid: authUid, displayName: authAccount?.displayName ?? null }}
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
