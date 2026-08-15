import type * as React from "react";
import { useNavigate } from "react-router-dom";
import { useKey } from "react-use";

import { AppLayout } from "@/widgets/app-layout";

import { SettingsContainer } from "./SettingsContainer";

interface SettingsPageProps {
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ login, logout }) => {
  const navigate = useNavigate();
  useKey("t", () => void navigate("/"));

  return (
    <AppLayout showHeader>
      <SettingsContainer login={login} logout={logout} version={__APP_VERSION__} />
    </AppLayout>
  );
};
