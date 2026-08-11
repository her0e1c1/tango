/**
 * @file Connects application state and operations to the settings feature's Config Container view.
 * The container prepares route data and callbacks, then delegates visual rendering to presentation
 * components.
 */

import type * as React from "react";
import { useNavigate } from "react-router-dom";
import { useKey } from "react-use";

import * as action from "@/action";
import { ConfigFormTemplate } from "@/features/settings/components/templates/ConfigFormTemplate";
import { RemoteMutationNotice } from "@/shared/ui/remote-mutation-notice";
import { useAccountOperations } from "@/features/settings/hooks/useAccountOperations";
import { useConfigFormState } from "@/features/settings/hooks/useConfigFormState";
import { useSession } from "@/entities/session";
import { setDarkMode, updateConfig, useConfig } from "@/shared/config";

/**
 * Connects the Config Container view to stores, remote data, route parameters, and mutations.
 * It prepares plain props for presentation components so those components remain independent of
 * application services.
 */
export const ConfigContainer: React.FC = () => {
  const config = useConfig();
  const authState = useSession();
  const navigate = useNavigate();
  const authenticated = authState.status === "authenticated" ? authState : undefined;
  const identity = {
    uid: authenticated?.uid ?? "",
    displayName: authenticated?.displayName ?? null,
  };
  const account = useAccountOperations({
    generation: authenticated
      ? `authenticated:${authenticated.uid}:${authenticated.isAnonymous ? "anonymous" : "linked"}`
      : authState.status,
    login: action.event.loginGoogle,
    ...(authenticated ? { logout: () => action.event.logout(authenticated.uid) } : {}),
  });
  const configForm = useConfigFormState({
    config,
    identity,
    version: __APP_VERSION__,
    isLoggedIn: authenticated != null && !authenticated.isAnonymous,
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
    onSubmit: updateConfig,
  });
  useKey("t", () => void navigate("/"));

  return (
    <ConfigFormTemplate
      layout={{
        headerProps: {
          dark: config.appearance.darkMode,
          onClickDarkMode: setDarkMode,
          onClickLogo: () => void navigate("/"),
          onClickImport: () => void navigate("/import"),
          onClickSettings: () => void navigate("/settings"),
        },
      }}
      configForm={configForm}
    />
  );
};
