import type * as React from "react";
import { useNavigate } from "react-router-dom";

import { setDarkMode, useConfig } from "@/shared/config";
import { Layout } from "@/shared/ui/layout";

type AppLayoutProps = Omit<React.ComponentProps<typeof Layout>, "headerProps">;

export const AppLayout: React.FC<AppLayoutProps> = (props) => {
  const navigate = useNavigate();
  const config = useConfig();

  return (
    <Layout
      {...props}
      headerProps={{
        dark: config.appearance.darkMode,
        onClickDarkMode: setDarkMode,
        onClickLogo: () => void navigate("/"),
        onClickImport: () => void navigate("/import"),
        onClickSettings: () => void navigate("/settings"),
      }}
    />
  );
};
