import type * as React from "react";
import { useKey } from "react-use";

import { ConfigFormTemplate } from "@/features/settings/components/templates/ConfigFormTemplate";
import { RemoteMutationNotice } from "@/components/feedback/RemoteMutationNotice";
import { useAccountOperations } from "@/features/settings/hooks/useAccountOperations";
import { useConfigFormState } from "@/features/settings/hooks/useConfigFormState";
import { useActions } from "@/hooks/useActions";
import { useAuth } from "@/auth/AuthContext";
import { useConfig } from "@/hooks/useConfig";

export const ConfigContainer: React.FC = () => {
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
    login: actions.login,
    ...(authenticated ? { logout: () => actions.logout(authenticated.uid) } : {}),
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
    <ConfigFormTemplate
      layout={{
        headerProps: {
          dark: config.darkMode,
          onClickDarkMode: actions.setDarkMode,
          onClickLogo: actions.goToTop,
          onClickMenuItem: actions.goByMenu,
        },
      }}
      configForm={configForm}
    />
  );
};
