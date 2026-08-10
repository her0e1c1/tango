import type * as React from "react";
import { useKey } from "react-use";

import { useAuth } from "@/shared/auth";
import { useAccountOperations, useConfigFormState } from "@/features/settings";
import { useActions } from "@/features/app-controls";
import { useConfig } from "@/entities/config";
import { RemoteMutationNotice } from "@/shared/ui/remote-mutation-notice";

import { loginGoogle, logout } from "../model/accountCommands";
import { SettingsView } from "./SettingsView";

export const SettingsPage: React.FC = () => {
  const config = useConfig();
  const authState = useAuth();
  const actions = useActions();
  const authenticated = authState.status === "authenticated" ? authState : undefined;
  const identity = {
    uid: authenticated?.uid ?? "",
    displayName: authenticated?.user.providerData[0]?.displayName ?? null,
  };
  const account = useAccountOperations({
    generation: authenticated
      ? `authenticated:${authenticated.uid}:${authenticated.user.isAnonymous ? "anonymous" : "linked"}`
      : authState.status,
    login: loginGoogle,
    ...(authenticated ? { logout: () => logout(authenticated.uid) } : {}),
  });
  const configForm = useConfigFormState({
    config,
    identity,
    version: __APP_VERSION__,
    isLoggedIn: authenticated != null && !authenticated.user.isAnonymous,
    onLogin: () => void account.login().catch(() => undefined),
    ...(authenticated ? { onLogout: () => void account.logout().catch(() => undefined) } : {}),
    accountPending: account.pending,
    accountFeedback: (
      <RemoteMutationNotice
        pending={account.pending}
        error={account.error}
        onRetry={() => void account.retry().catch(() => undefined)}
        pendingLabel={account.kind === "logout" ? "Signing out…" : "Signing in…"}
        errorLabel={account.kind === "logout" ? "Unable to sign out." : "Unable to sign in."}
      />
    ),
    onSubmit: actions.configUpdate,
  });
  useKey("t", actions.goToTop);

  return (
    <SettingsView
      layout={{
        headerProps: {
          dark: config.darkMode,
          onClickDarkMode: actions.setDarkMode,
          onClickLogo: actions.goToTop,
          onClickImport: actions.goToImport,
          onClickSettings: actions.goToSettings,
        },
      }}
      configForm={configForm}
    />
  );
};
