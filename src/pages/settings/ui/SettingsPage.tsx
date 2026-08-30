import type * as React from "react";
import { useNavigate } from "react-router-dom";
import { useKey } from "react-use";

import { routes } from "@/shared/router";
import { AppLayout } from "@/widgets/app-layout";

import { usePreferencesFormState } from "../model/usePreferencesFormState";
import { SettingsForm } from "./SettingsForm";

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const formState = usePreferencesFormState();
  useKey("t", () => void navigate(routes.deckList.to()));

  return (
    <AppLayout showHeader>
      <SettingsForm {...formState} version={__APP_VERSION__} commitHash={__COMMIT_HASH__} />
    </AppLayout>
  );
};
