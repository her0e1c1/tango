import type * as React from "react";

import { setDarkMode, usePreferences } from "@/entities/preferences";
import { useNavigation } from "@/shared/routes";
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
        onClickLogo: () => void navigation.goToDeckList(),
        onClickImport: () => void navigation.goToDeckImport(),
        onClickSettings: () => void navigation.goToSettings(),
      }}
    />
  );
};
