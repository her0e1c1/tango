import React from "react";
import { useKey } from "react-use";
import { useSelector } from "react-redux";
import * as selector from "src/selector";
import { ConfigForm } from "src/component/Template";
import { useActions } from "./hooks";

export const ConfigPage: React.FC = () => {
  const config = useSelector(selector.config.get());
  const actions = useActions();
  useKey("t", actions.goToTop);
  return (
    <ConfigForm
      layout={{
        headerProps: {
          dark: config.darkMode,
          onClickDarkMode: actions.setDarkMode,
          onClickLogo: actions.goToTop,
          onClickMenuItem: actions.goByMenu,
        },
      }}
      configForm={{
        config,
        version: __APP_VERSION__,
        isLoggedIn: !config.isAnonymous,
        onLogin: actions.login,
        onLogout: actions.logout,
        onSubmit: actions.configUpdate,
      }}
    />
  );
};
