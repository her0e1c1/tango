import * as React from "react";
import { useSelector } from "react-redux";
import { useKey } from "react-use";

import { ConfigFormTemplate } from "@src/features/settings/components/templates/ConfigFormTemplate";
import { useConfigFormState } from "@src/features/settings/hooks/useConfigFormState";
import * as selector from "@src/selector";
import { useActions } from "@src/shared/hooks/useActions";

export const ConfigContainer: React.FC = () => {
  const config = useSelector(selector.config.get());
  const actions = useActions();
  const configForm = useConfigFormState({
    config,
    version: __APP_VERSION__,
    isLoggedIn: !config.isAnonymous,
    onLogin: actions.login,
    onLogout: actions.logout,
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
