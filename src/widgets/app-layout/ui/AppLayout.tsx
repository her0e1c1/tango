import type * as React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { setDarkMode, usePreferences } from "@/entities/preference";
import { routes } from "@/shared/router";
import { Layout } from "@/shared/ui/layout";

type AppLayoutProps = Omit<React.ComponentProps<typeof Layout>, "headerProps">;

export const AppLayout: React.FC<AppLayoutProps> = (props) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const preferences = usePreferences();
  // Application navigation must remain available while the page-owned shell scrolls.
  const { fixedHeader = true, ...layoutProps } = props;

  return (
    <Layout
      {...layoutProps}
      fixedHeader={fixedHeader}
      headerProps={{
        dark: preferences.appearance.darkMode,
        labels: {
          switchToLightMode: t("header.switchToLightMode"),
          switchToDarkMode: t("header.switchToDarkMode"),
          importDecks: t("header.importDecks"),
          openAccount: t("header.openAccount"),
          openSettings: t("header.openSettings"),
        },
        onClickDarkMode: setDarkMode,
        onClickLogo: () => void navigate(routes.deckList.to()),
        onClickImport: () => void navigate(routes.deckImport.to()),
        onClickAccount: () => void navigate(routes.account.to()),
        onClickSettings: () => void navigate(routes.settings.to()),
      }}
    />
  );
};
