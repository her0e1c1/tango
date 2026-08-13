import type * as React from "react";
import { useNavigate } from "react-router-dom";
import { useKey } from "react-use";

import { useAuthSession } from "@/entities/auth-session";
import { useSignIn } from "@/features/auth/sign-in";
import { useSignOut } from "@/features/auth/sign-out";
import { useConfigFormState } from "@/features/settings";
import { setDarkMode, updateConfig, useConfig } from "@/shared/config";
import { Layout } from "@/shared/ui/layout";
import { RemoteMutationNotice } from "@/shared/ui/remote-mutation-notice";

import { SettingsView } from "./SettingsView";

interface SettingsPageProps {
  login: () => Promise<void>;
  logout: (uid: string) => Promise<void>;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ login, logout }) => {
  const config = useConfig();
  const authState = useAuthSession();
  const navigate = useNavigate();
  const authenticated = authState.status === "authenticated" ? authState : undefined;
  const identity = {
    uid: authenticated?.uid ?? "",
    displayName: authenticated?.displayName ?? null,
  };
  const linkedUser = authenticated != null && !authenticated.isAnonymous ? authenticated : undefined;
  const signIn = useSignIn(login);
  const signOut = useSignOut(linkedUser ? () => logout(linkedUser.uid) : undefined);
  const account = linkedUser ? { ...signOut, kind: "logout" as const } : { ...signIn, kind: "login" as const };
  const retryAccountOperation = account.kind === "logout" ? signOut.signOut : signIn.signIn;
  const configForm = useConfigFormState({
    config,
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
    onSubmit: updateConfig,
  });
  useKey("t", () => void navigate("/"));

  return (
    <Layout
      showHeader
      headerProps={{
        dark: config.appearance.darkMode,
        onClickDarkMode: setDarkMode,
        onClickLogo: () => void navigate("/"),
        onClickImport: () => void navigate("/import"),
        onClickSettings: () => void navigate("/settings"),
      }}
    >
      <SettingsView configForm={configForm} />
    </Layout>
  );
};
