import type * as React from "react";
import { useKey } from "react-use";

import { SettingsForm, usePreferencesFormState } from "@/features/preferences-edit";
import { useSignIn } from "@/features/sign-in";
import { useSignOut } from "@/features/sign-out";
import { routes, useNavigation } from "@/features/navigate";
import { RemoteMutationNotice } from "@/shared/ui/remote-mutation-notice";
import { AppLayout } from "@/widgets/app-layout";

export const SettingsPage: React.FC = () => {
  const navigation = useNavigation();

  const signIn = useSignIn();
  const signOut = useSignOut();
  const { isLoggedIn } = signOut;
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

  const formState = usePreferencesFormState();
  useKey("t", () => void navigation.to(routes.deckList.to()));

  return (
    <AppLayout showHeader>
      <SettingsForm
        {...formState}
        identity={signOut.identity}
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
