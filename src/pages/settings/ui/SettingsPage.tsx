import type * as React from "react";
import { useNavigate } from "react-router-dom";
import { useKey } from "react-use";

import { usePreferences, updatePreferences, studyPreferencesLimits } from "@/entities/preference";
import { usePreferencesAutoSave } from "../model/usePreferencesAutoSave";

import { routes } from "@/shared/router";
import { AppLayout } from "@/widgets/app-layout";

import { usePreferencesForm } from "../model/usePreferencesForm";
import { SettingsForm } from "./SettingsForm";

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const preferences = usePreferences();
  const form = usePreferencesForm(preferences);
  usePreferencesAutoSave(form, updatePreferences);
  useKey("t", () => void navigate(routes.deckList.to()));

  return (
    <AppLayout showHeader>
      <SettingsForm
        form={form}
        studyPreferencesLimits={studyPreferencesLimits}
        version={__APP_VERSION__}
        commitHash={__COMMIT_HASH__}
      />
    </AppLayout>
  );
};
