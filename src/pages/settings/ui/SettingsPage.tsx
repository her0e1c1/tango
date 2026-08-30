import type * as React from "react";
import { useNavigate } from "react-router-dom";
import { useKey } from "react-use";

import { routes } from "@/shared/router";
import { AppLayout } from "@/widgets/app-layout";

import { usePreferencesForm } from "../model/usePreferencesForm";
import { SettingsForm } from "./SettingsForm";

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const state = usePreferencesForm();
  useKey("t", () => void navigate(routes.deckList.to()));

  return (
    <AppLayout showHeader>
      <SettingsForm
        form={state.form}
        studyPreferencesLimits={state.studyPreferencesLimits}
        version={__APP_VERSION__}
        commitHash={__COMMIT_HASH__}
      />
    </AppLayout>
  );
};
