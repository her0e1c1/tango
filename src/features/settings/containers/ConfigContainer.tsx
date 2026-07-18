import type * as React from "react";
import { useKey } from "react-use";

import { ConfigFormTemplate } from "@/features/settings/components/templates/ConfigFormTemplate";
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
  const configForm = useConfigFormState({
    config,
    identity,
    version: __APP_VERSION__,
    isLoggedIn: authenticated != null && !authenticated.user.isAnonymous,
    onLogin: actions.login,
    ...(authenticated ? { onLogout: () => actions.logout(authenticated.uid) } : {}),
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
