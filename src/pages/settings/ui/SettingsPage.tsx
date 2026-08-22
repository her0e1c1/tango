import type * as React from "react";
import { useNavigate } from "react-router-dom";
import { useKey } from "react-use";

import { routes } from "@/shared/router";
import { RemoteMutationNotice } from "@/shared/ui/remote-mutation-notice";
import { AppLayout } from "@/widgets/app-layout";

import { usePreferencesFormState } from "../model/usePreferencesFormState";
import { useSignIn } from "../model/useSignIn";
import { useSignOut } from "../model/useSignOut";
import { SettingsForm } from "./SettingsForm";

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();

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
  useKey("t", () => void navigate(routes.deckList.to()));

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
