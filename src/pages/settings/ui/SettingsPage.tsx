import type * as React from "react";
import { useNavigate } from "react-router-dom";
import { useKey } from "react-use";

import { useAuthSession } from "@/entities/auth";
import { useSignIn } from "@/features/sign-in";
import { useSignOut } from "@/features/sign-out";
import { usePreferencesFormState } from "@/features/settings";
import { updatePreferences, usePreferences } from "@/entities/preferences";
import { RemoteMutationNotice } from "@/shared/ui/remote-mutation-notice";
import { AppLayout } from "@/widgets/app-layout";

import { SettingsView } from "./SettingsView";

interface SettingsPageProps {
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ login, logout }) => {
  const preferences = usePreferences();
  const authState = useAuthSession();
  const navigate = useNavigate();
  const authenticated = authState.status === "authenticated" ? authState : undefined;
  const identity = {
    uid: authenticated?.uid ?? "",
    displayName: authenticated?.displayName ?? null,
  };
  const linkedUser = authenticated != null && !authenticated.isAnonymous ? authenticated : undefined;
  const signIn = useSignIn(login);
  const signOut = useSignOut(linkedUser ? logout : undefined);
  const account = linkedUser ? { ...signOut, kind: "logout" as const } : { ...signIn, kind: "login" as const };
  const retryAccountOperation = account.kind === "logout" ? signOut.signOut : signIn.signIn;
  const preferencesFormState = usePreferencesFormState({
    preferences,
    onSubmit: updatePreferences,
  });
  useKey("t", () => void navigate("/"));

  return (
    <AppLayout showHeader>
      <SettingsView
        preferencesForm={{
          ...preferencesFormState,
          identity,
          version: __APP_VERSION__,
          isLoggedIn: linkedUser != null,
          onLogin: () => void signIn.signIn().catch(() => undefined),
          ...(linkedUser ? { onLogout: () => void signOut.signOut().catch(() => undefined) } : {}),
          accountPending: account.pending,
          accountFeedback: (
            <RemoteMutationNotice
              pending={account.pending}
              error={account.error}
              onRetry={() => void retryAccountOperation().catch(() => undefined)}
              pendingLabel={account.kind === "logout" ? "Signing out…" : "Signing in…"}
              errorLabel={account.kind === "logout" ? "Unable to sign out." : "Unable to sign in."}
            />
          ),
        }}
      />
    </AppLayout>
  );
};
