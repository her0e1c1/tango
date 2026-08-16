import type * as React from "react";

import { setDarkMode, usePreferences } from "@/entities/preferences";
import { routes, useNavigation } from "@/features/navigate";
import { Layout } from "@/shared/ui/layout";

type AppLayoutProps = Omit<React.ComponentProps<typeof Layout>, "headerProps">;

export const AppLayout: React.FC<AppLayoutProps> = (props) => {
  const navigation = useNavigation();
  const preferences = usePreferences();

  return (
    <Layout
      {...props}
      headerProps={{
        dark: preferences.appearance.darkMode,
        onClickDarkMode: setDarkMode,
        onClickLogo: () => void navigation.to(routes.deckList.to()),
        onClickImport: () => void navigation.to(routes.deckImport.to()),
        onClickSettings: () => void navigation.to(routes.settings.to()),
      }}
    />
  );
};
