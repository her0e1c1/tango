import type * as React from "react";
import { useNavigate } from "react-router-dom";

import { setDarkMode, usePreferences } from "@/entities/preferences";
import { discardPromise } from "@/shared/lib/discardPromise";
import { Layout } from "@/shared/ui/layout";

type AppLayoutProps = Omit<React.ComponentProps<typeof Layout>, "headerProps">;

export const AppLayout: React.FC<AppLayoutProps> = (props) => {
  const navigate = useNavigate();
  const preferences = usePreferences();

  return (
    <Layout
      {...props}
      headerProps={{
        dark: preferences.appearance.darkMode,
        onClickDarkMode: setDarkMode,
        onClickLogo: () => {
          discardPromise(navigate("/"));
        },
        onClickImport: () => {
          discardPromise(navigate("/import"));
        },
        onClickSettings: () => {
          discardPromise(navigate("/settings"));
        },
      }}
    />
  );
};
