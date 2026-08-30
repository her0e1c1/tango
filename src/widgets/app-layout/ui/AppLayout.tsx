import type * as React from "react";
import { useNavigate } from "react-router-dom";

import { setDarkMode, usePreferences } from "@/entities/preference";
import { routes } from "@/shared/router";
import { Layout } from "@/shared/ui/layout";

type AppLayoutProps = Omit<React.ComponentProps<typeof Layout>, "headerProps">;

export const AppLayout: React.FC<AppLayoutProps> = (props) => {
  const navigate = useNavigate();
  const preferences = usePreferences();
  // Application navigation must remain available while the page-owned shell scrolls.
  const { fixedHeader = true, ...layoutProps } = props;

  return (
    <Layout
      {...layoutProps}
      fixedHeader={fixedHeader}
      headerProps={{
        dark: preferences.appearance.darkMode,
        onClickDarkMode: setDarkMode,
        onClickLogo: () => void navigate(routes.deckList.to()),
        onClickImport: () => void navigate(routes.deckImport.to()),
        onClickAccount: () => void navigate(routes.account.to()),
        onClickSettings: () => void navigate(routes.settings.to()),
      }}
    />
  );
};
